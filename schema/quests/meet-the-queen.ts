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

/*
finishedRagsBad
finishedRagsGood
finishedRagsPerfect
finishedRagsLegendary
*/

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

  // everything 10+ is at the palace
  if (heroLocationName(hero) !== "Palace of Rotherham") {
    return hero;
  }

  // we have the quest! at least the first one...
  // use drops to saturate the rags, return them to the palace once we have zero

  // we're curently at the palace

  // if we have any clean rags left, don't continue
  if (hasQuestItem(hero, "clean-rag")) {
    return hero;
  }

  // make sure we also have bloody rags
  if (!hasQuestItem(hero, "bloody-rag")) {
    return hero;
  }

  const rags = hero.inventory.filter((item) => item.baseItem === "bloody-rag");
  const totalLevels = rags.reduce((memo, item) => memo + item.level, 0);

  if (totalLevels < 1) {
    // how did this happen?
    return hero;
  }

  const bloodQuality = totalLevels / rags.length;

  console.log(hero.name, "turning in droop blood", bloodQuality);

  // aberrations = lvl 30-40
  // demilichs = lvl 39
  // void boss = lvl 45
  // Shai'taan = 60

  if (bloodQuality >= 45) {
    // legendary, near impossible to get
    hero = setQuestEvent(
      hero,
      Quest.MeetTheQueen,
      "finishedRagsLegendary",
      questEvents.finishedRagsLegendary
    );
  } else if (bloodQuality >= 39) {
    // perfect, at least lich+
    hero = setQuestEvent(
      hero,
      Quest.MeetTheQueen,
      "finishedRagsPerfect",
      questEvents.finishedRagsPerfect
    );
  } else if (bloodQuality >= 30) {
    // good enough
    hero = setQuestEvent(
      hero,
      Quest.MeetTheQueen,
      "finishedRagsGood",
      questEvents.finishedRagsGood
    );
  } else {
    // literally bad
    hero = setQuestEvent(
      hero,
      Quest.MeetTheQueen,
      "finishedRagsBad",
      questEvents.finishedRagsBad
    );
  }

  const artifactReward = context.db.artifact.rollArtifact(bloodQuality, hero);

  context.db.artifact.put(artifactReward);

  hero.equipment.artifact = artifactReward;

  context.io.sendNotification(hero.id, {
    type: "artifact",
    artifactItem: artifactReward,
    message: `You leave the palace with ${artifactReward.name} in hand.`,
  });

  hero = takeQuestItem(hero, "bloody-rag");
  hero = setQuestLogProgress(
    hero,
    Quest.MeetTheQueen,
    "meetTheQueen",
    20,
    true
  );

  return hero;
}
