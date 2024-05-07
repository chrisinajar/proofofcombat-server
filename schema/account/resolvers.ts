import { ForbiddenError } from "apollo-server";

import {
  Resolvers,
  BaseAccount,
  LoginResponse,
  ChatResponse,
} from "types/graphql";
import type { BaseContext } from "schema/context";
import { tokenForAccount, sign } from "../../security";
import { hash } from "../../hash";

const resolvers: Resolvers = {
  Query: {
    async me(parent, args, context: BaseContext): Promise<LoginResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const account = await context.db.account.get(context.auth.id);

      return {
        now: `${Date.now()}`,
        account,
        token: tokenForAccount(account),
      };
    },
    async chat(parent, args, context: BaseContext): Promise<ChatResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
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
      context: BaseContext,
    ): Promise<BaseAccount> {
      const name = context.db.account.cleanName(args.name);
      const id = context.db.account.nameToId(args.name);
      const exists = await context.db.account.exists(id);
      if (exists) {
        throw new ForbiddenError("Username already exists");
      }
      const password = hash(args.password);
      const account = await context.db.account.put(
        context.db.account.upgrade({
          id,
          password,
          name,
          banned: false,
        }),
      );
      account.hero = await context.db.hero.create(account);

      console.log("Created a new account for", name);

      // authorize the rest of this request
      // this lets the hero field resolver work
      context.auth = account;

      return account;
    },
    async login(root, args, context: BaseContext): Promise<LoginResponse> {
      const id: string = context.db.account.nameToId(args.name);
      try {
        const account = await context.db.account.get(id);

        if (account.banned) {
          // password error just to mess with them
          await new Promise((resolve, reject) => {
            setTimeout(resolve, 10000);
          });
          throw new ForbiddenError("Incorrect username or password!");
        }

        const hashedPassword = hash(args.password);
        if (!account || account.password !== hashedPassword) {
          throw new ForbiddenError("Incorrect username or password!");
        }
        // authorize the rest of this request
        // this lets the hero field resolver work
        context.auth = account;
        return {
          now: `${Date.now()}`,
          account,
          token: tokenForAccount(account),
        };
      } catch (e) {
        throw new ForbiddenError("Incorrect username or password!");
      }
    },
  },
  BaseAccount: {
    async timeRemaining(parent, args, context: BaseContext) {
      // calculate time remaining based on nextAllowedAction

      return Math.max(0, Number(parent.nextAllowedAction) - Date.now());
    },
  },
};

export default resolvers;
