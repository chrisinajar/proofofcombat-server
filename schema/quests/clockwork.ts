import {
  Hero,
  InventoryItem,
  MonsterInstance,
  HeroClasses,
  Quest,
} from "types/graphql";

import { BaseContext } from "../context";

import { questEvents } from "./text/clockwork-text";

import {
  giveQuestItemNotification,
  hasQuestItem,
  takeQuestItem,
  setQuestEvent,
  setQuestLogProgress,
  heroLocationName,
} from "./helpers";

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  if (!hero.questLog.rebirth || hero.questLog.rebirth.progress < 100) {
    return hero;
  }
  // honestly 1 in 5k is really really really common
  // but this first tier of quest is designed to unlock settings
  // that people need
  // so like

  // yeah
  if (Math.random() > 1 / 5000) {
    return hero;
  }
  // and i think it's gonna be a long long time...
  if (hero.questLog.clockwork?.finished) {
    return hero;
  }

  if (!hero.questLog.clockwork) {
    // has done nothing
    hero = giveQuestItemNotification(context, hero, "inconclusive-clockwork");

    hero = setQuestEvent(
      hero,
      Quest.MysteriousAutomation,
      "first",
      questEvents.firstClockwork
    );
    hero = setQuestLogProgress(
      hero,
      Quest.MysteriousAutomation,
      "clockwork",
      1
    );
  }

  return hero;
}

export function checkHero(context: BaseContext, hero: Hero): Hero {
  if (!hero.questLog.clockwork || hero.questLog.clockwork.progress > 1) {
    return hero;
  }

  if (
    hero.questLog.clockwork.progress === 1 &&
    heroLocationName(hero) === "Steamgear Tap House"
  ) {
    hero = takeQuestItem(hero, "inconclusive-clockwork");
    hero = giveQuestItemNotification(context, hero, "unimaginable-gearbox");
    hero = setQuestEvent(
      hero,
      Quest.MysteriousAutomation,
      "second",
      questEvents.upgradeClockwork
    );
    hero = setQuestLogProgress(
      hero,
      Quest.MysteriousAutomation,
      "clockwork",
      2
    );
  }

  return hero;
}
