import {
  Hero,
  InventoryItem,
  MonsterInstance,
  Quest,
  Location,
} from "types/graphql";

import { BaseContext } from "../context";

export function checkHeroGossip(
  context: BaseContext,
  hero: Hero,
  location: Location,
): Hero {
  /**
   * @TODO: randomly give a treasure map when gossipping

    don't give a treasure map if they already have one.
    create some silly deterministic random location sort of like the droop quest
    get to location, there's a dungeon there. Upon completing the dungeon, they get a reward


    to figure out/decide:
    if you should be able to do it multiple times or not
    what the rewards should be
  */
  hero = hero;
  return hero;
}
