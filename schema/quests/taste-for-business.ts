import { Hero, InventoryItem, Quest } from "types/graphql";
import { BaseContext } from "schema/context";
import { isAtSpecialLocation } from "../../helpers";
import { MapNames } from "../../constants";

import { questEvents } from "./text/taste-for-business-text";
import {
  giveQuestItemNotification,
  hasQuestItem,
  setQuestEvent,
  setQuestLogProgress,
  takeQuestItem,
} from "./helpers";

export function checkHeroPurchase(
  context: BaseContext,
  hero: Hero,
  item: InventoryItem,
  price: number,
): Hero {
  if (hero.questLog.tasteForBusiness?.finished) {
    return hero;
  }
  if (!hero.questLog.tasteForBusiness) {
    // use progress to track spent totals
    hero.questLog.tasteForBusiness = {
      id: `TasteForBusiness-${hero.id}`,
      started: false,
      finished: false,
      progress: 0,
      lastEvent: null,
    };
  }

  // make typescript happy
  if (!hero.questLog.tasteForBusiness) {
    return hero;
  }

  // update the questlog entry with the spent amount
  hero.questLog.tasteForBusiness.progress += price;

  if (
    hero.questLog.tasteForBusiness.progress >= 1000 &&
    !hero.questLog.tasteForBusiness.started
  ) {
    hero = setQuestEvent(
      hero,
      Quest.TasteForBusiness,
      "aFineCustomer",
      questEvents.aFineCustomer,
    );
    hero = setQuestLogProgress(
      hero,
      Quest.TasteForBusiness,
      "tasteForBusiness",
      1001,
    );
  }

  if (
    hero.questLog.tasteForBusiness &&
    hero.questLog.tasteForBusiness.lastEvent?.id ===
      `TasteForBusiness-${hero.id}-aFineCustomer` &&
    hero.questLog.tasteForBusiness.progress >= 2000
  ) {
    hero = setQuestEvent(
      hero,
      Quest.TasteForBusiness,
      "aLittleOpportunity",
      questEvents.aLittleOpportunity,
    );
    hero = setQuestLogProgress(
      hero,
      Quest.TasteForBusiness,
      "tasteForBusiness",
      2001,
    );

    giveQuestItemNotification(context, hero, "small-wrapped-package");
    hero.gold += 1000;
  }

  return hero;
}

export function checkHero(context: BaseContext, hero: Hero): Hero {
  if (hero.questLog.tasteForBusiness?.finished) {
    return hero;
  }

  if (!hero.questLog.tasteForBusiness) {
    return hero;
  }

  if (
    hero.questLog.tasteForBusiness.lastEvent?.id ===
    `TasteForBusiness-${hero.id}-packageDelivered`
  ) {
    hero = setQuestEvent(
      hero,
      Quest.TasteForBusiness,
      "sausageLol",
      questEvents.sausageLol,
    );
    hero = setQuestLogProgress(
      hero,
      Quest.TasteForBusiness,
      "tasteForBusiness",
      2005,
    );

    hero.gold += 1000;
    // this conditional is just to make typescript happy, too lazy to do it "right"
    if (hero.questLog.tasteForBusiness) {
      hero.questLog.tasteForBusiness.finished = true;
    }
  }

  return hero;
}
export function checkHeroLocation(
  context: BaseContext,
  hero: Hero,
): Hero {
  if (hero.questLog.tasteForBusiness?.finished) {
    return hero;
  }

  if (
    hero.questLog.tasteForBusiness &&
    hasQuestItem(hero, "small-wrapped-package") &&
    isAtSpecialLocation(
      hero.location.x,
      hero.location.y,
      hero.location.map as MapNames,
      "The Hidden Stump Inn",
    )
  ) {
    takeQuestItem(hero, "small-wrapped-package");

    hero = setQuestEvent(
      hero,
      Quest.TasteForBusiness,
      "packageDelivered",
      questEvents.packageDelivered,
    );
    hero = setQuestLogProgress(
      hero,
      Quest.TasteForBusiness,
      "tasteForBusiness",
      2002,
    );
  }

  return hero;
}
