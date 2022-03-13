import { ForbiddenError } from "apollo-server";

import { Resolvers, BaseAccount, AccountListResponse } from "types/graphql";

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
};

export default resolvers;
