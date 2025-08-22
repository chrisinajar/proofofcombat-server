import { AttackType, HeroClasses } from "types/graphql";

import { calculateDamage } from "./calculate-damage";
import type { Combatant } from "./types";
import { Unit } from "../calculations/units/unit";
import {
  GenericStatsModifier,
  GenericStatsModifierOptions,
} from "../calculations/modifiers/generic-stats-modifier";

describe("calculateDamage attacker/victim multipliers", () => {
  test("damage scales by attacker amp and victim DR", () => {
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);
    try {
      // Baseline attacker: Blood to avoid crits; base damage ~100
      const attackerUnit = new Unit();
      attackerUnit.attackType = AttackType.Blood;
      attackerUnit.baseValues.increasedBaseDamage = 100;

      const attacker: Combatant = {
        class: HeroClasses.BloodMage,
        attackType: AttackType.Blood,
        level: 1,
        name: "attacker",
        equipment: { armor: [], weapons: [], quests: [] },
        damageReduction: 0,
        health: 1000,
        maxHealth: 1000,
        attributes: {
          strength: 1,
          dexterity: 1,
          constitution: 1,
          intelligence: 1,
          wisdom: 1,
          willpower: 1,
          luck: 1,
        },
        luck: { smallModifier: 0, largeModifier: 0, ultraModifier: 0 },
        unit: attackerUnit,

        attackSpeed: 1500,
        attackSpeedRemainder: 0,
      };

      // Baseline victim: minimal armor/resist
      const victimUnit = new Unit();
      victimUnit.baseValues.armor = 0;

      const victim: Combatant = {
        class: HeroClasses.Adventurer,
        attackType: AttackType.Melee,
        level: 1,
        name: "victim",
        equipment: { armor: [], weapons: [], quests: [] },
        damageReduction: 0,
        health: 1000,
        maxHealth: 1000,
        attributes: {
          strength: 1,
          dexterity: 1,
          constitution: 1,
          intelligence: 1,
          wisdom: 1,
          willpower: 1,
          luck: 1,
        },
        luck: { smallModifier: 0, largeModifier: 0, ultraModifier: 0 },
        unit: victimUnit,

        attackSpeed: 1600,
        attackSpeedRemainder: 0,
      };

      const baseline = calculateDamage(attacker, victim, false, true);
      const baseDamage = baseline.damages.reduce((m, d) => m + d.damage, 0);

      // Apply attacker amplification and victim damage reduction
      attackerUnit.applyModifier<
        GenericStatsModifier,
        GenericStatsModifierOptions
      >({
        type: GenericStatsModifier,
        options: { multiplier: { percentageDamageIncrease: 1.5 } },
      });
      victimUnit.applyModifier<
        GenericStatsModifier,
        GenericStatsModifierOptions
      >({
        type: GenericStatsModifier,
        options: { multiplier: { percentageDamageReduction: 0.8 } },
      });

      const modified = calculateDamage(attacker, victim, false, true);
      const modDamage = modified.damages.reduce((m, d) => m + d.damage, 0);

      expect(modDamage).toMatchSnapshot();
    } finally {
      randomSpy.mockRestore();
    }
  });
});
