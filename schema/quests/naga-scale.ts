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

import { questEvents } from "./text/naga-scale-text";
import {
  giveQuestItemNotification,
  takeQuestItem,
  hasQuestItem,
} from "./helpers";

const FleshMound = 0x01 << 0;
const LampOil = 0x01 << 1;
const BirdFigurine = 0x01 << 2;
const ChimeraHook = 0x01 << 3;
const FlayingKnife = 0x01 << 4;
const NagaScale = 0x01 << 5;

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  if (hero.questLog.nagaScale?.finished) {
    return hero;
  }
  const progress = hero.questLog.nagaScale?.progress ?? 0;
  if ((progress & FleshMound) === 0 && monster.monster.level === 19) {
    if (Math.random() > 1 / 10000) {
      return hero;
    }
    giveQuestItemNotification(context, hero, "mound-of-flesh");
    setProgress(hero, FleshMound);
    return hero;
  }

  if (
    (progress & LampOil) === 0 &&
    monster.monster.level >= 12 &&
    monster.monster.level <= 16
  ) {
    if (Math.random() > 1 / 10000) {
      return hero;
    }
    giveQuestItemNotification(context, hero, "lamp-oil");
    setProgress(hero, LampOil);
    return hero;
  }

  if (
    (progress & NagaScale) === 0 &&
    (progress & FlayingKnife) === FlayingKnife &&
    monster.monster.level === 35
  ) {
    if (Math.random() > 1 / 10) {
      return hero;
    }
    if (
      hasQuestItem(hero, "precious-flaying-knife") &&
      heroLocationName(hero) === "The Drowning Fish"
    ) {
      hero = takeQuestItem(hero, "precious-flaying-knife");
      context.io.sendNotification(hero.id, {
        message:
          "The flaying knife chips and breaks, but takes a single scale with it",
        type: "quest",
      });
      giveQuestItemNotification(context, hero, "naga-scale");

      setProgress(hero, NagaScale);
      if (hero.questLog.nagaScale) {
        hero.questLog.nagaScale.finished = true;
      }
    }
    return hero;
  }
  return hero;
}

export function checkHero(context: BaseContext, hero: Hero): Hero {
  const progress = hero.questLog.nagaScale?.progress ?? 0;
  if (
    (progress & BirdFigurine) === 0 &&
    (progress & LampOil) === LampOil &&
    hasQuestItem(hero, "lamp-oil") &&
    heroLocationName(hero) === "Steamgear Tap House"
  ) {
    hero = takeQuestItem(hero, "lamp-oil");
    giveQuestItemNotification(context, hero, "bird-figurine");
    hero.currentQuest = {
      id: `NagaScale-${hero.id}-bird`,
      message: questEvents.birdFigurine,
      quest: Quest.NagaScale,
    };
    setProgress(hero, BirdFigurine);
    return hero;
  }
  if (
    (progress & ChimeraHook) === 0 &&
    (progress & FleshMound) === FleshMound &&
    hasQuestItem(hero, "mound-of-flesh") &&
    heroLocationName(hero) === "The Hellhound's Fur"
  ) {
    hero = takeQuestItem(hero, "mound-of-flesh");
    giveQuestItemNotification(context, hero, "chimera-hook");
    hero.currentQuest = {
      id: `NagaScale-${hero.id}-chimera`,
      message: questEvents.chimeraHook,
      quest: Quest.NagaScale,
    };
    setProgress(hero, ChimeraHook);
    return hero;
  }
  if (
    (progress & FlayingKnife) === 0 &&
    (progress & BirdFigurine) === BirdFigurine &&
    (progress & ChimeraHook) === ChimeraHook &&
    heroLocationName(hero) === "Sherlam Landing" &&
    hasQuestItem(hero, "bird-figurine") &&
    hasQuestItem(hero, "chimera-hook")
  ) {
    hero = takeQuestItem(hero, "bird-figurine");
    hero = takeQuestItem(hero, "chimera-hook");
    giveQuestItemNotification(context, hero, "precious-flaying-knife");
    hero.currentQuest = {
      id: `NagaScale-${hero.id}-knife`,
      message: questEvents.flayingKnife,
      quest: Quest.NagaScale,
    };
    setProgress(hero, FlayingKnife);
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

function setProgress(hero: Hero, progress: number): Hero {
  const lastEvent =
    hero.currentQuest?.quest === Quest.NagaScale
      ? hero.currentQuest
      : undefined;
  hero.questLog.nagaScale = {
    id: `NagaScale-${hero.id}`,
    started: true,
    finished: false,
    progress: progress | (hero.questLog.nagaScale?.progress ?? 0),
    lastEvent,
  };

  return hero;
}
