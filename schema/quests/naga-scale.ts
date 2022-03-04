import {
  Hero,
  InventoryItem,
  MonsterInstance,
  HeroClasses,
  Quest,
} from "types/graphql";

import { LocationData, MapNames, SpecialLocation } from "../../constants";
import { findTerrainType, specialLocations } from "../../helpers";

import { BaseContext } from "../context";
import {
  giveQuestItemNotification,
  takeQuestItem,
  hasQuestItem,
} from "./helpers";

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  if (monster.monster.level === 19) {
    if (Math.random() > 1 / 10000) {
      return hero;
    }
    giveQuestItemNotification(context, hero, "mound-of-flesh");
    return hero;
  }
  if (monster.monster.level === 23) {
    if (Math.random() > 1 / 10000) {
      return hero;
    }
    if (hasQuestItem(hero, "precious-flaying-knife")) {
      giveQuestItemNotification(context, hero, "naga-scale");
    }
    return hero;
  }

  if (monster.monster.level > 12 && monster.monster.level < 16) {
    if (Math.random() > 1 / 10000) {
      return hero;
    }
    giveQuestItemNotification(context, hero, "lamp-oil");
    return hero;
  }
  return hero;
}

export function checkHero(context: BaseContext, hero: Hero): Hero {
  if (
    hasQuestItem(hero, "lamp-oil") &&
    heroLocationName(hero) === "Steamgear Tap House"
  ) {
    hero = takeQuestItem(hero, "lamp-oil");
    giveQuestItemNotification(context, hero, "bird-figurine");
    return hero;
  }
  if (
    hasQuestItem(hero, "mound-of-flesh") &&
    heroLocationName(hero) === "The Hellhound's Fur"
  ) {
    hero = takeQuestItem(hero, "mound-of-flesh");
    giveQuestItemNotification(context, hero, "chimera-hook");
    return hero;
  }
  if (
    heroLocationName(hero) === "Sherlam Landing" &&
    hasQuestItem(hero, "bird-figurine") &&
    hasQuestItem(hero, "chimera-hook")
  ) {
    hero = takeQuestItem(hero, "bird-figurine");
    hero = takeQuestItem(hero, "chimera-hook");
    giveQuestItemNotification(context, hero, "precious-flaying-knife");
    return hero;
  }

  return hero;
}

function heroLocationName(hero: Hero): string | null {
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
