import { AttackType, DamageType, HeroClasses } from "types/graphql";

import { calculateDamage } from "./calculate-damage";
import type { Combatant } from "./types";
import { Unit } from "../calculations/units/unit";

describe("calculateDamage converted-type resistance caps", () => {
  test("converted Fire damage uses maxFireResistance cap (not original type cap)", () => {
    // Fix Math.random to remove variation and avoid crits logic by using Blood attack
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0);

    try {
      // Minimal attacker with Blood attack (skips crit checks) and 50% conversion to Fire
      const attackerUnit = new Unit();
      attackerUnit.attackType = AttackType.Blood; // damageType becomes Magical for base portion
      attackerUnit.baseValues.increasedBaseDamage = 100; // base damage ~100
      attackerUnit.baseValues.damageAsFire = 0.5; // convert 50% to Fire

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

      // Victim with no armor, high vulnerability to Fire such that cap determines outcome
      const victimUnit = new Unit();
      victimUnit.baseValues.armor = 0; // simplify
      // set caps: Fire capped strongly at 0.2, Magical cap lenient at 0.8
      victimUnit.baseValues.maxFireResistance = 0.2;
      victimUnit.baseValues.maxMagicalResistance = 0.8;
      // a vulnerability for Fire so resistance term is > cap and thus should be capped
      // resistance term = 1 - fireResistance; with fireResistance = -0.5 -> resistance = 1.5
      victimUnit.baseValues.fireResistance = -0.5;

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

      const result = calculateDamage(attacker, victim, false, true);
      console.log(result);
      // Expect a Fire damage instance present
      const fireHit = result.damages.find(
        (d) => d.damageType === DamageType.Fire,
      );
      expect(fireHit).toBeTruthy();

      // Base damage is 100; 50% converts to Fire => 50 pre-resist/conversion caps
      // With correct cap (maxFireResistance=0.2) and vulnerability making term 1.5, min(1.5, 0.2)=0.2
      // Expected Fire damage: 50 * 0.2 = 10 (rounded already by implementation)
      expect(fireHit?.damage).toBe(10);
    } finally {
      randomSpy.mockRestore();
    }
  });
});
