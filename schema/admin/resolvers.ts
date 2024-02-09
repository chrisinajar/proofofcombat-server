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
        },
      );

      return { accounts, count: accounts.length };
    },
    async account(parent, args, context): Promise<BaseAccount> {
      return context.db.account.get(args.id);
    },
  },

  Mutation: {
    async banAccount(parent, args, context) {
      let account = await context.db.account.get(args.id);
      if (!account) {
        throw new UserInputError("Account not found");
      }
      account.banned = true;
      await context.db.account.put(account);
      return { success: true, account };
    },
    async unbanAccount(parent, args, context) {
      let account = await context.db.account.get(args.id);
      if (!account) {
        throw new UserInputError("Account not found");
      }
      account.banned = false;
      await context.db.account.put(account);
      return { success: true, account };
    },
    async deleteAccount(parent, args, context) {
      let account = await context.db.account.get(args.id);
      let hero = await context.db.hero.get(args.id);
      if (!account) {
        throw new UserInputError("Account not found");
      }
      await context.db.account.del(account);
      await context.db.hero.del(hero);
      const offersFromHero = await context.db.trades.offersFromHero(args.id);
      const offersForHero = await context.db.trades.offersForHero(args.id);

      await Promise.all(
        offersFromHero.map((offer) => context.db.trades.del(offer)),
      );
      await Promise.all(
        offersForHero.map((offer) => context.db.trades.del(offer)),
      );

      return { success: true };
    },
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
        Math.max(0, Math.round(hero.gold + args.amount)),
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
        args.enchantment || undefined,
      );

      await context.db.hero.put(hero);

      return context.db.account.get(args.id);
    },
  },
};

export default resolvers;
