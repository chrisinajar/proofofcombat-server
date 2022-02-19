import { mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { authDirectiveTransformer } from "./directives/auth";
import { proofDirectiveTransformer } from "./directives/proof";
import typeDefs from "./typedefs";

import accountResolvers from "./account/resolvers";
import heroResolvers from "./hero/resolvers";
import monsterResolvers from "./monster/resolvers";

let schema = makeExecutableSchema({
  typeDefs,
  resolvers: mergeResolvers([
    accountResolvers,
    heroResolvers,
    monsterResolvers,
  ]),
});

schema = authDirectiveTransformer(schema, "auth");
schema = proofDirectiveTransformer(schema, "proof");

export default schema;
