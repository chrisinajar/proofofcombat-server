import { Hero, Quest, EnchantmentType } from "types/graphql";

import Databases from "../../db";
import { BaseContext } from "../context";

import { questEvents } from "./text/rebirth-text";
import { giveQuestItemNotification, takeQuestItem } from "./helpers";

export const startingLevelCap = 10;
export const secondLevelCap = 100;
export const thirdLevelCap = 5000;

export function rebirth(context: BaseContext, hero: Hero): Hero {
  console.log("Rebirthing", hero.name);
  hero = takeQuestItem(hero, "totem-of-rebirth");
  hero = takeQuestItem(hero, "totem-of-champion-rebirth");
  hero = takeQuestItem(hero, "totem-of-hero-rebirth");

  if (hero.levelCap === startingLevelCap) {
    hero.levelCap = secondLevelCap;
    hero = rebirthMessage(hero, "rebirth", questEvents.firstRebirth);
    hero = giveQuestItemNotification(context, hero, "totem-of-champion");
  } else if (hero.levelCap === secondLevelCap) {
    hero.levelCap = thirdLevelCap;
    hero = rebirthMessage(hero, "rebirth", questEvents.firstRebirth);
    hero = giveQuestItemNotification(context, hero, "totem-of-hero");
  }

  // 1, 2, 4, etc
  const startingLevel = Math.pow(
    2,
    Databases.hero.countEnchantments(hero, EnchantmentType.DoubleLeveling)
  );

  hero.attributePoints = Math.max(0, startingLevel - 1);
  hero.experience = 0;
  hero.level = startingLevel;
  hero.stats = {
    strength: 5 + startingLevel,
    dexterity: 5 + startingLevel,
    constitution: 5 + startingLevel,
    intelligence: 5 + startingLevel,
    wisdom: 5 + startingLevel,
    willpower: 5 + startingLevel,
    luck: 5 + startingLevel,
  };

  return Databases.hero.recalculateStats(hero);
}
export function checkHero(context: BaseContext, hero: Hero): Hero {
  // wait for them to dismiss any previous quest messages
  if (hero.currentQuest) {
    return hero;
  }

  // we only care if they're currently sitting at a level cap
  if (!isAtLevelCap(hero)) {
    return hero;
  }

  if (
    hero.questLog?.rebirth?.progress &&
    hero.questLog?.rebirth?.progress >= hero.levelCap
  ) {
    return hero;
  }

  // there's at a level cap, but we don't know which
  // in case somehow a bug causes overleveling, we want to switch on cap
  switch (hero.levelCap) {
    case 10:
      hero = rebirthMessage(hero, "first", questEvents.firstBirth);
      giveQuestItemNotification(context, hero, "totem-of-rebirth");
      break;
    case 100:
      hero = rebirthMessage(hero, "second", questEvents.secondCap);
      takeQuestItem(hero, "totem-of-champion");
      giveQuestItemNotification(context, hero, "totem-of-champion-rebirth");
      break;
  }

  hero.questLog.rebirth = {
    id: `Rebirth-${hero.id}`,
    started: true,
    finished: false,
    progress: hero.levelCap,
    lastEvent: hero.currentQuest,
  };

  return hero;
}

function rebirthMessage(
  hero: Hero,
  uniqueName: string,
  message: string[]
): Hero {
  hero.currentQuest = {
    id: `Rebirth-${hero.id}-${uniqueName}`,
    message: message,
    quest: Quest.Rebirth,
  };
  return hero;
}

function isAtLevelCap(hero: Hero): boolean {
  // could become more complex later?
  return hero.level >= hero.levelCap;
}
