import { Hero, Quest, EnchantmentType, InventoryItemType } from "types/graphql";
import { questEvents } from "./text/crafting-text";

import { giveQuestItemNotification } from "./helpers";
import { BaseContext } from "../context";

import Databases from "../../db";

export function checkHero(context: BaseContext, hero: Hero): Hero {
  if (hero.currentQuest) {
    return hero;
  }

  const canCraft =
    Databases.hero.countEnchantments(hero, EnchantmentType.CanCraft) > 0;

  if (canCraft) {
    return hero;
  }

  const enchantedItems = hero.inventory.filter((item) => {
    if (item.type === InventoryItemType.Quest) {
      return false;
    }

    return !!item.enchantment;
  }).length;

  if (enchantedItems < 10) {
    return hero;
  }

  console.log(hero.name, "is unlocking crafting!");

  hero = giveQuestItemNotification(context, hero, "crafting-hammer");

  hero.currentQuest = {
    id: `Creafting-${hero.id}`,
    message: questEvents.welcome,
    quest: Quest.Rebirth,
  };

  return hero;
}
