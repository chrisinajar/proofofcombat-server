import { ForbiddenError, UserInputError } from "apollo-server";

import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";
import type { BaseContext } from "schema/context";

export function delayDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string
) {
  return mapSchema(schema, {
    // Executes once for each object field in the schema
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // Check whether this field has the specified directive
      const delayDirective = getDirective(
        schema,
        fieldConfig,
        directiveName
      )?.[0];

      if (delayDirective) {
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
          const now = Date.now();
          const account = await context.db.account.get(context.auth.id);

          if (account.banned) {
            if (!context?.auth?.id) {
              throw new ForbiddenError("You are banned");
            }
          }
          const nextAllowedAction = Number(account.nextAllowedAction);
          if (nextAllowedAction && now < nextAllowedAction) {
            account.nextAllowedAction = `${nextAllowedAction + 500}`;
            context.auth.delay = account.nextAllowedAction;
            await context.db.account.put(account);
            throw new UserInputError("You must wait longer before acting", {
              delay: true,
              remaining: Number(account.nextAllowedAction) - now,
            });
          } else {
            account.nextAllowedAction = `${now + delayDirective["delay"]}`;
            await context.db.account.put(account);
          }
          // console.log("proov it!");
          // do nothing for now, placeholder basically..
          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }
    },
  });
}
