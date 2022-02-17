import { mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

import typeDefs from "./typedefs";

import accountResolvers from "./account/resolvers";
import heroResolvers from "./hero/resolvers";

export default makeExecutableSchema({
  typeDefs,
  resolvers: mergeResolvers([accountResolvers, heroResolvers]),
});
