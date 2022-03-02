import {
  Hero,
  InventoryItem,
  MonsterInstance,
  HeroClasses,
} from "types/graphql";
import { BaseContext } from "../context";

import { giveQuestItemNotification, hasQuestItem } from "./helpers";

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  if (Math.random() > 1 / 5000) {
    return hero;
  }

  if (hasQuestItem(hero, "magic-bubble")) {
    return hero;
  }

  hero = giveQuestItemNotification(context, hero, "magic-bubble");

  return hero;
}
