import { LocationData, MapNames, SpecialLocation } from "../../constants";

import { Hero, Quest, EnchantmentType } from "types/graphql";
import { findTerrainType, specialLocations } from "../../helpers";
import { BaseContext } from "../context";
import { countEnchantments } from "../items/helpers";

import { giveQuestItemNotification, hasQuestItem } from "./helpers";
import { questEvents } from "./text/washed-up-text";

/*

0 - wash up on shore

visit 6 docks
visit pub
reward

*/

const WashedUpRewards = [
  "fishermans-strength",
  "fishermans-dexterity",
  "fishermans-constitution",
  "fishermans-intelligence",
  "fishermans-wisdom",
  "fishermans-willpower",
];

type WashedUpDock = {
  name: string;
};

const docks: WashedUpDock[] = [
  {
    // the first dock is anything *but* Valtham Landing
    name: "Valtham Landing",
  },
  {
    name: "Valtham Landing",
  },
  {
    name: "Boatwright Docks",
  },
  {
    name: "Northern Point",
  },
  {
    name: "Sherlam Landing",
  },
  {
    name: "Rotherham Docks",
  },
  {
    name: "Canogeo Harbor",
  },
];

export function checkHero(context: BaseContext, hero: Hero): Hero {
  // already done
  if (hero.questLog.washedUp?.finished) {
    return hero;
  }

  hero = checkInitialWashedUp(context, hero);
  // haven't started
  if (!hero.questLog.washedUp || !hero.questLog.washedUp.started) {
    return hero;
  }

  hero = checkDock(context, hero);
  hero = checkPub(context, hero);

  return hero;
}

function checkPub(context: BaseContext, hero: Hero): Hero {
  if (hero.currentQuest) {
    return hero;
  }
  if (!hero.questLog?.washedUp) {
    return hero;
  }
  const questLogEntry = hero.questLog.washedUp;

  if (questLogEntry.progress !== 7) {
    return hero;
  }

  const locations: SpecialLocation[] = specialLocations(
    hero.location.x,
    hero.location.y,
    hero.location.map as MapNames,
  ).filter((loc) => loc.name === "The Hidden Stump Inn");

  if (!locations.length) {
    return hero;
  }

  console.log(hero.name, "is at pub location!!");

  hero = giveQuestItemNotification(context, hero, "fishermans-luck");
  hero.gold = Math.round(hero.gold / 2);

  hero.currentQuest = {
    id: `WashedUp-${hero.id}-pub`,
    message: questEvents.brewconia,
    quest: Quest.WashedUp,
  };

  hero.questLog.washedUp = {
    id: `WashedUp-${hero.id}`,
    started: true,
    finished: false,
    progress: 8,
    lastEvent: hero.currentQuest,
  };

  return hero;
}

function checkDock(context: BaseContext, hero: Hero): Hero {
  // *don't* override existing quest messages for docks
  // let them leave it up / chain messages one after another
  if (hero.currentQuest) {
    return hero;
  }
  if (!hero.questLog?.washedUp) {
    return hero;
  }
  const questLogEntry = hero.questLog.washedUp;

  const nextDock = docks[Math.floor(hero.questLog.washedUp.progress)];
  if (!nextDock) {
    // quest is passed the docks part now
    return hero;
  }
  // fetch quests are in progress
  const locations: SpecialLocation[] = specialLocations(
    hero.location.x,
    hero.location.y,
    hero.location.map as MapNames,
  ).filter((loc) => loc.type === "dock");

  const isAtNextDock = locations.find((loc) => loc.name === nextDock.name);

  if (!locations.length) {
    return hero;
  }

  if (questLogEntry.progress < 1) {
    // has no "fetch quest" yet
    if (isAtNextDock) {
      // at the first fetch quest destination, make them go somewhere else
      if (questLogEntry.progress === 0) {
        hero.currentQuest = {
          id: `WashedUp-${hero.id}-dock0`,
          message: questEvents.startingDock,
          quest: Quest.WashedUp,
        };
      }
      questLogEntry.progress = 0.5;
    } else {
      // at any dock, send off on first fetch quest
      // give old boot
      hero = giveQuestItemNotification(context, hero, "old-boot");

      hero.currentQuest = {
        id: `WashedUp-${hero.id}-dock1`,
        message: questEvents.docks[0],
        quest: Quest.WashedUp,
      };

      hero.questLog.washedUp = {
        id: `WashedUp-${hero.id}`,
        started: true,
        finished: false,
        progress: 1,
        lastEvent: hero.currentQuest,
      };
    }
    return hero;
  }

  // after the first location, you now *must* go to the next correct one each time
  if (!isAtNextDock) {
    return hero;
  }

  console.log(hero.name, "AT THE NEXT DOCK!");

  const questItems = [
    "old-boot",
    "old-pocket-watch",
    "old-fishing-rod",
    "old-fishing-book",
    "old-walking-stick",
    "old-coin",
  ];

  if (questLogEntry.progress > 0) {
    if (questItems[questLogEntry.progress - 1]) {
      hero.inventory = hero.inventory.filter(
        (item) => item.baseItem !== questItems[questLogEntry.progress - 1],
      );
    }
    // add pocket watch
    if (questItems[questLogEntry.progress]) {
      hero = giveQuestItemNotification(
        context,
        hero,
        questItems[questLogEntry.progress],
      );
    }
  }

  hero = getNewAward(context, hero);

  hero.currentQuest = {
    id: `WashedUp-${hero.id}-dock${questLogEntry.progress}`,
    message: questEvents.docks[questLogEntry.progress],
    quest: Quest.WashedUp,
  };

  hero.questLog.washedUp = {
    id: `WashedUp-${hero.id}`,
    started: true,
    finished: false,
    progress: questLogEntry.progress + 1,
    lastEvent: hero.currentQuest,
  };

  return hero;
}

function checkInitialWashedUp(context: BaseContext, hero: Hero): Hero {
  // return hero;
  const location =
    LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
      hero.location.y
    ];

  if (location.terrain === "water") {
    if (countEnchantments(hero, EnchantmentType.CanTravelOnWater) > 0) {
      return hero;
    }

    console.log("Washed up!");
    const [newX, newY] = findTerrainType(
      hero.location.x,
      hero.location.y,
      "land",
      1,
      1,
    );

    hero.location.x = newX;
    hero.location.y = newY;

    // overwrites existing currentQuest messages
    // mostly since it kills/moves you
    hero.currentQuest = {
      id: `WashedUp-${hero.id}-wakeUp`,
      message: questEvents.wakeUp,
      quest: Quest.WashedUp,
    };

    hero.questLog.washedUp = {
      id: `WashedUp-${hero.id}`,
      started: true,
      finished: false,
      progress: hero.questLog?.washedUp?.progress || 0,
      lastEvent: hero.questLog?.washedUp?.lastEvent || hero.currentQuest,
    };

    hero.combat.health = 0;

    // fix potential past bugs...
    if (hasQuestItem(hero, "fishermans-luck")) {
      hero.questLog.washedUp.progress = 8;
    }
  }

  return hero;
}

function getNewAward(context: BaseContext, hero: Hero): Hero {
  const options = WashedUpRewards.filter((questItem) => {
    const existingItem = hero.inventory.find(
      (inventoryItem) => inventoryItem.baseItem === questItem,
    );

    return !existingItem;
  });

  if (options.length) {
    hero = giveQuestItemNotification(
      context,
      hero,
      options[Math.floor(options.length * Math.random())],
    );
  }

  return hero;
}
