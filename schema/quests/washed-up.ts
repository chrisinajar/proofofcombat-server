import { LocationData, MapNames } from "../../constants";

import { Hero, Quest } from "types/graphql";
import { findTerrainType } from "../../helpers";

export function checkHero(hero: Hero): Hero {
  return hero;
  /*
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
      id: hero.id,
      message: [
        "You wake up.",
        "How long were you out?",
        "Your clothes are still damp with sea water. The sound of the waves crashing almost jogs your memory for a moment, but it's all a blur.",
        "There's a port nearby, maybe the fishermen there know more about what happened.",
      ],
      quest: Quest.WashedUp,
    };

    hero.combat.health = 0;
  }

  return hero;
  */
}
