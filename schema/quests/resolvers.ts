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
import { specialLocations } from "../../helpers";
import { getBartenderAdvice } from "./text/bartender-advice";

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

      // Find a tavern at the hero's current location
      const here = specialLocations(
        hero.location.x,
        hero.location.y,
        hero.location.map as MapNames,
      );
      const tavern = here.find((loc) => loc.type === "tavern");

      let message: string;
      if (!tavern) {
        message = "Find a tavern if you’re looking for advice.";
      } else {
        const lines = getBartenderAdvice(hero, tavern);
        message = lines.join("\n");
      }

      return {
        hero,
        account,
        message,
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
