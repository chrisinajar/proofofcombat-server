import { Hero, InventoryItem, Quest } from "types/graphql";
import { questEvents } from "./text/taste-for-business";
import { setQuestEvent } from "./helpers";
import { BaseContext } from "../context";

export function checkHeroPurchase(context: BaseContext, hero: Hero, item: InventoryItem, price: number): Hero {
  if (hero.questLog.tasteForBusiness?.finished) {
    return hero;
  }
  if (!hero.questLog.tasteForBusiness) {
    // use progress to track spent totals
    hero.questLog.tasteForBusiness = {
      id: `TasteForBusiness-${hero.id}`,
      started: true,
      finished: false,
      progress: 0,
      lastEvent: null,
    };
  }

  // update the questlog entry with the spent amount
  hero.questLog.tasteForBusiness.progress += price;

  if (hero.questLog.tasteForBusiness.progress >= 1000) {
    hero = setQuestEvent(hero, Quest.TasteForBusiness, "aFineCustomer", questEvents.aFineCustomer);
  }

  if (hero.questLog.tasteForBusiness.progress >= 2000) {
    hero = setQuestEvent(hero, Quest.TasteForBusiness, "aLittleOpportunity", questEvents.aLittleOpportunity);
  }

  return hero;
}
