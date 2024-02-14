import { Hero } from "types/graphql";

import type { BaseContext } from "schema/context";

// return true to prevent teleport
export function checkTeleport(context: BaseContext, hero: Hero): boolean {
  return false;
}
