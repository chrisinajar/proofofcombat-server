import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  LocationDetails,
  SpecialLocation,
  MoveResponse,
  MoveDirection,
  MonsterInstance,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { LocationData, MapNames } from "../../constants";
import { specialLocations, distance2d } from "../../helpers";

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
    async teleport(parent, args, context: BaseContext): Promise<MoveResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.combat.health <= 0) {
        throw new UserInputError("You cannot move while dead!");
      }

      // const location =
      //   LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
      //     hero.location.y
      //   ];

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
      console.log({ location, destination });

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
};

export default resolvers;
