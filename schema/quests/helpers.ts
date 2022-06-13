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
import {
  checkHero as checkHeroForMeetTheQueen,
  checkSkipDrop as checkSkipDropForMeetTheQueen,
} from "./meet-the-queen";
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

export async function checkSkipDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Promise<boolean> {
  if (!(await checkSkipDropForMeetTheQueen(context, hero, monster))) {
    return false;
  }

  return true;
}

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
  hero = checkHeroForMeetTheQueen(context, hero);

  return hero;
}

export function takeQuestItem(hero: Hero, baseItemName: string): Hero {
  hero.inventory = hero.inventory.filter(
    (item) => item.baseItem !== baseItemName
  );

  return hero;
}

export function takeOneQuestItem(hero: Hero, baseItemName: string): Hero {
  let hasTaken = false;
  hero.inventory = hero.inventory.filter((item) => {
    if (!hasTaken && item.baseItem === baseItemName) {
      hasTaken = true;
      return false;
    }
    return true;
  });

  return hero;
}

export function hasQuestItem(hero: Hero, baseItemName: string): boolean {
  return !!hero.inventory.find((item) => item.baseItem === baseItemName);
}

export function countQuestItem(hero: Hero, baseItemName: string): number {
  return hero.inventory.filter((item) => item.baseItem === baseItemName).length;
}

export function giveQuestItemNotification(
  context: BaseContext,
  hero: Hero,
  baseItemName: string
): Hero {
  return giveQuestItemQuantityNotification(context, hero, baseItemName, 1);
}

export function giveQuestItemQuantityNotification(
  context: BaseContext,
  hero: Hero,
  baseItemName: string,
  quantity: number
): Hero {
  const existingCount = countQuestItem(hero, baseItemName);
  if (existingCount >= quantity) {
    return hero;
  }

  hero = giveQuestItemQuantity(hero, baseItemName, quantity);
  const item = getOrCreateQuestItem(hero, baseItemName);

  if (quantity - existingCount > 1) {
    context.io.sendNotification(hero.id, {
      message: `You have received ${(
        quantity - existingCount
      ).toLocaleString()}x {{item}}`,
      type: "quest",
      item,
    });
  } else {
    context.io.sendNotification(hero.id, {
      message: "You have received {{item}}",
      type: "quest",
      item,
    });
  }

  return hero;
}
export function giveQuestItem(hero: Hero, baseItemName: string): Hero {
  getOrCreateQuestItem(hero, baseItemName);

  return hero;
}

export function giveQuestItemQuantity(
  hero: Hero,
  baseItemName: string,
  quantity: number
): Hero {
  const existingCount = countQuestItem(hero, baseItemName);
  if (existingCount >= quantity) {
    return hero;
  }

  quantity -= existingCount;
  const baseItem = BaseItems[baseItemName];

  for (let i = 0; i < quantity; ++i) {
    const item = createItemInstance(baseItem, hero);
    hero.inventory.push(item);
  }

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
