import {
  AttackType,
  Hero,
  AttributeType,
  HeroStats,
  EnchantmentType,
  HeroClasses,
  EquipmentSlots,
  InventoryItemType,
} from "types/graphql";

import Databases from "../db";
import { getEnchantedAttributes } from "./enchantments";

import { createHeroCombatant, createMonsterCombatant } from "./";

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

function generateMonster(level: number) {
  return createMonsterCombatant({
    level,
    name: `Level ${level} Mob`,
    attackType: AttackType.Melee,
    combat: {
      health: Math.round(Math.pow(1.4, level) * 8),
      maxHealth: Math.round(Math.pow(1.4, level) * 8),
    },
  });
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

    expect(preReduction).toBeGreaterThan(victim.attributes.dexterity);
    const onceReducedValue = victim.attributes.dexterity;

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
  });
});
