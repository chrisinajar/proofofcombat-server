import {
  PlayerLocation,
  PlayerLocationUpgrades,
  Quest,
  Hero,
} from "types/graphql";
import { BaseContext } from "../context";

import { questEvents } from "./text/settlements-text";
import {
  hasQuestItem,
  setQuestEvent,
  setQuestLogProgress,
  giveQuestItemNotification,
} from "./helpers";

export async function checkCapital(
  context: BaseContext,
  capital: PlayerLocation,
  hero: Hero,
): Promise<void> {
  let hasGovernorsTitle = hasQuestItem(hero, "governors-title");
  if (!hero.questLog.settlements && !hasGovernorsTitle) {
    // governor's title
    const population =
      capital.resources.find((resource) => resource.name === "population")
        ?.value ?? 0;

    if (population > 1000) {
      // give!
      giveQuestItemNotification(context, hero, "governors-title");
      console.log("Giving governor title");
      hero = setQuestEvent(
        hero,
        Quest.Settlements,
        "governor",
        questEvents.governor,
      );
      hero = setQuestLogProgress(hero, Quest.Settlements, "settlements", 1);
      hasGovernorsTitle = true;

      await context.db.hero.put(hero);
    }
  }
  if (
    hasGovernorsTitle &&
    capital.upgrades.indexOf(PlayerLocationUpgrades.HasGovernorsTitle) === -1
  ) {
    capital.upgrades.push(PlayerLocationUpgrades.HasGovernorsTitle);
    await context.db.playerLocation.put(capital);
  }
}
