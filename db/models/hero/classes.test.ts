import {
  Hero,
  HeroClasses,
  InventoryItemType,
} from "types/graphql";

import Databases from "../../../db";
import { getBaseClass, getClass } from "./classes";

function generateHero(overrides: Partial<Hero> = {}): Hero {
  return Databases.hero.upgrade({
    id: "test-class",
    name: "test",
    location: { x: 0, y: 0, map: "default" },
    class: HeroClasses.Adventurer,
    ...overrides,
  });
}

describe("getBaseClass", () => {
  it("returns Adventurer for heroes below level 10", () => {
    const hero = generateHero({ level: 5 });
    expect(getBaseClass(hero)).toBe(HeroClasses.Adventurer);
  });

  it("returns Adventurer for unarmed heroes (no weapons equipped)", () => {
    const hero = generateHero({ level: 20 });
    hero.equipment.leftHand = undefined;
    hero.equipment.rightHand = undefined;
    hero.stats.strength = 100;
    expect(getBaseClass(hero)).toBe(HeroClasses.Adventurer);
  });

  it("returns Fighter for melee + shield", () => {
    const hero = generateHero({ level: 20 });
    hero.stats.strength = 100;
    hero.equipment.leftHand = {
      id: "l",
      name: "sword",
      type: InventoryItemType.MeleeWeapon,
      level: 1,
      enchantment: undefined,
    } as any;
    hero.equipment.rightHand = {
      id: "r",
      name: "shield",
      type: InventoryItemType.Shield,
      level: 1,
      enchantment: undefined,
    } as any;
    expect(getBaseClass(hero)).toBe(HeroClasses.Fighter);
  });

  it("returns Gambler for high luck", () => {
    const hero = generateHero({ level: 20 });
    hero.stats.luck = 200;
    expect(getBaseClass(hero)).toBe(HeroClasses.Gambler);
  });
});

describe("getClass", () => {
  it("returns the base class when no upgrade enchantments are present", () => {
    const hero = generateHero({ level: 20 });
    hero.stats.luck = 200;
    expect(getClass(hero)).toBe(HeroClasses.Gambler);
  });
});
