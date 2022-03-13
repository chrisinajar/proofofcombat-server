import { ForbiddenError } from "apollo-server";

import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";
import type { BaseContext } from "schema/context";

import { AccessRole } from "types/graphql";

export function adminDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string
) {
  return mapSchema(schema, {
    // Executes once for each object field in the schema
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // Check whether this field has the specified directive
      const adminDirective = getDirective(
        schema,
        fieldConfig,
        directiveName
      )?.[0];

      if (adminDirective) {
        // Get this field's original resolver
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = async function (
          source,
          args,
          context: BaseContext,
          info
        ) {
          if (!context?.auth?.id) {
            throw new ForbiddenError("Missing auth");
          }
          const account = await context.db.account.get(context.auth.id);
          if (account.access !== AccessRole.Admin) {
            throw new ForbiddenError("Missing access");
          }
          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }
    },
  });
}
