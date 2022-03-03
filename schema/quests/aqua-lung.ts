import {
  Hero,
  InventoryItem,
  MonsterInstance,
  HeroClasses,
  Quest,
} from "types/graphql";
import { BaseContext } from "../context";

import {
  giveQuestItemNotification,
  hasQuestItem,
  takeQuestItem,
} from "./helpers";
import { questEvents } from "./text/washed-up-text";

export function checkHero(context: BaseContext, hero: Hero): Hero {
  if (
    hero.questLog?.washedUp?.progress === 8 &&
    // if we already got the magic bubble random drop
    hasQuestItem(hero, "magic-bubble") &&
    // and we have an upgraded base class item
    (hasQuestItem(hero, "gambling-kit") ||
      hasQuestItem(hero, "warriors-armlette") ||
      hasQuestItem(hero, "tome-of-knowledge") ||
      hasQuestItem(hero, "patrons-wisdom") ||
      hasQuestItem(hero, "liturgical-censer") ||
      hasQuestItem(hero, "quiver-of-speed") ||
      hasQuestItem(hero, "vampire-ring"))
  ) {
    hero = takeQuestItem(hero, "magic-bubble");
    hero = giveQuestItemNotification(context, hero, "aqua-lungs");

    context.io.sendGlobalNotification({
      message: `the ocean waters welcome ${hero.name} as their own`,
      type: "quest",
    });

    hero.currentQuest = {
      id: `WashedUp-${hero.id}-aqualung`,
      message: questEvents.aquaLungs,
      quest: Quest.WashedUp,
    };

    hero.questLog.washedUp = {
      id: `WashedUp-${hero.id}`,
      started: true,
      finished: true,
      progress: 9,
      lastEvent: hero.currentQuest,
    };
  }

  return hero;
}
export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  if (Math.random() > 1 / 10000) {
    return hero;
  }

  if (hasQuestItem(hero, "magic-bubble")) {
    return hero;
  }

  hero = giveQuestItemNotification(context, hero, "magic-bubble");

  context.io.sendGlobalNotification({
    message: `something magic from the sea is following ${hero.name}`,
    type: "quest",
  });

  return hero;
}
