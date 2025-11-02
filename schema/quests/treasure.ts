import {
  Hero,
  InventoryItem,
  MonsterInstance,
  Quest,
  Location,
} from "types/graphql";

import { BaseContext } from "../context";
import {
  LocationData,
  MapNames,
  MAP_DIMENSIONS,
  TerrainType,
} from "../../constants";
import { getRandomizer } from "../../random";
import {
  hasQuestItem,
  getOrCreateQuestItem,
  giveQuestItemNotification,
} from "./helpers";

export function checkHeroGossip(
  context: BaseContext,
  hero: Hero,
  location: Location,
): Hero {
  /**
   * @TODO: randomly give a treasure map when gossipping

    don't give a treasure map if they already have one.
    create some silly deterministic random location sort of like the droop quest
    get to location, there's a dungeon there. Upon completing the dungeon, they get a reward


    to figure out/decide:
    if you should be able to do it multiple times or not
    what the rewards should be
  */
  // For now: if the hero does not have a Treasure Map, give exactly one.
  if (!hasQuestItem(hero, "treasure-map")) {
    giveQuestItemNotification(context, hero, "treasure-map");
    const item = getOrCreateQuestItem(hero, "treasure-map");
    // Testing: log the granted item instance
    // eslint-disable-next-line no-console
    console.log("Granted treasure map:", item);
  }
  return hero;
}

// Deterministic land location generator for a given item ID.
// Uses the seeded randomizer so the same ID always returns the same land location.
export function getDeterministicLocationForItem(
  itemId: string,
  requiredTerrain: TerrainType = "land",
  map: MapNames = "default",
): Location {
  const rng = getRandomizer(`treasure-${itemId}-${requiredTerrain}`);

  let x = 0;
  let y = 0;
  let cell = LocationData[map]?.locations[x][y];

  for (let i = 0; i < 1000; ++i) {
    x = Math.floor(rng() * MAP_DIMENSIONS.WIDTH);
    y = Math.floor(rng() * MAP_DIMENSIONS.HEIGHT);
    cell = LocationData[map]?.locations[x][y];
    if (cell.terrain === requiredTerrain) {
      return { map, x, y };
    }
  }

  // Deterministic fallback: scan from 0,0 to find the first matching cell
  for (let sx = 0; sx < MAP_DIMENSIONS.WIDTH; sx++) {
    for (let sy = 0; sy < MAP_DIMENSIONS.HEIGHT; sy++) {
      const c = LocationData[map]?.locations[sx][sy];
      if (c.terrain === requiredTerrain) {
        return { map, x: sx, y: sy };
      }
    }
  }

  // eslint-disable-next-line no-console
  console.error(
    `Failed to find a ${requiredTerrain} location; defaulting to 0,0`,
    { itemId, map },
  );
  return { map, x: 0, y: 0 };
}

// Produce a vague, directional hint from the hero's current position toward a target location.
// Intentionally avoids exact distances to encourage reading the map multiple times.
export function getTreasureMapHint(hero: Hero, target: Location): string {
  if (hero.location.map !== target.map) {
    return "This map depicts a place not of this realm.";
  }

  const dx = target.x - hero.location.x; // +x => east
  const dy = target.y - hero.location.y; // +y => south in our grid

  const distance = Math.hypot(dx, dy);
  const diag = Math.hypot(MAP_DIMENSIONS.WIDTH, MAP_DIMENSIONS.HEIGHT);
  const ratio = distance / diag;

  // Distance bands as a fraction of map diagonal
  let distancePhrase: string;
  if (ratio <= 0.02) distancePhrase = "almost here";
  else if (ratio <= 0.07) distancePhrase = "very close";
  else if (ratio <= 0.2) distancePhrase = "not far";
  else if (ratio <= 0.4) distancePhrase = "a ways off";
  else distancePhrase = "quite distant";

  // Direction: use 8-way compass, flipping Y so 90° means north
  const angle = Math.atan2(-dy, dx); // radians, 0=east, pi/2=north
  const deg = (angle * 180) / Math.PI;
  const normalized = (deg + 360) % 360; // 0..360

  function dirWord(d: number): string {
    if (d >= 337.5 || d < 22.5) return "east";
    if (d < 67.5) return "northeast";
    if (d < 112.5) return "north";
    if (d < 157.5) return "northwest";
    if (d < 202.5) return "west";
    if (d < 247.5) return "southwest";
    if (d < 292.5) return "south";
    return "southeast";
  }

  const direction = dirWord(normalized);

  if (distancePhrase === "almost here") {
    return "The markings suggest it's almost here; look around.";
  }
  return `The markings suggest it's ${distancePhrase} to the ${direction}.`;
}

// Compose the target and hint for a given map item id.
// This does not mutate hero; it only returns the hint string.
export function getTreasureMapReadMessage(hero: Hero, itemId: string): string {
  const target = getDeterministicLocationForItem(
    itemId,
    "land",
    hero.location.map as MapNames,
  );
  return getTreasureMapHint(hero, target);
}
