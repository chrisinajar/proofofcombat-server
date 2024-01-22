import { Hero, Quest, EnchantmentType, InventoryItemType } from "types/graphql";
import { questEvents } from "./text/crafting-text";

import { giveQuestItemNotification } from "./helpers";
import { BaseContext } from "../context";

import Databases from "../../db";

export function checkHero(context: BaseContext, hero: Hero): Hero {
  if (hero.currentQuest) {
    return hero;
  }

  const craftCount = Databases.hero.countEnchantments(
    hero,
    EnchantmentType.CanCraft,
  );

  const enchantedItems = hero.inventory.filter((item) => {
    if (item.type === InventoryItemType.Quest) {
      return false;
    }

    return !!item.enchantment;
  }).length;

  const dust = hero.enchantingDust;
  if (craftCount === 0) {
    if (enchantedItems < 20) {
      return hero;
    }

    console.log(hero.name, "is unlocking crafting!");

    hero.currentQuest = {
      id: `Creafting-${hero.id}`,
      message: questEvents.welcome,
      quest: Quest.Rebirth,
    };

    return hero;
  }

  if (craftCount === 1) {
    // if (dust < 5000 || enchantedItems < 200) {
    return hero;
    // }

    // crafting phase two
    hero.currentQuest = {
      id: `Creafting-${hero.id}-2`,
      message: questEvents.enoughDust,
      quest: Quest.Rebirth,
    };

    hero = giveQuestItemNotification(context, hero, "crafting-goggles");

    return hero;
  }

  return hero;
}
