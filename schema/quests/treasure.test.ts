import { Hero, Location } from "types/graphql";
import {
  getDeterministicLocationForItem,
  getTreasureMapHint,
} from "./treasure";
import { LocationData, MAP_DIMENSIONS } from "../../constants";

function makeHeroAt(location: Location): Hero {
  return {
    id: "hero-1",
    name: "Tester",
    inventory: [],
    questLog: {},
    location,
  } as unknown as Hero;
}

describe("Treasure helpers", () => {
  describe("getDeterministicLocationForItem", () => {
    it("returns the same land location for the same item id", () => {
      const loc1 = getDeterministicLocationForItem(
        "item-abc",
        "land",
        "default",
      );
      const loc2 = getDeterministicLocationForItem(
        "item-abc",
        "land",
        "default",
      );

      expect(loc1).toEqual(loc2);

      const cell =
        LocationData[loc1.map as "default"].locations[loc1.x][loc1.y];
      expect(cell.terrain).toBe("land");
    });

    it("can target water terrain when available", () => {
      // Check if water exists on default map; if not, skip to avoid false failures.
      const hasWater = LocationData.default.locations.some((col) =>
        col.some((c) => c.terrain === "water"),
      );
      if (!hasWater) {
        return; // skip
      }

      const loc = getDeterministicLocationForItem(
        "item-water",
        "water",
        "default",
      );
      const cell = LocationData.default.locations[loc.x][loc.y];
      expect(cell.terrain).toBe("water");
    });
  });

  describe("getTreasureMapHint", () => {
    it("indicates cross-realm when map ids differ", () => {
      const hero = makeHeroAt({ map: "default", x: 10, y: 10 });
      const target: Location = { map: "void", x: 10, y: 10 } as any;
      const hint = getTreasureMapHint(hero, target);
      expect(hint).toBe("This map depicts a place not of this realm.");
    });

    it("returns a vague direction and distance when far (northeast, quite distant)", () => {
      const center: Location = {
        map: "default",
        x: Math.floor(MAP_DIMENSIONS.WIDTH / 2),
        y: Math.floor(MAP_DIMENSIONS.HEIGHT / 2),
      };
      const hero = makeHeroAt(center);

      // Choose a target northeast and far enough for the largest band
      const target: Location = {
        map: "default",
        x: Math.min(center.x + 56, MAP_DIMENSIONS.WIDTH - 1),
        y: Math.max(center.y - 48, 0),
      };

      const hint = getTreasureMapHint(hero, target);
      expect(hint).toContain("quite distant");
      expect(hint).toContain("northeast");
    });

    it("returns 'almost here' when very close", () => {
      const hero = makeHeroAt({ map: "default", x: 20, y: 20 });
      const target: Location = { map: "default", x: 23, y: 20 } as any; // distance = 3
      const hint = getTreasureMapHint(hero, target);
      expect(hint).toContain("almost here");
    });
  });
});
