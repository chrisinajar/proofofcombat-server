import {
  Hero,
  InventoryItem,
  MonsterInstance,
  HeroClasses,
  Quest,
} from "types/graphql";

import { LocationData, MapNames, SpecialLocation } from "../../constants";
import { getRandomizer } from "../../random";

import { BaseContext } from "../context";

import {
  giveQuestItemNotification,
  hasQuestItem,
  takeQuestItem,
} from "./helpers";
import { questEvents } from "./text/washed-up-text";

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  // hasn't met droop
  if (
    !hero.questLog.washedUp?.progress ||
    hero.questLog.washedUp.progress < 8
  ) {
    return hero;
  }

  if (monster.monster.id !== "Hobgoblin") {
    return hero;
  }

  if (Math.random() > 0.1) {
    return hero;
  }

  // const secret
  // const eastWest =

  // console.log("Land location:", );
  // console.log("Land location:", getDroopsSecretHidingSpot(hero));

  return hero;
}

function getDroopsSecretHidingSpot(hero: Hero): [number, number] {
  const rng = getRandomizer(`droop-${hero.id}`);

  let x = 0;
  let y = 0;

  let location = LocationData[hero.location.map as MapNames]?.locations[x][y];

  for (let i = 0; i < 1000; ++i) {
    x = Math.floor(rng() * 128);
    y = Math.floor(rng() * 96);
    location = LocationData[hero.location.map as MapNames]?.locations[x][y];

    if (location.terrain === "land") {
      break;
    }
  }
  if (location.terrain !== "land") {
    console.error("Failed to find a land location after 1000 tries!?");
    x = 0;
    y = 0;
  }

  return [x, y];
}
