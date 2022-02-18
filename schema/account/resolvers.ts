import { ForbiddenError } from "apollo-server";
import urlencode from "urlencode";

import { Resolvers, BaseAccount, LoginResponse, ChatResponse } from "types";
import type { ContextType, AuthorizedContextType } from "schema/context";
import { tokenForAccount, sign } from "../../security";
import { hash } from "../../hash";

const resolvers: Resolvers = {
  Query: {
    async me(
      parent,
      args,
      context: AuthorizedContextType
    ): Promise<LoginResponse> {
      const account = await context.db.account.get(context.auth.id);

      return {
        account,
        token: tokenForAccount(account),
      };
    },
    async chat(
      parent,
      args,
      context: AuthorizedContextType
    ): Promise<ChatResponse> {
      // todo: check banned
      // const account = await context.db.account.get(context.auth.id);
      const hero = await context.db.hero.get(context.auth.id);

      const chatToken = sign({
        chat: true,
        id: context.auth.id,
        name: hero.name,
      });

      return {
        token: chatToken,
      };
    },
  },
  Mutation: {
    async createAccount(
      root,
      args,
      context: ContextType
    ): Promise<BaseAccount> {
      const name = urlencode(context.db.account.cleanName(args.name));
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
    async login(root, args, context: ContextType): Promise<LoginResponse> {
      const id: string = context.db.account.nameToId(args.name);
      try {
        const account = await context.db.account.get(id);

        const hashedPassword = hash(args.password);
        if (!account || account.password !== hashedPassword) {
          throw new ForbiddenError("Incorrect username or password!");
        }
        // authorize the rest of this request
        // this lets the hero field resolver work
        context.auth = account;
        return {
          account,
          token: tokenForAccount(account),
        };
      } catch (e) {
        throw new ForbiddenError("Incorrect username or password!");
      }
    },
  },
};

export default resolvers;
