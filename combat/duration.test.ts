import { executeFight } from "./fight";
import { createHeroCombatant } from "./hero";
import { createMonsterCombatant } from "./monster";
import { AttackType } from "types/graphql";
import Databases from "../db";
import { GenericStatsModifier } from "../calculations/modifiers/generic-stats-modifier";
import { COMBAT_DURATION } from "./constants";

function makeCombatants() {
  const hero = Databases.hero.upgrade({ id: "h", name: "h" });
  const attacker = createHeroCombatant(hero, AttackType.Melee);
  const victim = createMonsterCombatant({
    id: "m",
    monster: {
      id: "mx",
      name: "mx",
      level: 1,
      attackType: AttackType.Melee,
      combat: { health: 999999, maxHealth: 999999 },
    },
    attackSpeedRemainder: 0,
  } as any);
  return { attacker, victim };
}

describe("combat duration tracking", () => {
  test("durationRemaining is 0 when duration exhausted", () => {
    const { attacker, victim } = makeCombatants();
    const result = executeFight(attacker, victim, 0);
    expect(result.durationRemaining).toBe(0);
  });

  describe("persistent modifier ticking during combat", () => {
    test("modifier duration decreases by total combat time", () => {
      const { attacker, victim } = makeCombatants();
      attacker.unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 100 },
        remainingDuration: 30000,
      });

      executeFight(attacker, victim, COMBAT_DURATION);

      const mods = attacker.unit.getPersistentModifiers();
      expect(mods).toHaveLength(1);
      expect(mods[0].remainingDuration).toBe(30000 - COMBAT_DURATION);
    });

    test("modifier is removed when it expires mid-combat", () => {
      const { attacker, victim } = makeCombatants();
      attacker.unit.applyModifier(GenericStatsModifier, {
        bonus: { strength: 100 },
        remainingDuration: 1000,
      });

      executeFight(attacker, victim, COMBAT_DURATION);

      expect(attacker.unit.getPersistentModifiers()).toHaveLength(0);
    });

    test("victim modifiers are also ticked during combat", () => {
      const { attacker, victim } = makeCombatants();
      victim.unit.applyModifier(GenericStatsModifier, {
        isDebuff: true,
        multiplier: { strength: 0.5 },
        remainingDuration: 30000,
      });

      executeFight(attacker, victim, COMBAT_DURATION);

      const mods = victim.unit.getPersistentModifiers();
      expect(mods).toHaveLength(1);
      expect(mods[0].remainingDuration).toBe(30000 - COMBAT_DURATION);
    });
  });
});
