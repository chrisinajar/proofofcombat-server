import { mergeResolvers } from "@graphql-tools/merge";
import { makeExecutableSchema } from "@graphql-tools/schema";

import { authDirectiveTransformer } from "./directives/auth";
import { proofDirectiveTransformer } from "./directives/proof";
import { delayDirectiveTransformer } from "./directives/delay";
import { adminDirectiveTransformer } from "./directives/admin";
import typeDefs from "./typedefs";

import accountResolvers from "./account/resolvers";
import heroResolvers from "./hero/resolvers";
import monsterResolvers from "./monster/resolvers";
import questsResolvers from "./quests/resolvers";
import locationsResolvers from "./locations/resolvers";
import itemsResolvers from "./items/resolvers";
import adminResolvers from "./admin/resolvers";

import "./aberration";

let schema = makeExecutableSchema({
  typeDefs,
  resolvers: mergeResolvers([
    accountResolvers,
    heroResolvers,
    monsterResolvers,
    questsResolvers,
    locationsResolvers,
    itemsResolvers,
    adminResolvers,
  ]),
});

schema = authDirectiveTransformer(schema, "auth");
schema = proofDirectiveTransformer(schema, "proof");
schema = delayDirectiveTransformer(schema, "delay");
schema = adminDirectiveTransformer(schema, "admin");

export default schema;
