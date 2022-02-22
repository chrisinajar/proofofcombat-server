import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  QuestDescription,
  Quest,
  LevelUpResponse,
} from "types/graphql";

import type { BaseContext } from "schema/context";

import { getQuestDescription } from "./quest-descriptions";
import { LocationData, MapNames } from "../../constants";

const resolvers: Resolvers = {
  Query: {
    async quest(parent, args, context: BaseContext): Promise<QuestDescription> {
      return {
        id: args.quest,
        description: getQuestDescription(args.quest),
      };
    },
  },
  Mutation: {
    async dismissQuest(
      parent,
      args,
      context: BaseContext
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      hero.currentQuest = null;

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
  },
};

export default resolvers;
