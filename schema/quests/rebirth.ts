import { Hero, Quest } from "types/graphql";

import { questEvents } from "./text/rebirth-text";
import { giveQuestItem, takeQuestItem } from "./helpers";

export const startingLevelCap = 10;
export const secondLevelCap = 100;

export function rebirth(hero: Hero): Hero {
  hero.level = 1;
  hero.levelCap = 0;
  hero.experience = 0;
  hero.stats = {
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    willpower: 10,
    luck: 10,
  };

  hero = rebirthMessage(hero, "first", questEvents.firstBirth);
  hero = takeQuestItem(hero, "totem-of-rebirth");
  hero = giveQuestItem(hero, "totem-of-the-hero");

  return hero;
}
export function checkHero(hero: Hero): Hero {
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
      giveQuestItem(hero, "totem-of-rebirth");
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
