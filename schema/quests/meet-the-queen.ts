import {
  Hero,
  Quest,
  EnchantmentType,
  InventoryItem,
  MonsterInstance,
} from "types/graphql";

import { BaseContext } from "../context";

import { questEvents } from "./text/meet-the-queen-text";
import { giveHeroRandomDrop, createItemInstance } from "../items/helpers";
import { BaseItems } from "../items/base-items";
import {
  hasQuestItem,
  takeQuestItem,
  setQuestEvent,
  takeOneQuestItem,
  heroLocationName,
  setQuestLogProgress,
  giveQuestItemNotification,
  giveQuestItemQuantityNotification,
} from "./helpers";

export async function checkSkipDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Promise<boolean> {
  console.log("checking skip drop!");

  if (!hasQuestItem(hero, "clean-rag")) {
    console.log("Allowing!...");
    return true;
  }

  takeOneQuestItem(hero, "clean-rag");

  const baseItem = BaseItems["bloody-rag"];
  const item = createItemInstance(baseItem, hero);
  item.level = monster.monster.level;
  hero.inventory.push(item);

  context.io.sendNotification(hero.id, {
    message: "You soak up the blood using one of your clean rags",
    type: "quest",
  });

  console.log("Preventing...");
  return false;
}

export function checkHero(context: BaseContext, hero: Hero): Hero {
  if (hero.currentQuest || hero.questLog.meetTheQueen?.finished) {
    return hero;
  }
  if (!hero.questLog.meetTheQueen?.started) {
    if (hero.gold > 10000000000) {
      hero = setQuestEvent(
        hero,
        Quest.MeetTheQueen,
        "intro",
        questEvents.intro
      );
      hero = setQuestLogProgress(hero, Quest.MeetTheQueen, "meetTheQueen", 1);
    }

    return hero;
  }

  // quest is started

  if (
    hero.questLog.meetTheQueen.progress < 10 &&
    heroLocationName(hero) === "Palace of Rotherham"
  ) {
    if (
      !hero.questLog.droop?.finished &&
      hero.questLog.meetTheQueen.progress < 2
    ) {
      // not here, come back later
      hero = setQuestEvent(
        hero,
        Quest.MeetTheQueen,
        "notHere",
        questEvents.notHere
      );
      hero = setQuestLogProgress(hero, Quest.MeetTheQueen, "meetTheQueen", 2);

      return hero;
    }
    if (
      hero.questLog.droop?.finished &&
      hero.questLog.meetTheQueen.progress < 3
    ) {
      // She's here! give the once message
      hero = setQuestEvent(
        hero,
        Quest.MeetTheQueen,
        "brewconiaIsTheQueen",
        questEvents.brewconiaIsTheQueen
      );
      hero = setQuestLogProgress(hero, Quest.MeetTheQueen, "meetTheQueen", 3);

      return hero;
    }
    if (hero.questLog.meetTheQueen.progress === 3) {
      // received greeting but hasn't been given the quest
      hero = setQuestEvent(
        hero,
        Quest.MeetTheQueen,
        "brewconiasFavor",
        questEvents.brewconiasFavor
      );
      hero = setQuestLogProgress(hero, Quest.MeetTheQueen, "meetTheQueen", 10);

      giveQuestItemQuantityNotification(context, hero, "clean-rag", 10);
      return hero;
    }
    // probably needs to find droop first at this code path

    return hero;
  }

  // either progress is 10+ or we're not at the palace
  // everything before 10 takes place at the palace so lets fail fast
  if (hero.questLog.meetTheQueen.progress < 10) {
    return hero;
  }

  // we have the quest! at least the first one...
  // use drops to saturate the rags, return them to the palace once we have zero

  return hero;
}
