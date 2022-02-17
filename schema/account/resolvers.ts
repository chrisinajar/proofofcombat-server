import { ForbiddenError } from "apollo-server";

import { Resolvers, BaseAccount, LoginResponse } from "types";
import type { ContextType } from "schema/context";
import { sign } from "../../security";
import { hash } from "../../hash";

const resolvers: Resolvers = {
  Query: {
    async login(root, args, context: ContextType): Promise<LoginResponse> {
      const id: string = context.db.account.nameToId(args.name);
      try {
        const data = await context.db.account.get(id);

        const hashedPassword = hash(args.password);
        if (!data || data.password !== hashedPassword) {
          throw new ForbiddenError("Incorrect username or password!");
        }
        // authorize the rest of this request
        // this lets the hero field resolver work
        context.auth = data;
        return {
          account: data,
          token: sign({
            id,
          }),
        };
      } catch (e) {
        throw new ForbiddenError("Incorrect username or password!");
      }
    },
  },
  Mutation: {
    async createAccount(
      root,
      args,
      context: ContextType
    ): Promise<BaseAccount> {
      const name = context.db.account.cleanName(args.name);
      const id = context.db.account.nameToId(args.name);
      const exists = await context.db.account.exists(id);
      if (exists) {
        throw new ForbiddenError("Username already exists");
      }
      const password = hash(args.password);
      const account = await context.db.account.put({
        id,
        password,
        name,
      });
      account.hero = await context.db.hero.create(account);

      // authorize the rest of this request
      // this lets the hero field resolver work
      context.auth = account;

      return account;
    },
  },
};

export default resolvers;
