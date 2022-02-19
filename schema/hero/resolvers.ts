import { ForbiddenError } from "apollo-server";

import { Resolvers, Hero, FightResult } from "types";
import type { BaseContext } from "schema/context";

const resolvers: Resolvers = {
  Query: {},
  Mutation: {
    async heal(parent, args, context: BaseContext): Promise<Hero> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      hero.combat.health = hero.combat.maxHealth;
      await context.db.hero.put(context.auth.id);

      return hero;
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
