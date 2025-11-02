import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  QuestDescription,
  LevelUpResponse,
  TalkResponse,
  InventoryItem,
} from "types/graphql";

import type { BaseContext } from "schema/context";

import { MapNames } from "../../constants";
import { specialLocations } from "../../helpers";
import { getBartenderAdvice } from "./text/bartender-advice";

import { getQuestDescription } from "./text/quest-descriptions";
import { checkHero, checkHeroGossip } from "./helpers";
import { getTreasureMapReadMessage } from "./treasure";
import { rebirth } from "./rebirth";

const resolvers: any = {
  Query: {
    async quest(parent: unknown, args: any): Promise<QuestDescription> {
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
    async talk(
      parent: unknown,
      args: any,
      context: BaseContext,
    ): Promise<TalkResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      let message: string;

      // Find a tavern at the hero's current location
      const here = specialLocations(
        hero.location.x,
        hero.location.y,
        hero.location.map as MapNames,
      );
      const tavern = here.find((loc) => loc.type === "tavern");

      if (!tavern) {
        message = "Find a tavern if you’re looking for advice.";
      } else if (!hero.questLog.tasteForBusiness?.finished) {
        // Gossip is only available after Taste for Business completes
        message = "The bartender ignores you.";
      } else {
        const lines = getBartenderAdvice(hero, tavern);
        if (lines.length) {
          // check for treasure map and roll for it..
          hero = checkHeroGossip(context, hero, hero.location);
          await context.db.hero.put(hero);
        }
        message = lines.join("\n");
      }

      return {
        hero,
        account,
        message,
      };
    },
    async readMap(
      parent: unknown,
      args: { itemId: string },
      context: BaseContext,
    ): Promise<TalkResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const itemId = args.itemId as string;
      const item = hero.inventory.find((i: InventoryItem) => i.id === itemId);
      if (!item) {
        throw new UserInputError("You do not have that item.");
      }
      if (item.baseItem !== "treasure-map") {
        throw new UserInputError("That item is not a readable map.");
      }

      const message = getTreasureMapReadMessage(hero, item.id);

      return { hero, account, message };
    },
    async rebirth(
      parent: unknown,
      args: any,
      context: BaseContext,
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
      parent: unknown,
      args: any,
      context: BaseContext,
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
