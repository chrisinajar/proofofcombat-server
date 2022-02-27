import { checkHero as checkHeroForWashedUp } from "./washed-up";
import { checkHero as checkHeroForRebirth } from "./rebirth";
import { checkHero as checkHeroForCrafting } from "./crafting";
import { Hero, InventoryItem } from "types/graphql";

import { BaseContext } from "../context";

import { createItemInstance } from "../items/helpers";
import { BaseItems } from "../items/base-items";

export function checkHero(context: BaseContext, hero: Hero): Hero {
  // disabled washed up for now
  hero = checkHeroForWashedUp(context, hero);
  hero = checkHeroForRebirth(context, hero);
  hero = checkHeroForCrafting(context, hero);

  return hero;
}

export function takeQuestItem(hero: Hero, baseItemName: string): Hero {
  hero.inventory = hero.inventory.filter(
    (item) => item.baseItem !== baseItemName
  );

  return hero;
}

export function giveQuestItemNotification(
  context: BaseContext,
  hero: Hero,
  baseItemName: string
): Hero {
  const existingItem = hero.inventory.find(
    (item) => item.baseItem === baseItemName
  );
  if (existingItem) {
    return hero;
  }

  const item = getOrCreateQuestItem(hero, baseItemName);

  context.io.sendNotification(hero.id, {
    message: "You have received {{item}}",
    type: "quest",
    item,
  });

  return hero;
}
export function giveQuestItem(hero: Hero, baseItemName: string): Hero {
  getOrCreateQuestItem(hero, baseItemName);

  return hero;
}
export function getOrCreateQuestItem(
  hero: Hero,
  baseItemName: string
): InventoryItem {
  const existingItem = hero.inventory.find(
    (item) => item.baseItem === baseItemName
  );
  if (existingItem) {
    return existingItem;
  }
  const baseItem = BaseItems[baseItemName];
  const item = createItemInstance(baseItem, hero);
  hero.inventory.push(item);

  console.log(hero.name, "got quest item", item.name);

  return item;
}
