import { mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { authDirectiveTransformer } from "./directives/auth";
import { proofDirectiveTransformer } from "./directives/proof";
import { delayDirectiveTransformer } from "./directives/delay";
import typeDefs from "./typedefs";

import accountResolvers from "./account/resolvers";
import heroResolvers from "./hero/resolvers";
import monsterResolvers from "./monster/resolvers";
import questsResolvers from "./quests/resolvers";
import locationsResolvers from "./locations/resolvers";
import itemsResolvers from "./items/resolvers";

let schema = makeExecutableSchema({
  typeDefs,
  resolvers: mergeResolvers([
    accountResolvers,
    heroResolvers,
    monsterResolvers,
    questsResolvers,
    locationsResolvers,
    itemsResolvers,
  ]),
});

schema = authDirectiveTransformer(schema, "auth");
schema = proofDirectiveTransformer(schema, "proof");
schema = delayDirectiveTransformer(schema, "delay");

export default schema;
