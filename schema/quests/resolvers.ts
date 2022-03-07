import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  QuestDescription,
  Quest,
  LevelUpResponse,
  TalkResponse,
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
    /*
      ///@TODO Add text here to help players!
      maybe convert "appear here" quest events with having to talk to the bartender?
      maybe not...
      either way, it's a good idea to help people with text
      and flavor is cool
      but seriously fuck writing
    */
    async talk(parent, args, context): Promise<TalkResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      return {
        hero,
        account,
        message: "Go away.",
      };
    },
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

      hero = rebirth(context, hero);

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

      hero = checkHero(context, hero);

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
  },
};

export default resolvers;
