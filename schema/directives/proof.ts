import { ForbiddenError } from "apollo-server";

import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";
import type { ContextType } from "schema/context";

export function proofDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string
) {
  return mapSchema(schema, {
    // Executes once for each object field in the schema
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // Check whether this field has the specified directive
      const proofDirective = getDirective(
        schema,
        fieldConfig,
        directiveName
      )?.[0];

      if (proofDirective) {
        // Get this field's original resolver
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = async function (
          source,
          args,
          context: ContextType,
          info
        ) {
          console.log("proov it!");
          // do nothing for now, placeholder basically..
          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }
    },
  });
}
