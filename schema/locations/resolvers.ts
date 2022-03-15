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
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { LocationData, MapNames } from "../../constants";
import { specialLocations, distance2d } from "../../helpers";
import { hasQuestItem } from "../quests/helpers";
import { countEnchantments } from "../items/helpers";

import { getShopData, executeNpcTrade } from "./npc-shops";

function isAllowedThere(hero: Hero, location: Location): boolean {
  const destination =
    LocationData[location.map as MapNames]?.locations[location.x][location.y];

  const locations = specialLocations(
    location.x,
    location.y,
    location.map as MapNames
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

const resolvers: Resolvers = {
  Query: {
    async docks(
      parent,
      args,
      context: BaseContext
    ): Promise<SpecialLocation[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);

      if (args.map && hero.location.map !== args.map) {
        throw new ForbiddenError(
          "You may only get details about locations you're in."
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
      context: BaseContext
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
          "You may only get details about locations you're in."
        );
      }

      const terrain =
        LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
          hero.location.y
        ];

      return {
        location: targetLocation,
        terrain: terrain,
        specialLocations: specialLocations(
          hero.location.x,
          hero.location.y,
          hero.location.map as MapNames
        ).map((location) => ({ ...location, location: targetLocation })),
      };
    },
  },
  Mutation: {
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
        map: "default",
      };

      const cost = Math.round(
        Math.pow(distance2d(currentLocation, targetLocation) * 5, 1.3)
      );

      if (cost > hero.stats.intelligence) {
        throw new UserInputError(`You do not have enough intelligence!`);
      }

      if (!isAllowedThere(hero, targetLocation)) {
        throw new UserInputError(
          "You do not have the quest items needed to move there!"
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

      switch (args.direction) {
        case MoveDirection.North:
          hero.location.y = hero.location.y - 1;
          console.log(hero.name, "moving", args.direction);
          break;
        case MoveDirection.South:
          hero.location.y = hero.location.y + 1;
          console.log(hero.name, "moving", args.direction);
          break;
        case MoveDirection.East:
          hero.location.x = hero.location.x + 1;
          console.log(hero.name, "moving", args.direction);
          break;
        case MoveDirection.West:
          hero.location.x = hero.location.x - 1;
          console.log(hero.name, "moving", args.direction);
          break;
      }

      hero.location.y = Math.min(95, Math.max(0, hero.location.y));
      hero.location.x = Math.min(127, Math.max(0, hero.location.x));

      const destination =
        LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
          hero.location.y
        ];

      if (!isAllowedThere(hero, hero.location)) {
        throw new UserInputError(
          "You do not have the quest items needed to move there!"
        );
      }

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
        hero.location.map as MapNames
      ).find((location) => location.type === "dock");

      if (!currentDock) {
        throw new UserInputError("You can only sail while at a dock!");
      }

      const targetDock = specialLocations(
        args.x,
        args.y,
        hero.location.map as MapNames
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
  },
  MoveResponse: {
    async monsters(
      parent,
      args,
      context: BaseContext
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
      // return {
      //   id: parent.name,
      // name: String!
      // trades: [NpcShopTrade!]
    },
    async players(parent, args, context): Promise<PublicHero[]> {
      const heroList = await context.db.hero.getHeroesInLocation(
        parent.location
      );

      return heroList.map((hero) => ({
        id: hero.id,
        name: hero.name,
        level: hero.level,
        class: hero.class,
        local: true,

        combat: {
          health: hero.combat.health,
          maxHealth: hero.combat.maxHealth,
        },
      }));
    },
  },
};

export default resolvers;
