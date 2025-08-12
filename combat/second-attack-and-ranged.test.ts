import {
  AttackType,
  HeroClasses,
  InventoryItemType,
} from "types/graphql";

import { calculateDamageValues, attackCombatant } from "./";
import type { Combatant } from "./types";
import { Unit } from "../calculations/units/unit";

function makeBaseCombatant(
  cls: HeroClasses,
  attackType: AttackType,
  unit: Unit,
  name = "unit",
): Combatant {
  return {
    class: cls,
    attackType,
    level: 1,
    name,
    equipment: { armor: [], weapons: [], quests: [] },
    damageReduction: 0,
    health: 1000,
    maxHealth: 1000,
    attributes: {
      strength: 10,
      dexterity: 10,
      constitution: 10,
      intelligence: 10,
      wisdom: 10,
      willpower: 10,
      luck: 10,
    },
    luck: { smallModifier: 0, largeModifier: 0, ultraModifier: 0 },
    unit,

    attackSpeed: 1500,
    attackSpeedRemainder: 0,
  };
}

describe("two-weapon alternation and ranged cadence", () => {
  const rand = jest.spyOn(Math, "random").mockReturnValue(0);
  afterAll(() => rand.mockRestore());

  test("melee: second attack uses second weapon base", () => {
    const attackerUnit = new Unit();
    attackerUnit.class = HeroClasses.Fighter;
    attackerUnit.attackType = AttackType.Melee;
    attackerUnit.baseValues.increasedBaseDamage = 0; // stabilize formula

    // Equip two melee weapons: levels 10 and 4
    attackerUnit.equipItem({
      level: 10,
      baseItem: "short-sword",
      enchantment: null,
      type: InventoryItemType.MeleeWeapon,
      name: "Short Sword",
      imbue: null,
    });
    attackerUnit.equipItem({
      level: 4,
      baseItem: "sickle",
      enchantment: null,
      type: InventoryItemType.MeleeWeapon,
      name: "Sickle",
      imbue: null,
    });

    const victimUnit = new Unit();
    victimUnit.baseValues.armor = 0;

    const attacker = makeBaseCombatant(
      HeroClasses.Fighter,
      AttackType.Melee,
      attackerUnit,
      "attacker",
    );
    // Mirror equipment on combatant for any logic that looks there
    attacker.equipment.weapons = [
      { level: 10, baseItem: "short-sword", enchantment: null, type: InventoryItemType.MeleeWeapon },
      { level: 4, baseItem: "sickle", enchantment: null, type: InventoryItemType.MeleeWeapon },
    ];

    const victim = makeBaseCombatant(
      HeroClasses.Adventurer,
      AttackType.Melee,
      victimUnit,
      "victim",
    );

    const first = calculateDamageValues(attacker, victim, false, true);
    const second = calculateDamageValues(attacker, victim, true, true);

    // Sanity: baseDamage reflects different weapon tiers
    expect(first.baseDamage).toBeGreaterThan(second.baseDamage);

    // And matches unit-level base damage computation for each slot
    const unitFirst = attackerUnit.getBaseDamage(false);
    const unitSecond = attackerUnit.getBaseDamage(true);
    // With zero armor, calculateDamageValues has the same base after armor step
    expect(Math.round(first.baseDamage)).toBe(Math.round(unitFirst));
    expect(Math.round(second.baseDamage)).toBe(Math.round(unitSecond));
  });

  test("battle mage: second attack logs alternate attack type when offhand is melee", () => {
    const attackerUnit = new Unit();
    attackerUnit.class = HeroClasses.BattleMage;
    attackerUnit.attackType = AttackType.Cast;
    attackerUnit.baseValues.increasedBaseDamage = 0;

    // Primary SpellFocus, secondary Melee
    attackerUnit.equipItem({
      level: 8,
      baseItem: "carved-wand",
      enchantment: null,
      type: InventoryItemType.SpellFocus,
      name: "Carved Wand",
      imbue: null,
    });
    attackerUnit.equipItem({
      level: 6,
      baseItem: "club",
      enchantment: null,
      type: InventoryItemType.MeleeWeapon,
      name: "Club",
      imbue: null,
    });

    const victimUnit = new Unit();

    const attacker = makeBaseCombatant(
      HeroClasses.BattleMage,
      AttackType.Cast,
      attackerUnit,
      "attacker",
    );
    attacker.equipment.weapons = [
      { level: 8, baseItem: "carved-wand", enchantment: null, type: InventoryItemType.SpellFocus },
      { level: 6, baseItem: "club", enchantment: null, type: InventoryItemType.MeleeWeapon },
    ];
    const victim = makeBaseCombatant(
      HeroClasses.Adventurer,
      AttackType.Melee,
      victimUnit,
      "victim",
    );

    const a1 = attackCombatant(attacker, victim, false, 0);
    const a2 = attackCombatant(attacker, victim, true, 0);

    expect(a1.combatLog[0].attackType).toBe(AttackType.Cast);
    // On second hit, attack type logged as Melee for BattleMage with melee offhand
    expect(a2.combatLog[0].attackType).toBe(AttackType.Melee);
    // And underlying damage types should follow
    expect(a1.combatLog[0].damageType).toBeDefined();
    expect(a2.combatLog[0].damageType).toBeDefined();
    expect(a1.combatLog[0].damageType).not.toBe(a2.combatLog[0].damageType);
  });

  test("ranged: ignores second attack; same base each swing", () => {
    const attackerUnit = new Unit();
    attackerUnit.class = HeroClasses.Archer;
    attackerUnit.attackType = AttackType.Ranged;
    attackerUnit.baseValues.increasedBaseDamage = 0;

    attackerUnit.equipItem({
      level: 10,
      baseItem: "longbow",
      enchantment: null,
      type: InventoryItemType.RangedWeapon,
      name: "Longbow",
      imbue: null,
    });

    const victimUnit = new Unit();
    victimUnit.baseValues.armor = 0;

    const attacker = makeBaseCombatant(
      HeroClasses.Archer,
      AttackType.Ranged,
      attackerUnit,
      "archer",
    );
    attacker.equipment.weapons = [
      { level: 10, baseItem: "longbow", enchantment: null, type: InventoryItemType.RangedWeapon },
    ];

    const victim = makeBaseCombatant(
      HeroClasses.Adventurer,
      AttackType.Melee,
      victimUnit,
      "victim",
    );

    const a1 = attackCombatant(attacker, victim, false, 0);
    const a2 = attackCombatant(attacker, victim, true, 0);
    expect(a1.combatLog[0].attackType).toBe(AttackType.Ranged);
    expect(a2.combatLog[0].attackType).toBe(AttackType.Ranged);

    // Damage should be identical with deterministic RNG
    const dmg1 = a1.combatLog.reduce((m, e) => m + e.damage, 0);
    const dmg2 = a2.combatLog.reduce((m, e) => m + e.damage, 0);
    expect(dmg1).toBe(dmg2);
  });
});
