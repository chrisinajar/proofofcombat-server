import {
  AttackType,
  Hero,
  AttributeType,
  HeroStats,
  EnchantmentType,
  HeroClasses,
} from "types/graphql";

import { Hero as HeroUnit } from "./hero";
import Databases from "../../db";

function generateHero(): Hero {
  const hero = Databases.hero.upgrade({
    id: "asdf",
    name: "test",
    location: {
      x: 0,
      y: 0,
      map: "default",
    },
    class: HeroClasses.Adventurer,
  });
  hero.combat.health = hero.combat.maxHealth;

  return hero;
}

describe("calculations unit base class", () => {
  it("should return values correctly", () => {
    const unit = new HeroUnit(generateHero());
    unit.baseValues.constitution = 1;
    expect(unit.stats.constitution).toBe(1);
    unit.baseValues.level = 1;
    expect(unit.stats.level).toBe(1);
  });

  it("should calculate max health", () => {
    const unitA = new HeroUnit(generateHero());
    const unitB = new HeroUnit(generateHero());

    unitA.baseValues.constitution = 1;
    expect(unitA.stats.health).toBeGreaterThan(0);

    unitB.baseValues.constitution = 10;
    expect(unitB.stats.health).toBeGreaterThan(20);

    unitB.baseValues.constitution = 2;
    expect(unitB.stats.health).toBeGreaterThan(unitA.stats.health);
  });

  it("should default values to 0", () => {
    const unit = new HeroUnit(generateHero());

    expect(unit.stats.someValue).toBe(0);
  });
});
