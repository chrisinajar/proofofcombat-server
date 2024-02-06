import { Hero, Quest, EnchantmentType, InventoryItem } from "types/graphql";

import Databases from "../../db";
import { BaseContext } from "../context";

import { questEvents } from "./text/rebirth-text";
import { giveHeroRandomDrop, getEnchantmentTier } from "../items/helpers";
import {
  giveQuestItemNotification,
  heroLocationName,
  takeQuestItem,
  hasQuestItem,
} from "./helpers";

export const startingLevelCap = 10;
export const secondLevelCap = 100;
export const thirdLevelCap = 5000;
export const fourthLevelCap = 6000;

export function rebirth(
  context: BaseContext,
  hero: Hero,
  disableRewards = false,
): Hero {
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
  } else if (hero.levelCap === thirdLevelCap) {
    if (
      hasQuestItem(hero, "orb-of-forbidden-power") ||
      hasQuestItem(hero, "cracked-orb-of-forbidden-power")
    ) {
      hero.levelCap = thirdLevelCap;
      hero = rebirthMessage(hero, "rebirth", questEvents.forbiddenRebirth);
    } else {
      hero.levelCap = thirdLevelCap;
      hero = rebirthMessage(hero, "rebirth", questEvents.ascendedRebirth);
      hero = giveQuestItemNotification(context, hero, "totem-of-hero");
    }

    if (!disableRewards) {
      giveHeroRandomDrop(context, hero, 33, 4, true);
    }

    // revert progress so they can rebirth again
    if (hero.questLog?.rebirth) {
      hero.questLog.rebirth.progress = 100;
    }
  }

  // 1, 2, 4, etc
  const startingLevel = Math.pow(
    2,
    Databases.hero.countEnchantments(hero, EnchantmentType.DoubleLeveling),
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

function isItemTranscended(item: InventoryItem): boolean {
  if (!item || item.level !== 34) {
    return false;
  }
  return true;
}

function isMaxTierItem(item?: InventoryItem | null): boolean {
  return !!(
    item &&
    isItemTranscended(item) &&
    item.enchantment &&
    getEnchantmentTier(item.enchantment) === 4
  );
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

  // amixea can help, grants void travel
  if (
    hasQuestItem(hero, "cracked-orb-of-forbidden-power") &&
    // heroLocationName(hero) === "Altar of Transcendence"
    !hasQuestItem(hero, "void-vessel") &&
    heroLocationName(hero) === "Amixea's Hut"
  ) {
    hero = rebirthMessage(hero, "amixeaCanHelp", questEvents.amixeaCanHelp);
    giveQuestItemNotification(context, hero, "void-vessel");

    return hero;
  }
  // amixea did help, repair the orb using the void essence
  if (
    hasQuestItem(hero, "cracked-orb-of-forbidden-power") &&
    hasQuestItem(hero, "essence-of-void") &&
    heroLocationName(hero) === "Amixea's Hut"
  ) {
    hero = rebirthMessage(hero, "amixeaDidHelp", questEvents.amixeaDidHelp);
    takeQuestItem(hero, "cracked-orb-of-forbidden-power");
    takeQuestItem(hero, "essence-of-void");
    giveQuestItemNotification(context, hero, "orb-of-forbidden-power");

    return hero;
  }

  if (hero.levelCap === thirdLevelCap && hero.level === thirdLevelCap) {
    if (
      hasQuestItem(hero, "orb-of-forbidden-power") &&
      !hasQuestItem(hero, "void-vessel") &&
      isMaxTierItem(hero.equipment.leftHand) &&
      isMaxTierItem(hero.equipment.rightHand) &&
      isMaxTierItem(hero.equipment.bodyArmor) &&
      isMaxTierItem(hero.equipment.handArmor) &&
      isMaxTierItem(hero.equipment.legArmor) &&
      isMaxTierItem(hero.equipment.headArmor) &&
      isMaxTierItem(hero.equipment.footArmor)
    ) {
      hero = rebirthMessage(hero, "forbiddenCap", questEvents.forbiddenCap);
      takeQuestItem(hero, "orb-of-forbidden-power");
      giveQuestItemNotification(
        context,
        hero,
        "cracked-orb-of-forbidden-power",
      );
      context.io.sendGlobalNotification({
        message: `A blinding light flashes from above the mountain, ${hero.name} has been cursed`,
        type: "quest",
      });
      return hero;
    }
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
    case 5000:
      if (
        hasQuestItem(hero, "orb-of-forbidden-power") ||
        hasQuestItem(hero, "cracked-orb-of-forbidden-power")
      ) {
        // repetitive rebirth in void phase
      } else {
        hero = rebirthMessage(hero, "third", questEvents.thirdCap);
        takeQuestItem(hero, "totem-of-hero");
        giveQuestItemNotification(context, hero, "totem-of-hero-rebirth");
      }
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
  message: string[],
): Hero {
  hero.currentQuest = {
    id: `Rebirth-${hero.id}-${uniqueName}`,
    message: message,
    quest: Quest.Rebirth,
  };

  if (hero.questLog.rebirth) {
    hero.questLog.rebirth.lastEvent = hero.currentQuest;
  }

  return hero;
}

function isAtLevelCap(hero: Hero): boolean {
  // could become more complex later?
  return hero.level >= hero.levelCap;
}
