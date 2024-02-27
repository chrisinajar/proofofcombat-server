import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  LocationDetails,
  SpecialLocation,
  MoveResponse,
  MoveDirection,
  MonsterInstance,
  NpcShop,
  NpcShopTradeResponse,
  EnchantmentType,
  Hero,
  Location,
  PublicHero,
  PlayerLocation,
  LevelUpResponse,
  CampResources,
  PlayerLocationType,
  PlayerLocationUpgrades,
  PlayerLocationUpgradeDescription,
  PlayerLocationBuildingDescription,
  SettlementManager,
  MilitaryUnitInput,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { LocationData, MapNames } from "../../constants";
import { specialLocations, distance2d } from "../../helpers";
import { Pathfinder } from "../../pathfinding";
import { hasQuestItem, checkCapital } from "../quests/helpers";
import { countEnchantments } from "../items/helpers";
import { checkTeleport } from "../quests/staff-of-teleportation";

import { getShopData, executeNpcTrade } from "./npc-shops";
import {
  CampUpgrades,
  SettlementUpgrades,
  getUpgradesForLocation,
} from "./camp-upgrades";
import {
  payForBuilding,
  shouldSeeBuilding,
  Buildings,
  validBuildingLocationType,
  DescribedBuildings,
} from "./settlement-buildings";

function isCloseToSpecialLocation(location: Location): boolean {
  return !!LocationData[location.map as MapNames].specialLocations.find(
    (specialLocation) => {
      return distance2d(specialLocation, location) < 4;
    },
  );
}

function isAllowedThere(hero: Hero, location: Location): boolean {
  const destination =
    LocationData[location.map as MapNames]?.locations[location.x][location.y];

  const locations = specialLocations(
    location.x,
    location.y,
    location.map as MapNames,
  );
  let isAllowed = true;

  locations.forEach((location) => {
    if (location.name === "Ancient Vault") {
      if (countEnchantments(hero, EnchantmentType.AncientKey) === 0) {
        isAllowed = false;
      }
    }
  });

  if (!isAllowed) {
    return false;
  }

  if (destination.terrain === "land" || destination.terrain === "water") {
    return true;
  }
  if (
    destination.terrain === "forbidden" &&
    countEnchantments(hero, EnchantmentType.CanTravelOnForbidden) > 0
  ) {
    return true;
  }
  return false;
  ``;
}

function createSettlementManager(
  context: BaseContext,
  hero: Hero,
  capital: PlayerLocation,
): SettlementManager {
  return {
    id: hero.id,
    capital,
    range: context.db.playerLocation.range(capital),
    availableUpgrades: [],
    availableBuildings: [],
    adjacentTiles: [],
  };
}

