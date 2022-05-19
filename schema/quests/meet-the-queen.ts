import { Hero, Quest, EnchantmentType, InventoryItem } from "types/graphql";

import { BaseContext } from "../context";

import { questEvents } from "./text/meet-the-queen-text";
import { giveHeroRandomDrop } from "../items/helpers";
import {
  giveQuestItemNotification,
  heroLocationName,
  takeQuestItem,
  hasQuestItem,
  setQuestEvent,
  setQuestLogProgress,
} from "./helpers";

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
    // meet the queen
  }

  return hero;
}
