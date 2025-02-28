import { Hero, InventoryItem, Quest } from "types/graphql";
import { questEvents } from "./text/taste-for-business";
import { setQuestEvent, setQuestLogProgress } from "./helpers";
import { BaseContext } from "../context";

export function checkHeroPurchase(context: BaseContext, hero: Hero, item: InventoryItem, price: number): Hero {
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

  if (hero.questLog.tasteForBusiness.progress >= 1000 && !hero.questLog.tasteForBusiness.started) {
    hero = setQuestEvent(hero, Quest.TasteForBusiness, "aFineCustomer", questEvents.aFineCustomer);
    hero = setQuestLogProgress(
      hero,
      Quest.TasteForBusiness,
      "tasteForBusiness",
      1001,
    );
  }

  if (hero.questLog.tasteForBusiness && hero.questLog.tasteForBusiness.lastEvent?.id === `TasteForBusiness-${hero.id}-aFineCustomer` && hero.questLog.tasteForBusiness.progress >= 2000) {
    hero = setQuestEvent(hero, Quest.TasteForBusiness, "aLittleOpportunity", questEvents.aLittleOpportunity);
    hero = setQuestLogProgress(
      hero,
      Quest.TasteForBusiness,
      "tasteForBusiness",
      2001,
    );
  }

  return hero;
}
