import { AttackType, Hero } from "types/graphql";
import { didHit, createHeroCombatant } from "./";
import Databases from "../db";

function generateHero(): Hero {
  const hero = Databases.hero.upgrade({
    name: "test",
    password: "sadfasdf",
    location: {
      x: 0,
      y: 0,
      map: "default",
    },
  });
  hero.combat.health = hero.combat.maxHealth;

  return hero;
}

function getHitOdds(heroA, attackType, heroB) {
  let didHitCount = 0;
  for (let i = 0; i < 100000; ++i) {
    if (didHit(heroA, attackType, heroB)) {
      didHitCount += 1;
    }
  }

  return Math.round(didHitCount / 1000) / 100;
}

describe("combat", () => {
  [
    { stat: "strength", attackType: AttackType.Melee },
    { stat: "dexterity", attackType: AttackType.Ranged },
    { stat: "constitution", attackType: AttackType.Blood },
    { stat: "intelligence", attackType: AttackType.Wizard },
    { stat: "wisdom", attackType: AttackType.Elemental },
    { stat: "charisma", attackType: AttackType.Holy },
  ].forEach((entry) => {
    it(`increasing ${entry.stat} makes it easier to hit with ${entry.attackType}`, () => {
      const hero = generateHero();
      const heroCombatant = createHeroCombatant(hero);
      const hero2 = generateHero();
      const hero2Combatant = createHeroCombatant(hero2);
      const oddsBefore = getHitOdds(
        heroCombatant,
        entry.attackType,
        hero2Combatant
      );

      heroCombatant.attributes[entry.stat] *= 1.1;

      const oddsAfter = getHitOdds(
        heroCombatant,
        entry.attackType,
        hero2Combatant
      );
      expect(oddsBefore).toBeLessThan(oddsAfter);
    });
  });
});
