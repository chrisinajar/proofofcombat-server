import {
  Hero,
  InventoryItem,
  MonsterInstance,
  Quest,
  PlayerLocation,
} from "types/graphql";

import { LocationData, MapNames, SpecialLocation } from "../../constants";
import { findTerrainType, specialLocations } from "../../helpers";

import { BaseContext } from "../context";
import { createItemInstance } from "../items/helpers";
import { BaseItems } from "../items/base-items";

import { checkHero as checkHeroForWashedUp } from "./washed-up";
import { checkHero as checkHeroForRebirth } from "./rebirth";
import { checkHero as checkHeroForCrafting } from "./crafting";
import { checkHeroDrop as checkHeroDropForClasses } from "./classes";
import {
  checkHeroDrop as checkHeroDropForClockwork,
  checkHero as checkHeroForClockwork,
} from "./clockwork";
import {
  checkHeroDrop as checkHeroDropForAquaLung,
  checkHero as checkHeroForAquaLung,
} from "./aqua-lung";
import {
  checkHeroDrop as checkHeroDropForNagaScale,
  checkHero as checkHeroForNagaScale,
} from "./naga-scale";
import { checkHeroDrop as checkHeroDropForDroop } from "./droop";
import { checkHeroDrop as checkHeroDropForTavernChamp } from "./tavern-champion";
import { checkHeroDrop as checkHeroDropForMinorClasses } from "./minor-class-upgrades";
import { checkCapital as checkCapitalForSettlements } from "./settlements";

export async function checkCapital(
  context: BaseContext,
  capital: PlayerLocation,
  hero: Hero
): Promise<void> {
  await checkCapitalForSettlements(context, capital, hero);
}

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  hero = checkHeroDropForClasses(context, hero, monster);
  hero = checkHeroDropForAquaLung(context, hero, monster);
  hero = checkHeroDropForDroop(context, hero, monster);
  hero = checkHeroDropForNagaScale(context, hero, monster);
  hero = checkHeroDropForClockwork(context, hero, monster);
  hero = checkHeroDropForTavernChamp(context, hero, monster);
  hero = checkHeroDropForMinorClasses(context, hero, monster);

  return hero;
}

export function checkHero(context: BaseContext, hero: Hero): Hero {
  hero = checkHeroForWashedUp(context, hero);
  hero = checkHeroForRebirth(context, hero);
  hero = checkHeroForCrafting(context, hero);
  hero = checkHeroForAquaLung(context, hero);
  hero = checkHeroForNagaScale(context, hero);
  hero = checkHeroForClockwork(context, hero);

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

export function setQuestEvent(
  hero: Hero,
  quest: Quest,
  step: string,
  message: string[]
): Hero {
  hero.currentQuest = {
    id: `${quest}-${hero.id}-${step}`,
    message,
    quest,
  };
  return hero;
}

export function setQuestLogProgress(
  hero: Hero,
  quest: Quest,
  entryName: keyof Hero["questLog"],
  progress: number
): Hero {
  if (entryName === "id") {
    return hero;
  }
  const lastEvent =
    hero.currentQuest?.quest === quest ? hero.currentQuest : undefined;
  hero.questLog[entryName] = {
    id: `${quest}-${hero.id}`,
    started: true,
    finished: false,
    progress: progress | (hero.questLog[entryName]?.progress ?? 0),
    lastEvent,
  };

  return hero;
}

export function heroLocationName(hero: Hero): string | null {
  const locations: SpecialLocation[] = specialLocations(
    hero.location.x,
    hero.location.y,
    hero.location.map as MapNames
  );

  if (!locations.length) {
    return null;
  }

  return locations[0].name;
}
