import { Hero, InventoryItem, MonsterInstance } from "types/graphql";

import { BaseContext } from "../context";

import { createItemInstance } from "../items/helpers";
import { BaseItems } from "../items/base-items";

import { checkHero as checkHeroForWashedUp } from "./washed-up";
import { checkHero as checkHeroForRebirth } from "./rebirth";
import { checkHero as checkHeroForCrafting } from "./crafting";
import { checkHeroDrop as checkHeroDropForClasses } from "./classes";
import {
  checkHeroDrop as checkHeroDropForAquaLung,
  checkHero as checkHeroForAquaLung,
} from "./aqua-lung";
import { checkHeroDrop as checkHeroDropForDroop } from "./droop";

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  hero = checkHeroDropForClasses(context, hero, monster);
  hero = checkHeroDropForAquaLung(context, hero, monster);
  hero = checkHeroDropForDroop(context, hero, monster);

  return hero;
}

export function checkHero(context: BaseContext, hero: Hero): Hero {
  hero = checkHeroForWashedUp(context, hero);
  hero = checkHeroForRebirth(context, hero);
  hero = checkHeroForCrafting(context, hero);
  hero = checkHeroForAquaLung(context, hero);

  return hero;
}

export function takeQuestItem(hero: Hero, baseItemName: string): Hero {
  hero.inventory = hero.inventory.filter(
    (item) => item.baseItem !== baseItemName
  );

  return hero;
}

export function hasQuestItem(hero: Hero, baseItemName: string): boolean {
  return !!hero.inventory.find((item) => item.baseItem === baseItemName);
}
export function giveQuestItemNotification(
  context: BaseContext,
  hero: Hero,
  baseItemName: string
): Hero {
  if (hasQuestItem(hero, baseItemName)) {
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
