import { ForbiddenError, UserInputError } from "apollo-server";

import { Resolvers, BaseAccount, AccountListResponse } from "types/graphql";

import { giveHeroItem } from "../items/helpers";
import { BaseItems } from "../items/base-items";

const resolvers: Resolvers = {
  Query: {
    async accounts(parent, args, context): Promise<AccountListResponse> {
      const accounts = await context.db.account.db.iterateFilter(
        (value, key) => {
          return true;
        }
      );

      return { accounts, count: accounts.length };
    },
    async account(parent, args, context): Promise<BaseAccount> {
      return context.db.account.get(args.id);
    },
  },

  Mutation: {
    async addLevels(parent, args, context): Promise<BaseAccount> {
      let hero = await context.db.hero.get(args.id);

      if (isNaN(args.levels) || !Number.isFinite(args.levels)) {
        throw new UserInputError("Bad level");
      }

      for (let i = 0; i < args.levels; ++i) {
        hero = context.db.hero.levelUp(hero);
      }

      await context.db.hero.put(hero);

      return context.db.account.get(args.id);
    },
    async setSkill(parent, args, context): Promise<BaseAccount> {
      const hero = await context.db.hero.get(args.id);

      if (isNaN(args.level) || !Number.isFinite(args.level)) {
        throw new UserInputError("Bad level");
      }
      if (!(args.skill in hero.skills)) {
        throw new UserInputError("Bad skill");
      }
      hero.skills[args.skill] = args.level;

      await context.db.hero.put(hero);

      return context.db.account.get(args.id);
    },
    async giveGold(parent, args, context): Promise<BaseAccount> {
      const hero = await context.db.hero.get(args.id);

      if (isNaN(args.amount) || !Number.isFinite(args.amount)) {
        throw new UserInputError("Bad amount");
      }

      hero.gold = Math.min(
        context.db.hero.maxGold(hero),
        Math.max(0, Math.round(hero.gold + args.amount))
      );
      await context.db.hero.put(hero);

      return context.db.account.get(args.id);
    },
    async createItem(parent, args, context): Promise<BaseAccount> {
      if (!BaseItems[args.baseItem]) {
        throw new UserInputError("Unknown base item");
      }
      const hero = await context.db.hero.get(args.id);

      giveHeroItem(
        context,
        hero,
        BaseItems[args.baseItem],
        args.enchantment || undefined
      );

      await context.db.hero.put(hero);

      return context.db.account.get(args.id);
    },
  },
};

export default resolvers;
