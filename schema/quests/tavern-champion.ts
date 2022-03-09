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

import { questEvents } from "./text/tavern-champion-text";
import {
  giveQuestItemNotification,
  takeQuestItem,
  hasQuestItem,
  heroLocationName,
} from "./helpers";

const Hellhound = 0x01 << 0;
const HiddenStump = 0x01 << 1;
const Steamgear = 0x01 << 2;
const Drowning = 0x01 << 3;

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  if (hero.questLog.tavernChampion?.finished) {
    return hero;
  }
  // universal drop rate so we can do it first for optimization
  if (Math.random() > 1 / 800) {
    return hero;
  }
  if (monster.monster.level !== 39) {
    return hero;
  }
  const progress = hero.questLog.tavernChampion?.progress ?? 0;
  if (
    (progress & Hellhound) === 0 &&
    heroLocationName(hero) === "The Hellhound's Fur"
  ) {
    giveQuestItemNotification(context, hero, "trophy-hellhound");
    setProgress(hero, Hellhound, questEvents.hellhound);
    return hero;
  }

  if (
    (progress & HiddenStump) === 0 &&
    heroLocationName(hero) === "The Hidden Stump Inn"
  ) {
    giveQuestItemNotification(context, hero, "trophy-hiddenstump");
    setProgress(hero, HiddenStump, questEvents.hiddenstump);
    return hero;
  }

  if (
    (progress & Steamgear) === 0 &&
    heroLocationName(hero) === "Steamgear Tap House"
  ) {
    giveQuestItemNotification(context, hero, "trophy-steamgear");
    setProgress(hero, Steamgear, questEvents.steamgear);
    return hero;
  }

  if (
    (progress & Drowning) === 0 &&
    heroLocationName(hero) === "The Drowning Fish"
  ) {
    giveQuestItemNotification(context, hero, "trophy-drowning");
    setProgress(hero, Drowning, questEvents.drowning);
    return hero;
  }

  return hero;
}

function setProgress(
  hero: Hero,
  progress: number,
  questEvents: string[]
): Hero {
  hero.currentQuest = {
    id: `TavernChampion-${hero.id}-${progress}`,
    message: questEvents,
    quest: Quest.TavernChampion,
  };

  hero.questLog.tavernChampion = {
    id: `TavernChampion-${hero.id}`,
    started: true,
    finished: false,
    progress: progress | (hero.questLog.tavernChampion?.progress ?? 0),
    lastEvent: hero.currentQuest,
  };

  return hero;
}
