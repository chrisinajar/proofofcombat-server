import { ForbiddenError, UserInputError } from "apollo-server";

import { mapSchema, getDirective, MapperKind } from "@graphql-tools/utils";
import { defaultFieldResolver, GraphQLSchema } from "graphql";
import type { BaseContext } from "schema/context";

import { ArtifactAttributeType } from "types/graphql";
import { runAberrationCheck } from "../aberration";

export function delayDirectiveTransformer(
  schema: GraphQLSchema,
  directiveName: string,
) {
  return mapSchema(schema, {
    // Executes once for each object field in the schema
    [MapperKind.OBJECT_FIELD]: (fieldConfig) => {
      // Check whether this field has the specified directive
      const delayDirective = getDirective(
        schema,
        fieldConfig,
        directiveName,
      )?.[0];

      if (delayDirective) {
        // Get this field's original resolver
        const { resolve = defaultFieldResolver } = fieldConfig;

        fieldConfig.resolve = async function (
          source,
          args,
          context: BaseContext,
          info,
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
          if (!process.env.MAX_LEVEL_TESTING) {
            const nextAllowedAction = Number(account.nextAllowedAction);
            if (nextAllowedAction && now < nextAllowedAction) {
              account.nextAllowedAction = `${nextAllowedAction + 1000}`;
              context.auth.delay = account.nextAllowedAction;
              await context.db.account.put(account);
              throw new UserInputError("You must wait longer before acting", {
                delay: true,
                remaining: Number(account.nextAllowedAction) - now,
              });
            } else {
              const hero = await context.db.hero.get(account.id);
              const heroUnit = context.db.hero.getUnit(hero);
              const reducedDelay = heroUnit.stats.reducedDelay;

              let delay = delayDirective["delay"];
              if (reducedDelay < 1) {
                delay *= reducedDelay;
              }
              delay = Math.round(delay);
              context.delay = delay;
              account.nextAllowedAction = `${now + delay}`;
              await context.db.account.put(account);
            }
          }
          runAberrationCheck(context);
          return resolve(source, args, context, info);
        };
        return fieldConfig;
      }
    },
  });
}
