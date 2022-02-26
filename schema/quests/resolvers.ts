import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  QuestDescription,
  Quest,
  LevelUpResponse,
} from "types/graphql";

import type { BaseContext } from "schema/context";

import { LocationData, MapNames } from "../../constants";

import { getQuestDescription } from "./text/quest-descriptions";
import { checkHero } from "./helpers";
import { rebirth } from "./rebirth";

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
    async rebirth(
      parent,
      args,
      context: BaseContext
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.level !== hero.levelCap) {
        throw new UserInputError("Cannot rebirth while below level cap.");
      }

      hero = rebirth(hero);

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
    async dismissQuest(
      parent,
      args,
      context: BaseContext
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      hero.currentQuest = null;

      hero = checkHero(hero);

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
  },
};

export default resolvers;
