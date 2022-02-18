import "dotenv/config";

import { ApolloServer } from "apollo-server";
import schema from "./schema";

import type { ContextType } from "./schema/context";
import db from "./db";
import { confirm } from "./security";

import "./socket";

// The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
  schema,
  context: async ({ res, req }): Promise<ContextType> => {
    let token = req.headers.authorization;
    const context: ContextType = { db };

    if (token) {
      if (token.toLowerCase().startsWith("bearer ")) {
        token = token.substr(7);
      }

      const data = confirm(token);
      if (data) {
        context.auth = data;
      }
    }

    return context;
  },
});

// The `listen` method launches a web server.
server.listen().then(({ url }) => {
  console.log(`🚀  Server ready at ${url}`);
});
