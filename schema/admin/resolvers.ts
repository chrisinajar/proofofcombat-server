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
