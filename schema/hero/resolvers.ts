import { ForbiddenError } from "apollo-server";

import { Resolvers, Hero, FightResult } from "types";
import type { ContextType } from "schema/context";

const resolvers: Resolvers = {
  Mutation: {
    async fight(parent, args, context: ContextType): Promise<FightResult> {
      if (!context.auth) {
        throw new ForbiddenError("You must be logged in");
      }
      console.log("Fighting a", args.monster);
      const hero = await context.db.hero.get(context.auth.id);

      return {
        victory: true,
      };
    },
  },
  BaseAccount: {
    async hero(parent, args, context: ContextType): Promise<Hero> {
      console.log(parent);
      if (context.auth && context.auth.id !== parent.id) {
        throw new ForbiddenError(
          "You do not have permission to access that hero"
        );
      }
      return context.db.hero.get(parent.id);
    },
  },
};

export default resolvers;
