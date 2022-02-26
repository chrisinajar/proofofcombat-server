import { checkHero as checkHeroForWashedUp } from "./washed-up";
import { checkHero as checkHeroForRebirth } from "./rebirth";
import { Hero } from "types/graphql";

import { createItemInstance } from "../items/helpers";
import { BaseItems } from "../items/base-items";

export function checkHero(hero: Hero): Hero {
  // disabled washed up for now
  hero = checkHeroForWashedUp(hero);
  hero = checkHeroForRebirth(hero);

  return hero;
}

export function takeQuestItem(hero: Hero, baseItemName: string): Hero {
  hero.inventory = hero.inventory.filter(
    (item) => item.baseItem !== baseItemName
  );

  return hero;
}

export function giveQuestItem(hero: Hero, baseItemName: string): Hero {
  const existingItem = hero.inventory.find(
    (item) => item.baseItem === baseItemName
  );
  if (existingItem) {
    return hero;
  }
  const baseItem = BaseItems[baseItemName];
  const item = createItemInstance(baseItem, hero);
  hero.inventory.push(item);

  console.log(hero.name, "got quest item", item.name);

  return hero;
}
