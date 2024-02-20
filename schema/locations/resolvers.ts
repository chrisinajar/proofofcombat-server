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
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { LocationData, MapNames } from "../../constants";
import { specialLocations, distance2d } from "../../helpers";
import { Pathfinder } from "../../pathfinding";
import { hasQuestItem, checkCapital } from "../quests/helpers";
import { countEnchantments } from "../items/helpers";

import { getShopData, executeNpcTrade } from "./npc-shops";
import { CampUpgrades } from "./camp-upgrades";
import {
  payForBuilding,
  canAffordBuilding,
  Buildings,
  validBuildingLocationType,
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

      const upgradeList: PlayerLocationUpgradeDescription[] = [];

      upgradeList.push(...Object.values(CampUpgrades));

      return upgradeList
        .filter((upgrade) => {
          if (playerLocation.upgrades.indexOf(upgrade.type) > -1) {
            return false;
          }
          if (
            !upgrade.cost.reduce((canAfford, cost) => {
              const resource = playerLocation.resources.find(
                (res) => res.name === cost.name,
              );
              if (!resource) {
                return canAfford;
              }
              return canAfford && cost.value <= (resource.maximum ?? 0);
            }, true)
          ) {
            return false;
          }
          return true;
        })
        .slice(0, 3);
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
      capital.connections =
        await context.db.playerLocation.getConnections(capital);
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

      const newLocation = await context.db.playerLocation.put({
        id: context.db.playerLocation.locationId(targetLocation),
        type: buildingType,
        availableUpgrades: [],
        connections: [],
        location: targetLocation,
        owner: context.auth.id,
        resources: [],
        upgrades: [],
      });

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
      const upgrade = CampUpgrades[args.upgrade];
      if (!upgrade) {
        throw new UserInputError("Unknown upgrade!");
      }
      const isSettlement = upgrade.type === PlayerLocationUpgrades.Settlement;

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
      upgrade.cost.forEach((cost) => {
        if (!canAfford) {
          return;
        }
        if (cost.name === "gold") {
          canAfford = cost.value <= hero.gold;
          if (!canAfford) {
            resourceName = cost.name;
          }
          return;
        }
        const resource = camp.resources.find((res) => res.name === cost.name);
        if (!resource) {
          canAfford = false;
          resourceName = cost.name;
          return;
        }
        canAfford = resource.value >= cost.value;

        if (!canAfford) {
          resourceName = cost.name;
        }
      });

      if (!canAfford) {
        throw new UserInputError(
          `You do not have enough ${resourceName} for that upgrade!`,
        );
      }

      upgrade.cost.forEach((cost) => {
        if (cost.name === "gold") {
          hero.gold -= Math.round(cost.value);
          return;
        }
        const resource = camp.resources.find((res) => res.name === cost.name);
        if (!resource) {
          return;
        }
        resource.value -= Math.round(cost.value);
      });

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

      const goldCost = args.amount * resourceCost;

      if (hero.gold < goldCost) {
        throw new UserInputError(
          "You do not have enough gold to get those resources!",
        );
      }

      hero.gold -= Math.round(goldCost);

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

      // const currentLocations = specialLocations(
      //   hero.location.x,
      //   hero.location.y,
      //   hero.location.map as MapNames
      // );

      // const targetLocations = specialLocations(
      //   args.x,
      //   args.y,
      //   hero.location.map as MapNames
      // );

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
    async moveAStar(parent, args, context: BaseContext): Promise<MoveResponse> {
      // Ima just comment everything I did that is different from move

      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      // Needed to set the delay
      const now = Date.now();
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.combat.health <= 0) {
        throw new UserInputError("You cannot move while dead!");
      }

      const startLocation = { ...hero.location };
      // Declare the final desired location for final use
      // Also forces x and y to be in bounds
      const desiredLocation = {
        ...startLocation,
        x: Math.min(127, Math.max(0, args.x)),
        y: Math.min(95, Math.max(0, args.y)),
      };

      // Figure out at the start if they can go where they are clicking
      if (!isAllowedThere(hero, desiredLocation)) {
        throw new UserInputError(
          "You do not have the quest items needed to move there!",
        );
      }

      // See your own example
      function locationHash(loc: Location): string {
        return `${loc.x}-${loc.y}`;
      }

      // See your own example except for neighbors which now only pushes to results if the hero is allowed on that tile
      const pf = new Pathfinder<Location>({
        hash: locationHash,
        distance: (a: Location, b: Location): number =>
          Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
        cost: (a: Location): number => 1,
        neighbors: (a: Location): Location[] => {
          const results: Location[] = [];
          if (isAllowedThere(hero, { ...a, x: a.x + 1 }) && a.x + 1 < 128) {
            results.push({ ...a, x: a.x + 1 });
          }
          if (isAllowedThere(hero, { ...a, x: a.x - 1 }) && a.x - 1 > 0) {
            results.push({ ...a, x: a.x - 1 });
          }
          if (isAllowedThere(hero, { ...a, x: a.y + 1 }) && a.y + 1 < 96) {
            results.push({ ...a, y: a.y + 1 });
          }
          if (isAllowedThere(hero, { ...a, x: a.y - 1 }) && a.y - 1 > 0) {
            results.push({ ...a, y: a.y - 1 });
          }

          return results;
        },
      });

      // Find the path
      const path = await pf.findPath(desiredLocation, startLocation);

      // If the path cant be made or is too long? throw an error, maybe should be 2 different ones
      if (!path.success || path.path.length > 48) {
        throw new UserInputError("Could not find a valid path!");
      }

      //Teleport them to the destination
      hero.location = desiredLocation;
      //Set their delay to 500 * the length of the path
      account.nextAllowedAction += `${now + 500 * path.path.length}`;

      await context.db.hero.put(hero);
      await context.db.account.put(account);

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
      const playerLocation = await context.db.playerLocation.get(parent.owner);

      if (!playerLocation) {
        return [];
      }

      const upgradeList: PlayerLocationUpgradeDescription[] = [];

      upgradeList.push(...Object.values(CampUpgrades));

      return upgradeList
        .filter((upgrade) => {
          if (playerLocation.upgrades.indexOf(upgrade.type) > -1) {
            return false;
          }
          if (
            !upgrade.cost.reduce((canAfford, cost) => {
              const resource = playerLocation.resources.find(
                (res) => res.name === cost.name,
              );
              if (!resource) {
                return canAfford;
              }
              return canAfford && cost.value <= (resource.maximum ?? 0);
            }, true)
          ) {
            return false;
          }
          return true;
        })
        .slice(0, 3);
    },
  },
  SettlementManager: {
    async availableUpgrades(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      if (parent.id !== context.auth.id) {
        return [];
      }
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

      if (canAffordBuilding(parent.capital, PlayerLocationType.Farm)) {
        result.push(Buildings[PlayerLocationType.Farm]);
      }
      if (
        parent.capital.upgrades.indexOf(PlayerLocationUpgrades.HasBuiltFarm) < 0
      ) {
        console.log("has never built a farm");
        return result;
      }

      if (canAffordBuilding(parent.capital, PlayerLocationType.Apiary)) {
        result.push(Buildings[PlayerLocationType.Apiary]);
      }

      return result;
    },
  },
};

export default resolvers;
