import { LocationData, MapNames, SpecialLocation } from "../../constants";

import { Hero, Quest } from "types/graphql";
import { findTerrainType, specialLocations } from "../../helpers";

export function checkHero(hero: Hero): Hero {
  // already done
  if (hero.questLog.washedUp?.finished) {
    return hero;
  }

  hero = checkInitialWashedUp(hero);
  // haven't started
  if (!hero.questLog.washedUp?.started) {
    return hero;
  }

  // in progress
  const locations: SpecialLocation[] = specialLocations(
    hero.location.x,
    hero.location.y
  );

  // console.log(locations);

  return hero;
}

function checkInitialWashedUp(hero: Hero): Hero {
  // return hero;
  const location =
    LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
      hero.location.y
    ];

  if (location.terrain === "water") {
    console.log("Washed up!");
    const [newX, newY] = findTerrainType(
      hero.location.x,
      hero.location.y,
      "land",
      1,
      1
    );

    hero.location.x = newX;
    hero.location.y = newY;

    hero.currentQuest = {
      id: `WashedUp-${hero.id}`,
      message: [
        "You wake up.",
        "How long were you out?",
        "Your clothes are still damp with sea water. The sound of the waves crashing almost jogs your memory for a moment, but it's all a blur.",
        "There's a port nearby, maybe the fishermen there can help.",
      ],
      quest: Quest.WashedUp,
    };

    hero.questLog.washedUp = {
      id: `WashedUp-${hero.id}`,
      started: true,
      finished: false,
      progress: 0,
      lastEvent: hero.currentQuest,
    };

    hero.combat.health = 0;
  }

  return hero;
}
