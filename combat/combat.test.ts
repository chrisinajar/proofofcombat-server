import { AttackType, Hero, AttributeType } from "types/graphql";
import {
  calculateHit,
  createHeroCombatant,
  Combatant,
  attributesForAttack,
  calculateDamage,
} from "./";
import Databases from "../db";

function generateHero(): Hero {
  const hero = Databases.hero.upgrade({
    id: "asdf",
    name: "test",
    location: {
      x: 0,
      y: 0,
      map: "default",
    },
  });
  hero.combat.health = hero.combat.maxHealth;

  return hero;
}

function getAverageDamage(
  heroA: Combatant,
  attackType: AttackType,
  heroB: Combatant
) {
  let totalDamage = 0;
  for (let i = 0; i < 10000; ++i) {
    totalDamage += calculateDamage(heroA, attackType, heroB).damage;
  }

  return Math.round(totalDamage / 1000) / 10;
}

function getHitOdds(
  heroA: Combatant,
  attackType: AttackType,
  heroB: Combatant
) {
  let didHit = 0;
  for (let i = 0; i < 100000; ++i) {
    if (calculateHit(heroA, attackType, heroB)) {
      didHit += 1;
    }
  }

  return Math.round(didHit / 1000) / 100;
}

type Attribute =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "willpower"
  | "luck";

describe("combat", () => {
  const combatTypes: { attackType: AttackType }[] = [
    { attackType: AttackType.Melee },
    { attackType: AttackType.Ranged },
    { attackType: AttackType.Blood },
    { attackType: AttackType.Cast },
    { attackType: AttackType.Smite },
  ];
  combatTypes.forEach((entry) => {
    const stats = attributesForAttack(entry.attackType);
    describe(`attacking with ${entry.attackType}`, () => {
      it(`increasing ${stats.toHit} makes it easier to hit`, () => {
        const hero = generateHero();
        const heroCombatant = createHeroCombatant(hero, entry.attackType);
        const hero2 = generateHero();
        const hero2Combatant = createHeroCombatant(hero2, entry.attackType);
        const oddsBefore = getHitOdds(
          heroCombatant,
          entry.attackType,
          hero2Combatant
        );

        heroCombatant.attributes[stats.toHit] *= 1.5;

        const oddsAfter = getHitOdds(
          heroCombatant,
          entry.attackType,
          hero2Combatant
        );
        expect(oddsBefore).toBeLessThan(oddsAfter);
      });
      it(`increasing ${stats.damage} makes you do more damage`, () => {
        const hero = generateHero();
        const heroCombatant = createHeroCombatant(hero, entry.attackType);
        const hero2 = generateHero();
        const hero2Combatant = createHeroCombatant(hero2, entry.attackType);
        const damageBefore = getAverageDamage(
          heroCombatant,
          entry.attackType,
          hero2Combatant
        );

        heroCombatant.attributes[stats.damage] *= 1.5;

        const damageAfter = getAverageDamage(
          heroCombatant,
          entry.attackType,
          hero2Combatant
        );
        expect(damageBefore).toBeLessThan(damageAfter);
      });
      it(`increasing ${stats.damage} a little makes you do more damage even with big weapons`, () => {
        const hero = generateHero();
        const heroCombatant = createHeroCombatant(hero, entry.attackType);
        const hero2 = generateHero();
        const hero2Combatant = createHeroCombatant(hero2, entry.attackType);
        heroCombatant.equipment.weapons.push({ level: 32 });
        const damageBefore = getAverageDamage(
          heroCombatant,
          entry.attackType,
          hero2Combatant
        );

        heroCombatant.attributes[stats.damage] *= 1.1;

        const damageAfter = getAverageDamage(
          heroCombatant,
          entry.attackType,
          hero2Combatant
        );
        expect(damageBefore).toBeLessThan(damageAfter);
      });
      it(`having a ton of ${stats.damage} makes you do way more damage`, () => {
        const hero = generateHero();
        const heroCombatant = createHeroCombatant(hero, entry.attackType);
        const hero2 = generateHero();
        const hero2Combatant = createHeroCombatant(hero2, entry.attackType);
        const damageBefore = getAverageDamage(
          heroCombatant,
          entry.attackType,
          hero2Combatant
        );

        heroCombatant.attributes[stats.damage] *= 100;

        const damageAfter = getAverageDamage(
          heroCombatant,
          entry.attackType,
          hero2Combatant
        );
        expect(damageBefore * 50).toBeLessThan(damageAfter);
      });
    });
  });
});
describe("builds", () => {
  describe("archer", () => {
    const trashGear = {};
    const normalGear = {};
    const greatGear = {};
    const uberGear = {};
  });
});
