import {
  AttackType,
  Hero,
  AttributeType,
  HeroStats,
  EnchantmentType,
  HeroClasses,
  EquipmentSlots,
  InventoryItemType,
  MonsterEquipment,
} from "types/graphql";

import Databases from "../db";
import { getEnchantedAttributes } from "./enchantments";

import { createHeroCombatant, createMonsterCombatant } from "./";
import { GenericStatsModifier } from "../calculations/modifiers/generic-stats-modifier";

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
  hero.attributes = { ...hero.attributes };

  return hero;
}

function generateMonster(level: number, equipment?: MonsterEquipment | null) {
  return createMonsterCombatant(
    {
      level,
      name: `Level ${level} Mob`,
      attackType: AttackType.Melee,
      combat: {
        health: Math.round(Math.pow(1.4, level) * 8),
        maxHealth: Math.round(Math.pow(1.4, level) * 8),
      },
    },
    equipment,
  );
}

describe("getEnchantedAttributes", () => {
  it("returns the right numbers", () => {
    const heroCombatant = createHeroCombatant(generateHero(), AttackType.Melee);
    const monster = generateMonster(5);

    const { attacker, victim } = getEnchantedAttributes(heroCombatant, monster);

    expect(heroCombatant.attributes).toEqual(attacker.attributes);
    expect(monster.attributes).toEqual(victim.attributes);
  });

  it("applies debuffs symmetrically", () => {
    const hero = generateHero();
    // @ts-ignore
    hero.equipment.leftHand = {
      id: "asdf",
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.MinusEnemyDexterity,
    };
    const monster = generateMonster(5);
    const preReduction = monster.attributes.dexterity;

    let victim = getEnchantedAttributes(
      monster,
      createHeroCombatant(hero, AttackType.Melee),
    ).attacker;

    expect(preReduction).toBeGreaterThan(victim.attributes.dexterity);

    victim = getEnchantedAttributes(
      createHeroCombatant(hero, AttackType.Melee),
      monster,
    ).victim;

    expect(preReduction).toBeGreaterThan(victim.attributes.dexterity);

    const onceReducedValue = victim.attributes.dexterity;

    // @ts-ignore
    hero.equipment.rightHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.MinusEnemyDexterity,
    };

    victim = getEnchantedAttributes(
      createHeroCombatant(hero, AttackType.Melee),
      monster,
    ).victim;

    expect(onceReducedValue).toBeGreaterThan(victim.attributes.dexterity);

    victim = getEnchantedAttributes(
      monster,
      createHeroCombatant(hero, AttackType.Melee),
    ).attacker;

    expect(onceReducedValue).toBeGreaterThan(victim.attributes.dexterity);
  });

  it("sets isDebuff correctly on debuff modifiers", () => {
    const hero = generateHero();
    hero.equipment.leftHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.MinusEnemyDexterity,
    };
    const monster = generateMonster(5);
    const preReduction = monster.attributes.dexterity;

    let { attacker, victim } = getEnchantedAttributes(
      createHeroCombatant(hero, AttackType.Melee),
      monster,
    );
    const debuff = victim.unit.modifiers.filter((modifier) => {
      if (!modifier.isDebuff()) {
        return false;
      }
      return modifier instanceof GenericStatsModifier;
    });

    expect(debuff.length).toBe(1);
  });
  it("only applies buffs when an item is equipped", () => {
    const hero = generateHero();
    let enchantResult = {};

    const monsterEquipment = {
      bodyArmor: { level: 1 },
      handArmor: { level: 1 },
      legArmor: { level: 1 },
      headArmor: { level: 1 },
      footArmor: { level: 1 },
      leftHand: { level: 1 },
      rightHand: { level: 1 },
    };

    enchantResult = getEnchantedAttributes(
      createHeroCombatant(hero, AttackType.Melee),
      generateMonster(5, monsterEquipment),
    );

    expect(
      enchantResult.attacker.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).not.toBeTruthy();
    expect(
      enchantResult.victim.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).not.toBeTruthy();

    hero.equipment.leftHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.BonusDexterity,
    };
    monsterEquipment.leftHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.BonusDexterity,
    };
    enchantResult = getEnchantedAttributes(
      createHeroCombatant(hero, AttackType.Melee),
      generateMonster(5, monsterEquipment),
    );

    expect(
      enchantResult.attacker.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).toBeTruthy();
    expect(
      enchantResult.victim.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).toBeTruthy();
  });

  it("applies counter spells", () => {
    const hero = generateHero();
    let enchantResult = {};

    const monsterEquipment = {
      bodyArmor: { level: 1 },
      handArmor: { level: 1 },
      legArmor: { level: 1 },
      headArmor: { level: 1 },
      footArmor: { level: 1 },
      leftHand: { level: 1 },
      rightHand: { level: 1 },
    };

    hero.equipment.leftHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.BonusDexterity,
    };
    monsterEquipment.leftHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.BonusDexterity,
    };

    enchantResult = getEnchantedAttributes(
      createHeroCombatant(hero, AttackType.Melee),
      generateMonster(5, monsterEquipment),
    );

    expect(
      enchantResult.attacker.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).toBeTruthy();
    expect(
      enchantResult.victim.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).toBeTruthy();

    hero.equipment.rightHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.CounterSpell,
    };

    enchantResult = getEnchantedAttributes(
      createHeroCombatant(hero, AttackType.Melee),
      generateMonster(5, monsterEquipment),
    );

    expect(
      enchantResult.attacker.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).toBeTruthy();
    expect(
      enchantResult.victim.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).not.toBeTruthy();

    hero.equipment.bodyArmor = {
      level: 1,
      type: InventoryItemType.BodyArmor,
      enchantment: EnchantmentType.CounterSpell,
    };

    enchantResult = getEnchantedAttributes(
      createHeroCombatant(hero, AttackType.Melee),
      generateMonster(5, monsterEquipment),
    );

    expect(
      enchantResult.attacker.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).toBeTruthy();
    expect(
      enchantResult.victim.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).not.toBeTruthy();

    hero.equipment.bodyArmor = {
      level: 1,
    };
    monsterEquipment.rightHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.DoubleAllStats,
    };
    monsterEquipment.bodyArmor = {
      level: 1,
      type: InventoryItemType.BodyArmor,
      enchantment: EnchantmentType.DoubleAllStats,
    };

    enchantResult = getEnchantedAttributes(
      createHeroCombatant(hero, AttackType.Melee),
      generateMonster(5, monsterEquipment),
    );

    expect(
      enchantResult.attacker.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).toBeTruthy();
    expect(
      enchantResult.victim.unit.modifiers.find(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.BonusDexterity,
      ),
    ).not.toBeTruthy();
    expect(
      enchantResult.victim.unit.modifiers.filter(
        (modifier) =>
          !modifier.isDisabled() &&
          modifier.enchantment === EnchantmentType.DoubleAllStats,
      ).length,
    ).toBe(1);
  });
});
