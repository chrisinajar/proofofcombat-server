import { ForbiddenError } from "apollo-server";

import {
  Resolvers,
  Hero,
  HealResponse,
  MonsterInstance,
  MoveResponse,
  MoveDirection,
} from "types/graphql";
import type { BaseContext } from "schema/context";

const resolvers: Resolvers = {
  Query: {},
  Mutation: {
    async heal(parent, args, context: BaseContext): Promise<HealResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const account = await context.db.account.get(context.auth.id);
      const hero = await context.db.hero.get(context.auth.id);
      console.log("Healing", hero.name);
      hero.combat.health = hero.combat.maxHealth;
      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
    async move(parent, args, context: BaseContext): Promise<MoveResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

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
  BaseAccount: {
    async hero(parent, args, context: BaseContext): Promise<Hero> {
      if (context?.auth?.id !== parent.id) {
        throw new ForbiddenError(
          "You do not have permission to access that hero"
        );
      }
      return context.db.hero.get(parent.id);
    },
  },
};

export default resolvers;