const resolvers: Resolvers = {
  Query: {
    async settlementManager(parent, args, context): Promise<SettlementManager> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const capital = await context.db.playerLocation.getHome(hero.id);

      if (!capital) {
        throw new UserInputError("You do not have a capital city");
      }

      await checkCapital(context, capital, hero);

      return createSettlementManager(context, hero, capital);
    },
    async availableUpgrades(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const playerLocation = await context.db.playerLocation.getHome(hero.id);

      // it's a query so we just return nothing instead of erroring on them
      if (!playerLocation) {
        return [];
      }

      const upgradeList: PlayerLocationUpgradeDescription[] =
        getUpgradesForLocation(playerLocation);

      return upgradeList.slice(0, 4);
    },
    async docks(
      parent,
      args,
      context: BaseContext,
    ): Promise<SpecialLocation[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);

      if (args.map && hero.location.map !== args.map) {
        throw new ForbiddenError(
          "You may only get details about locations you're in.",
        );
      }

      const map = hero.location.map as MapNames;

      return LocationData[map].specialLocations
        .filter((location) => location.type === "dock")
        .map((location) => ({
          name: location.name,
          type: location.type,
          location: { x: location.x, y: location.y, map },
        }));
    },
    async locationDetails(
      parent,
      args,
      context: BaseContext,
    ): Promise<LocationDetails> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);

      const targetLocation = {
        x: hero.location.x,
        y: hero.location.y,
        map: hero.location.map,
      };

      if (
        args.location &&
        (hero.location.x !== args.location.x ||
          hero.location.y !== args.location.y ||
          hero.location.map !== args.location.map)
      ) {
        throw new ForbiddenError(
          "You may only get details about locations you're in.",
        );
      }

      const terrain =
        LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
          hero.location.y
        ];

      const neighborTerrain = {
        north:
          hero.location.y > 0
            ? LocationData[hero.location.map as MapNames]?.locations[
                hero.location.x
              ][hero.location.y - 1]
            : null,

        south:
          hero.location.y < 95
            ? LocationData[hero.location.map as MapNames]?.locations[
                hero.location.x
              ][hero.location.y + 1]
            : null,

        east:
          hero.location.x < 127
            ? LocationData[hero.location.map as MapNames]?.locations[
                hero.location.x + 1
              ][hero.location.y]
            : null,

        west:
          hero.location.x > 0
            ? LocationData[hero.location.map as MapNames]?.locations[
                hero.location.x - 1
              ][hero.location.y]
            : null,
      };

      return {
        location: targetLocation,
        terrain: terrain,
        specialLocations: specialLocations(
          hero.location.x,
          hero.location.y,
          hero.location.map as MapNames,
        ).map((location) => ({ ...location, location: targetLocation })),
        neighborTerrain,
      };
    },
  },
  Mutation: {
    async moveTroups(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const home = await context.db.playerLocation.getHome(hero.id);
      if (!home) {
        throw new UserInputError("You don't have a working capital");
      }

      const unitTypes: (keyof MilitaryUnitInput)[] = [
        "enlisted",
        "soldier",
        "veteran",
        "ghost",
      ];

      const targetPlayerLocation = await context.db.playerLocation.get(
        context.db.playerLocation.locationId(args.target),
      );

      let resourceData = await Promise.all(
        unitTypes.map(async (resourceType) => {
          const resources = await context.db.playerLocation.getResourceData(
            home,
            resourceType,
          );

          const total = resources.reduce((memo, val) => {
            return memo + (val.resource?.value ?? 0);
          }, 0);

          const maximum = context.db.playerLocation.resourceStorage(
            targetPlayerLocation,
            resourceType,
          );

          const locationResource = targetPlayerLocation.resources.find(
            (r) => r.name === resourceType,
          );

          if (!locationResource) {
            throw new UserInputError(
              `Target location does not have storage for ${resourceType}`,
            );
          }

          return {
            resources,
            total,
            maximum,
            name: resourceType,
            locationResource,
          };
        }),
      );

      await Promise.all(
        unitTypes.map(async (unitName) => {
          if (!(unitName in args.units)) {
            throw new UserInputError(`Invalid input for value ${unitName}`);
          }
          const value = args.units[unitName];
          if (
            value === undefined ||
            value === null ||
            isNaN(value) ||
            !isFinite(value) ||
            value < 0
          ) {
            throw new UserInputError(`Invalid input for value ${unitName}`);
          }
          const data = resourceData.find((r) => r.name === unitName);
          if (!data) {
            throw new UserInputError(
              `Failed to find any ${unitName} in your empire`,
            );
          }
          if (data.total < value) {
            throw new UserInputError(
              `You do not have that many ${unitName} to move`,
            );
          }
          if (value + data.locationResource.value > data.maximum) {
            throw new UserInputError(
              `There is not enough storage for that many ${unitName} in the target location`,
            );
          }
        }),
      );

      await Promise.all(
        unitTypes.map(async (unitName) => {
          const amount = args.units[unitName] as number;
          const result = await context.db.playerLocation.spendResources(
            home,
            unitName,
            amount,
          );

          if (!result) {
            throw new Error(`Failed to spend resournce ${unitName}`);
          }
          const data = resourceData.find((r) => r.name === unitName);
          if (!data) {
            throw new UserInputError(
              `Failed to find any ${unitName} in your empire`,
            );
          }
          data.locationResource.value = data.locationResource.value + amount;
        }),
      );

      await context.db.playerLocation.put(targetPlayerLocation);

      return { location: targetPlayerLocation };
    },
    async attackLocation(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const targetLocation = args.target;

      const targetPlayerLocation = await context.db.playerLocation.get(
        context.db.playerLocation.locationId(targetLocation),
      );

      if (
        !targetPlayerLocation ||
        targetPlayerLocation.owner === context.auth.id
      ) {
        throw new UserInputError("Invalid attack target");
      }

      const targetHome = await context.db.playerLocation.getHome(
        targetPlayerLocation.owner,
      );
      const home = await context.db.playerLocation.getHome(context.auth.id);
      if (!home) {
        throw new UserInputError("You don't have a working capital");
      }

      const unitTypes: (keyof MilitaryUnitInput)[] = [
        "enlisted",
        "soldier",
        "veteran",
        "ghost",
      ];

      await Promise.all(
        unitTypes.map(async (unitType: keyof MilitaryUnitInput) => {
          const resources = await context.db.playerLocation.getResourceData(
            home,
            unitType,
          );

          if (targetHome) {
            const targetResources = (
              await context.db.playerLocation.getResourceData(
                targetHome,
                unitType,
              )
            ).filter((entry) => {
              return (
                Math.abs(entry.location.location.x - targetLocation.x) +
                  Math.abs(entry.location.location.y - targetLocation.y) <
                3
              );
            });
          }

          const total = resources.reduce(
            (memo, val) => memo + (val.resource?.value ?? 0),
            0,
          );

          const inputValue = args.units[unitType];

          if (
            inputValue == null ||
            inputValue > total ||
            isNaN(inputValue) ||
            !isFinite(inputValue)
          ) {
            throw new UserInputError(`Invalid number of ${unitType} specified`);
          }
        }),
      );

      // if (
      //   args.units.enlisted &&
      //   args.units.enlisted > 0 &&
      //   (await context.db.playerLocation.spendResources(
      //     home,
      //     "enlisted",
      //     args.units.enlisted,
      //   ))
      // ) {
      //   const enlistedCount = args.units.enlisted;
      //   console.log("sending enlisted...");
      // }

      throw new UserInputError("Attacking is currently disabled.");

      return { target: targetPlayerLocation };
    },
    async recruit(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const targetLocation = args.location;
      const playerLocation = await context.db.playerLocation.get(
        context.db.playerLocation.locationId(targetLocation),
      );

      if (playerLocation.owner !== context.auth.id) {
        throw new ForbiddenError(
          "You must own this location to recruit troops there",
        );
      }
      if (playerLocation.type !== PlayerLocationType.Barracks) {
        throw new UserInputError("You may only recruit troops at a barracks");
      }
      if (args.amount <= 0) {
        throw new UserInputError("You must recruit at least 1 troop");
      }

      const enlistedResource = playerLocation.resources.find(
        (res) => res.name === "enlisted",
      );

      if (!enlistedResource) {
        throw new Error("Could not find enlisted troop resource");
      }

      const cost = 1000000 * args.amount;
      const home = await context.db.playerLocation.getHome(hero.id);
      if (!home) {
        throw new UserInputError("You don't have a working capital");
      }
      if (cost > hero.gold) {
        const result = await context.db.playerLocation.spendResources(
          home,
          "bonds",
          Math.ceil(cost / 1000000),
        );

        if (!result) {
          throw new UserInputError("You cannot afford that many troops");
        }
      } else {
        hero.gold -= cost;
      }

      enlistedResource.value += args.amount;

      await context.db.playerLocation.put(playerLocation);
      await context.db.hero.put(hero);

      return { location: playerLocation };
    },
    async craftHoneyEssences(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const targetLocation = args.location;
      const playerLocation = await context.db.playerLocation.get(
        context.db.playerLocation.locationId(targetLocation),
      );

      if (playerLocation.owner !== context.auth.id) {
        throw new ForbiddenError("You must own this location to craft there");
      }
      if (playerLocation.type !== PlayerLocationType.Apiary) {
        throw new UserInputError(
          "You may only craft honey essences in an apiary",
        );
      }
      if (args.amount <= 0) {
        throw new UserInputError("You must craft at least 1 essence");
      }

      const cost = 1000000 * args.amount;
      const honeyResource = playerLocation.resources.find(
        (res) => res.name === "honey",
      );

      if (!honeyResource) {
        throw new Error("Could not find enlisted troop resource");
      }
      const honeyCost = 10 * args.amount;
      if (honeyResource.value < honeyCost) {
        throw new UserInputError("You cannot afford that many essences");
      }

      if (cost > hero.gold) {
        const home = await context.db.playerLocation.getHome(hero.id);
        if (!home) {
          throw new UserInputError("You don't have a working capital");
        }
        const result = await context.db.playerLocation.spendResources(
          home,
          "bonds",
          Math.ceil(cost / 1000000),
        );

        if (!result) {
          throw new UserInputError("You cannot afford that many essences");
        }
      } else {
        hero.gold -= cost;
      }

      honeyResource.value -= args.amount;

      await context.db.playerLocation.put(playerLocation);
      await context.db.hero.put(hero);

      return { location: playerLocation };
    },
    async buildFortifications(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const targetLocation = args.location;
      const playerLocation = await context.db.playerLocation.get(
        context.db.playerLocation.locationId(targetLocation),
      );

      if (playerLocation.owner !== context.auth.id) {
        throw new ForbiddenError(
          "You must own this location to build fortifications there",
        );
      }
      if (playerLocation.type !== PlayerLocationType.Garrison) {
        throw new UserInputError(
          "You may only build fortifications at a garrison",
        );
      }

      const fortificationsResource = playerLocation.resources.find(
        (res) => res.name === "fortifications",
      );
      if (!fortificationsResource) {
        throw new Error("Could not find fortifications resource");
      }

      if (args.amount <= 0) {
        throw new UserInputError("You must build at least 1 fortification");
      }

      const cost = 1000000 * args.amount;

      if (cost > hero.gold) {
        const home = await context.db.playerLocation.getHome(hero.id);
        if (!home) {
          throw new UserInputError("You don't have a working capital");
        }

        const result = await context.db.playerLocation.spendResources(
          home,
          "bonds",
          Math.ceil(cost / 1000000),
        );

        if (!result) {
          throw new UserInputError(
            "You cannot afford that many fortifications",
          );
        }
      } else {
        hero.gold -= cost;
      }

      fortificationsResource.value += args.amount;

      await context.db.playerLocation.put(playerLocation);
      await context.db.hero.put(hero);

      return { location: playerLocation };
    },
    async purchaseBonds(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const targetLocation = args.location;
      const playerLocation = await context.db.playerLocation.get(
        context.db.playerLocation.locationId(targetLocation),
      );

      if (playerLocation.owner !== context.auth.id) {
        throw new ForbiddenError(
          "You must own this location to purchase bonds there",
        );
      }
      if (playerLocation.type !== PlayerLocationType.Treasury) {
        throw new UserInputError("You may only purchase bonds at a treasury");
      }

      const bondsResource = playerLocation.resources.find(
        (res) => res.name === "bonds",
      );
      if (!bondsResource) {
        throw new Error("Could not find bonds resource");
      }

      if (args.amount <= 0) {
        const amount = 0 - args.amount;
        if (amount > bondsResource.value) {
          throw new UserInputError("You do not have that many bonds");
        }

        const cost = 1000000 * amount;
        hero.gold += cost;
        bondsResource.value -= amount;
      } else {
        const cost = 1000000 * args.amount;

        if (cost > hero.gold) {
          const home = await context.db.playerLocation.getHome(hero.id);
          if (!home) {
            throw new UserInputError("You don't have a working capital");
          }
          const result = await context.db.playerLocation.spendResources(
            home,
            "bonds",
            Math.ceil(args.amount),
          );

          if (!result) {
            throw new UserInputError("You cannot afford that many bonds");
          }
        } else {
          hero.gold -= cost;
        }
        bondsResource.value += args.amount;
      }
      await context.db.playerLocation.put(playerLocation);
      await context.db.hero.put(hero);

      return { location: playerLocation };
    },

    async destroyBuilding(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);
      const targetLocation = args.location;
      const playerLocation = await context.db.playerLocation.get(
        context.db.playerLocation.locationId(targetLocation),
      );

      if (!playerLocation || playerLocation.owner !== hero.id) {
        throw new UserInputError("You do not own a building on that location");
      }

      await context.db.playerLocation.del(playerLocation);

      return { hero, account };
    },
    async buildBuilding(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);
      const capital = await context.db.playerLocation.getHome(hero.id);
      if (!capital) {
        throw new UserInputError("You do not own a settlement.");
      }
      const targetLocation = args.location;
      let existingPlayerLocation: PlayerLocation | null = null;
      try {
        existingPlayerLocation = await context.db.playerLocation.get(
          context.db.playerLocation.locationId(targetLocation),
        );
      } catch (e) {}

      if (existingPlayerLocation) {
        throw new UserInputError(
          "There is already something built on that square.",
        );
      }

      function locationHash(loc: Location): string {
        return `${loc.x}-${loc.y}`;
      }
      const locationCoords = {
        [locationHash(capital.location)]: capital.location,
      };
      capital.connections = await context.db.playerLocation.getConnections(
        capital,
      );
      capital.connections.forEach((loc) => {
        locationCoords[locationHash(loc.location)] = loc.location;
      });
      const pf = new Pathfinder<Location>({
        hash: locationHash,
        distance: (a: Location, b: Location): number =>
          Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
        cost: (a: Location): number => 1,
        neighbors: (a: Location): Location[] => {
          const results: Location[] = [];
          if (locationCoords[locationHash({ ...a, x: a.x + 1 })]) {
            results.push(locationCoords[locationHash({ ...a, x: a.x + 1 })]);
          }
          if (locationCoords[locationHash({ ...a, x: a.x - 1 })]) {
            results.push(locationCoords[locationHash({ ...a, x: a.x - 1 })]);
          }
          if (locationCoords[locationHash({ ...a, y: a.y + 1 })]) {
            results.push(locationCoords[locationHash({ ...a, y: a.y + 1 })]);
          }
          if (locationCoords[locationHash({ ...a, y: a.y - 1 })]) {
            results.push(locationCoords[locationHash({ ...a, y: a.y - 1 })]);
          }

          return results;
        },
      });

      const path = await pf.findPath(targetLocation, capital.location);

      if (!path.success) {
        throw new UserInputError(
          "That location has no connection to your capital",
        );
      }
      console.log(path);
      // range? i dunno man... i'll get to it
      if (path.path.length > context.db.playerLocation.range(capital)) {
        throw new UserInputError(
          "That location is too far away from your capital",
        );
      }
      const buildingType = args.type;
      if (!validBuildingLocationType(buildingType)) {
        throw new UserInputError("Invalid location type");
      }

      if (!payForBuilding(capital, buildingType)) {
        throw new UserInputError(
          "You do not have enough resources for that building",
        );
      }

      const newLocation = await context.db.playerLocation.put(
        context.db.playerLocation.upgrade({
          id: context.db.playerLocation.locationId(targetLocation),
          type: buildingType,
          availableUpgrades: [],
          connections: [],
          location: targetLocation,
          owner: context.auth.id,
          resources: [],
          upgrades: [],
        }),
      );

      capital.connections.push(newLocation);
      if (
        newLocation.type === PlayerLocationType.Farm &&
        capital.upgrades.indexOf(PlayerLocationUpgrades.HasBuiltFarm) === -1
      ) {
        capital.upgrades.push(PlayerLocationUpgrades.HasBuiltFarm);
      }

      await context.db.playerLocation.put(capital);

      return {
        hero,
        account,
        settlement: createSettlementManager(context, hero, capital),
      };
    },
    async upgradeCamp(parent, args, context) {
      // upgrade: PlayerLocationUpgrades)
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);
      const camp = await context.db.playerLocation.getHome(hero.id);

      if (!camp) {
        throw new UserInputError("You do not own a camp!");
      }

      if (camp.upgrades.find((entry) => entry === args.upgrade)) {
        throw new UserInputError("You already own that upgrade!");
      }
      const isSettlement = args.upgrade === PlayerLocationUpgrades.Settlement;
      const upgrade =
        CampUpgrades[args.upgrade] || SettlementUpgrades[args.upgrade];

      if (!upgrade) {
        throw new UserInputError("Unknown upgrade!");
      }

      if (isSettlement) {
        if (isCloseToSpecialLocation(camp.location)) {
          throw new UserInputError(
            "You are too close to a special location to create a settlement.",
          );
        }
        let existingSettlement: PlayerLocation | null = null;
        try {
          existingSettlement = await context.db.playerLocation.get(
            context.db.playerLocation.locationId(camp.location),
          );
        } catch (e) {}
        if (existingSettlement) {
          if (existingSettlement.owner !== hero.id) {
            throw new UserInputError(`There is already a settlement there!`);
          } else {
            await context.db.playerLocation.del(existingSettlement);
          }
        }
      }

      let canAfford = true;
      let resourceName = "";

      await upgrade.cost.reduce<Promise<void>>(async (memo, cost) => {
        // let previous run fully first
        await memo;
        if (!canAfford) {
          return;
        }

        const resources = await context.db.playerLocation.getResourceData(
          camp,
          cost.name,
        );

        const total = resources.reduce((memo, val) => {
          return memo + val.resource.value;
        }, 0);

        if (cost.name === "gold") {
          canAfford = cost.value <= hero.gold;
          if (!canAfford) {
            resourceName = cost.name;
          }
          return;
        }
        if (total < cost.value) {
          canAfford = false;
          resourceName = cost.name;
          return;
        }
      }, new Promise((resolve) => resolve()));

      if (!canAfford) {
        throw new UserInputError(
          `You do not have enough ${resourceName} for that upgrade!`,
        );
      }

      await Promise.all(
        upgrade.cost.map(async (cost) => {
          if (cost.name === "gold") {
            hero.gold -= Math.round(cost.value);
            return;
          }

          const result = await context.db.playerLocation.spendResources(
            camp,
            cost.name,
            cost.value,
          );
          if (!result) {
            throw new UserInputError(
              `You do not have enough ${cost.name} for that upgrade!`,
            );
          }
        }),
      );

      camp.upgrades.push(upgrade.type);

      await context.db.hero.put(hero);

      if (isSettlement) {
        camp.type = PlayerLocationType.Settlement;
        const settlement = { ...(await context.db.playerLocation.put(camp)) };
        await context.db.playerLocation.put(settlement);
        return { hero, account, camp: settlement };
      } else {
        await context.db.playerLocation.put(camp);
      }

      return { hero, account, camp };
    },
    async buyResource(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);
      const camp = await context.db.playerLocation.getHome(hero.id);

      if (!camp) {
        throw new UserInputError("You do not own a camp!");
      }

      if (args.amount < 1) {
        throw new UserInputError("Invalid amount!");
      }

      const resourceCost = context.db.playerLocation.resourceCost(
        args.resource,
      );

      if (!resourceCost) {
        throw new UserInputError("You cannot purchase that resource");
      }

      const goldCost = Math.round(args.amount * resourceCost);

      if (hero.gold < goldCost) {
        const home = await context.db.playerLocation.getHome(hero.id);
        if (!home) {
          throw new UserInputError("You don't have a working capital");
        }
        const result = await context.db.playerLocation.spendResources(
          home,
          "bonds",
          Math.ceil(goldCost / 1000000),
        );

        if (!result) {
          throw new UserInputError(
            "You do not have enough gold to get those resources!",
          );
        }
      } else {
        hero.gold -= goldCost;
      }

      context.db.playerLocation.addResource(camp, args.resource, args.amount);
      await context.db.playerLocation.put(camp);
      await context.db.hero.put(hero);
      return { hero, account };
    },
    async sellResource(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);
      const camp = await context.db.playerLocation.getHome(hero.id);

      if (!camp) {
        throw new UserInputError("You do not own a camp!");
      }

      if (args.amount < 1) {
        throw new UserInputError("Invalid amount!");
      }

      const resource = camp.resources.find((res) => res.name === args.resource);
      if (!resource) {
        throw new UserInputError("Invalid resource!");
      }
      if (resource.value < args.amount) {
        throw new UserInputError(
          `You do not have enough ${args.resource} to get those resources!`,
        );
      }

      const resourceCost = context.db.playerLocation.resourceCost(
        args.resource,
      );

      if (!resourceCost) {
        throw new UserInputError("You cannot sell that resource");
      }

      const goldAmount = args.amount * resourceCost;

      resource.value -= Math.round(args.amount);
      hero.gold += Math.round(goldAmount);

      await context.db.playerLocation.put(camp);
      await context.db.hero.put(hero);
      return { hero, account };
    },
    async npcTrade(parent, args, context): Promise<NpcShopTradeResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const result = await executeNpcTrade(context, hero, args.trade);

      return {
        ...result,
        hero,
        account,
      };
    },
    async teleport(parent, args, context: BaseContext): Promise<MoveResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.combat.health <= 0) {
        throw new UserInputError("You cannot move while dead!");
      }

      const currentLocation = hero.location;
      const targetLocation = {
        x: Math.min(127, Math.max(0, args.x)),
        y: Math.min(95, Math.max(0, args.y)),
        map: hero.location.map,
      };

      const cost = Math.round(
        Math.pow(distance2d(currentLocation, targetLocation) * 5, 1.3),
      );

      if (cost > hero.stats.intelligence) {
        throw new UserInputError(`You do not have enough intelligence!`);
      }

      if (!isAllowedThere(hero, targetLocation)) {
        throw new UserInputError(
          "You do not have the quest items needed to move there!",
        );
      }

      if (checkTeleport(context, hero)) {
        await context.db.hero.put(hero);

        return {
          hero,
          account,
          monsters: [],
        };
      }

      hero.location.x = targetLocation.x;
      hero.location.y = targetLocation.y;

      await context.db.hero.put(hero);

      return {
        hero,
        account,
        monsters: [],
      };
    },

    async voidTravel(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.combat.health <= 0) {
        throw new UserInputError("You cannot move while dead!");
      }
      if (hero.level !== hero.levelCap) {
        throw new UserInputError(
          "You must be at max level before you may enter the void world.",
        );
      }

      if (countEnchantments(hero, EnchantmentType.VoidTravel) === 0) {
        throw new UserInputError(
          "You do not have the ability to travel in the void!",
        );
      }

      if (hero.location.map === "void") {
        hero.location = { x: 64, y: 44, map: "default" };
      } else {
        hero.location = {
          x: Math.floor(Math.random() * 128),
          y: Math.floor(Math.random() * 96),
          map: "void",
        };
      }

      await context.db.hero.put(hero);

      return {
        hero,
        account,
        monsters: [],
      };
    },
    async move(parent, args, context: BaseContext): Promise<MoveResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.combat.health <= 0) {
        throw new UserInputError("You cannot move while dead!");
      }

      const location =
        LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
          hero.location.y
        ];

      const heroLocation = { ...hero.location };

      switch (args.direction) {
        case MoveDirection.North:
          heroLocation.y = heroLocation.y - 1;
          console.log(hero.name, "moving", args.direction);
          break;
        case MoveDirection.South:
          heroLocation.y = heroLocation.y + 1;
          console.log(hero.name, "moving", args.direction);
          break;
        case MoveDirection.East:
          heroLocation.x = heroLocation.x + 1;
          console.log(hero.name, "moving", args.direction);
          break;
        case MoveDirection.West:
          heroLocation.x = heroLocation.x - 1;
          console.log(hero.name, "moving", args.direction);
          break;
      }

      heroLocation.y = Math.min(95, Math.max(0, heroLocation.y));
      heroLocation.x = Math.min(127, Math.max(0, heroLocation.x));

      const destination =
        LocationData[heroLocation.map as MapNames]?.locations[heroLocation.x][
          heroLocation.y
        ];

      if (!isAllowedThere(hero, heroLocation)) {
        throw new UserInputError(
          "You do not have the quest items needed to move there!",
        );
      }

      hero.location = heroLocation;

      await context.db.hero.put(hero);

      return {
        hero,
        account,
        monsters: [],
      };
    },
    async sail(parent, args, context: BaseContext): Promise<MoveResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.combat.health <= 0) {
        throw new UserInputError("You cannot move while dead!");
      }

      const location =
        LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
          hero.location.y
        ];

      const currentDock = specialLocations(
        hero.location.x,
        hero.location.y,
        hero.location.map as MapNames,
      ).find((location) => location.type === "dock");

      if (!currentDock) {
        throw new UserInputError("You can only sail while at a dock!");
      }

      const targetDock = specialLocations(
        args.x,
        args.y,
        hero.location.map as MapNames,
      ).find((location) => location.type === "dock");

      if (!targetDock) {
        throw new UserInputError(`There is no dock at ${(args.x, args.y)}!`);
      }

      const cost = Math.round(distance2d(currentDock, targetDock) * 12);

      if (cost > hero.gold) {
        throw new UserInputError(`You cannot afford to sail there!`);
      }
      hero.gold = Math.round(hero.gold - cost);

      hero.location.x = targetDock.x;
      hero.location.y = targetDock.y;

      await context.db.hero.put(hero);

      return {
        hero,
        account,
        monsters: [],
      };
    },
    async settleCamp(parent, args, context): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const campCost = 100000;

      if (hero.gold < campCost) {
        throw new UserInputError(
          "You do not have enough gold to settle a camp!",
        );
      }

      const locations = specialLocations(
        hero.location.x,
        hero.location.y,
        hero.location.map as MapNames,
      );

      if (locations.length) {
        throw new UserInputError(
          "You cannot settle a camp on a special location!",
        );
      }

      hero.gold -= campCost;

      const playerLocation = await context.db.playerLocation.createCamp(hero);

      return { hero, account };
    },
  },
  MoveResponse: {
    async monsters(
      parent,
      args,
      context: BaseContext,
    ): Promise<MonsterInstance[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      return context.db.monsterInstances.getInLocation(parent.hero.location);
    },
  },
  LocationDetails: {
    async shop(parent, args, context): Promise<NpcShop | null> {
      if (!parent.specialLocations || !parent.specialLocations.length) {
        return null;
      }
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const [location] = parent.specialLocations;

      return getShopData(context, hero, location);
    },
    async voidTravel(parent, args, context): Promise<boolean> {
      if (!parent.specialLocations || !parent.specialLocations.length) {
        return false;
      }
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const [location] = parent.specialLocations;

      // more later probably
      return location.name === "Altar of Transcendence";
    },
    async players(parent, args, context): Promise<PublicHero[]> {
      const heroList = await context.db.hero.getHeroesInLocation(
        parent.location,
      );

      return heroList.map((hero) => context.db.hero.publicHero(hero, true));
    },
    async playerLocations(parent, args, context): Promise<PlayerLocation[]> {
      try {
        return [
          await context.db.playerLocation.get(
            context.db.playerLocation.locationId(parent.location),
          ),
        ];
      } catch (e) {}
      return [];
    },
  },
  PlayerLocation: {
    async resources(parent, args, context): Promise<CampResources[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      if (parent.owner !== context.auth.id) {
        return [];
      }
      return parent.resources;
    },
    async upkeep(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      return context.db.playerLocation.calculateUpkeepCosts(parent);
    },

    async publicOwner(parent, args, context): Promise<PublicHero> {
      const hero = await context.db.hero.get(parent.owner);
      return context.db.hero.publicHero(hero, true);
    },

    async connections(parent, args, context): Promise<PlayerLocation[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      if (parent.owner !== context.auth.id) {
        return [];
      }
      const home = await context.db.playerLocation.getHome(parent.owner);
      // only link from home
      if (!home || home.id !== parent.id) {
        return [];
      }

      return context.db.playerLocation.getConnections(home);
    },

    async availableUpgrades(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      if (parent.owner !== context.auth.id) {
        return [];
      }
      const hero = await context.db.hero.get(context.auth.id);
      const playerLocation = parent;

      if (!playerLocation) {
        return [];
      }

      const upgradeList: PlayerLocationUpgradeDescription[] =
        getUpgradesForLocation(playerLocation);

      return upgradeList.slice(0, 3);
    },
  },
  SettlementManager: {
    async adjacentTiles(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const connections = await context.db.playerLocation.getConnections(
        parent.capital,
      );
      const foundEdges = {
        [parent.capital.location.x]: {
          [parent.capital.location.y]: false,
        },
      };
      const knownLocations = {
        [parent.capital.location.x]: {
          [parent.capital.location.y]: true,
        },
      };
      function checkEdge(x: number, y: number) {
        if (x < 0 || y < 0 || x >= 128 || y >= 96) {
          return false;
        }
        if (knownLocations[x]?.[y]) {
          return false;
        }
        if (!foundEdges[x]) {
          foundEdges[x] = {};
        }
        foundEdges[x][y] = true;
      }
      function checkLocation(location: PlayerLocation) {
        if (!knownLocations[location.location.x]) {
          knownLocations[location.location.x] = {};
        }
        knownLocations[location.location.x][location.location.y] = true;
        if (foundEdges[location.location.x]) {
          foundEdges[location.location.x][location.location.y] = false;
        }
        checkEdge(location.location.x + 1, location.location.y);
        checkEdge(location.location.x - 1, location.location.y);
        checkEdge(location.location.x, location.location.y + 1);
        checkEdge(location.location.x, location.location.y - 1);
      }
      connections.forEach(checkLocation);
      checkLocation(parent.capital);

      const edges: PlayerLocation[] = [];
      await Promise.all(
        Object.keys(foundEdges).map(async (xStr) => {
          const x = Number(xStr);
          await Promise.all(
            Object.keys(foundEdges[x]).map(async (yStr) => {
              const y = Number(yStr);
              if (!foundEdges[x][y]) {
                return;
              }
              try {
                const playerLocation = await context.db.playerLocation.get(
                  context.db.playerLocation.locationId({
                    x,
                    y,
                    map: parent.capital.location.map,
                  }),
                );
                edges.push(playerLocation);
              } catch (e) {}
            }),
          );
        }),
      );

      return edges;
    },
    async availableUpgrades(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      if (parent.id !== context.auth.id) {
        return [];
      }

      // get fucked i guess
      return [];
    },
    async availableBuildings(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      if (parent.id !== context.auth.id) {
        return [];
      }

      const result: PlayerLocationBuildingDescription[] = [];

      if (shouldSeeBuilding(parent.capital, PlayerLocationType.Farm)) {
        result.push(Buildings[PlayerLocationType.Farm]);
      }
      if (
        parent.capital.upgrades.indexOf(PlayerLocationUpgrades.HasBuiltFarm) < 0
      ) {
        // console.log("has never built a farm");
        return result;
      }

      const buildingsAfterFarm: DescribedBuildings[] = [
        PlayerLocationType.Apiary,
        PlayerLocationType.Treasury,
      ];
      buildingsAfterFarm.forEach((type) => {
        if (shouldSeeBuilding(parent.capital, type)) {
          result.push(Buildings[type]);
        }
      });

      const hero = await context.db.hero.get(context.auth.id);
      if (countEnchantments(hero, EnchantmentType.UpgradedSettlement) === 0) {
        return result;
      }

      const buildingsAfterGovernorsTitle: DescribedBuildings[] = [
        PlayerLocationType.Barracks,
        PlayerLocationType.Garrison,
      ];
      buildingsAfterGovernorsTitle.forEach((type) => {
        if (shouldSeeBuilding(parent.capital, type)) {
          result.push(Buildings[type]);
        }
      });

      return result;
    },
  },
  PlayerLocationResponse: {
    async account(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      return context.db.account.get(context.auth.id);
    },
  },
};

export default resolvers;
