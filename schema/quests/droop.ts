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
import { questEvents } from "./text/droop-text";

export function checkHeroDrop(
  context: BaseContext,
  hero: Hero,
  monster: MonsterInstance
): Hero {
  // already finished
  if (hero.questLog.droop?.finished) {
    return hero;
  }
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

  // much lower chance of getting it started than to find the next step
  if (hero.questLog.droop?.started) {
    if (Math.random() > 1 / 16) {
      return hero;
    }
  } else {
    if (Math.random() > 1 / 300) {
      return hero;
    }
  }

  const secretLocation = getDroopsSecretHidingSpot(hero);
  if (
    hero.location.map === "default" &&
    hero.location.x === secretLocation[0] &&
    hero.location.y === secretLocation[1]
  ) {
    hero = weFoundDroop(context, hero);
    return hero;
    // secretLocation
  }
  // lol, droop sucks
  secretLocation[0] += Math.floor(Math.random() * 3) - 1;
  secretLocation[1] += Math.floor(Math.random() * 3) - 1;
  const eastWest = secretLocation[0] > hero.location.x ? "east" : "west";
  const northSouth = secretLocation[1] > hero.location.y ? "south" : "north";

  const direction = `${northSouth} and ${eastWest}`;

  // questEvents
  const message = questEvents.poorlyDrawnMap.map((m) =>
    m.replace("{{direction}}", direction)
  );

  hero.currentQuest = {
    id: `DroopsQuest-${hero.id}-hobgoblin-map-${Math.random()}`,
    message: message,
    quest: Quest.DroopsQuest,
  };

  hero.questLog.droop = {
    id: `DroopsQuest-${hero.id}`,
    started: true,
    finished: false,
    progress: (hero.questLog.droop?.progress ?? 0) + 1,
    lastEvent: hero.currentQuest,
  };
  // const secret
  // const eastWest =

  return hero;
}

function weFoundDroop(context: BaseContext, hero: Hero): Hero {
  hero.currentQuest = {
    id: `DroopsQuest-${hero.id}-found`,
    message: questEvents.foundDroop,
    quest: Quest.DroopsQuest,
  };

  hero.questLog.droop = {
    id: `DroopsQuest-${hero.id}`,
    started: true,
    finished: true,
    progress: (hero.questLog.droop?.progress ?? 0) + 1,
    lastEvent: hero.currentQuest,
  };

  hero = giveQuestItemNotification(context, hero, "dont-get-hit");
  hero.gold += 5000000;
  console.log(hero.name, "finished droops quest");

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
