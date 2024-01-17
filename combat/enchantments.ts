import { EnchantmentType, HeroClasses, AttackType } from "types/graphql";

import { BaseItems } from "../schema/items/base-items";

import { Combatant, EnchantedCombatant, Attribute } from "./types";
import { createLuck, attributesForAttack } from "./helpers";
import {
  EnchantmentActivationOrder,
  EnchantmentCounterSpellOrder,
} from "./enchantment-order";
import { expandEnchantmentList } from "./enchantment-groups";
import { getArtifactBuffs } from "./artifacts";

import { createStatStealModifiers } from "../calculations/modifiers/stat-steal-modifier";
import { ParentModifier } from "../calculations/modifiers/parent-modifier";
import { Modifier } from "../calculations/modifiers/modifier";
import { ModifierDefinition } from "../calculations/modifiers/enchantments";
import { InventoryItem } from "../calculations/items/inventory-item";
import { Unit } from "../calculations/units/unit";

export function countCounterSpells(attacker: Combatant): number {
  // eventually other sources of counter spell maybe?
  return getAllGearEnchantments(attacker).filter(
    (ench) => ench === EnchantmentType.CounterSpell,
  ).length;
}

export function getCounteredGearEnchantments(
  attacker: Combatant,
  victim: Combatant,
): EnchantmentType[] {
  const attackerCounterSpells = countCounterSpells(attacker);
  const victimCounterSpells = countCounterSpells(victim);

  return getAllGearEnchantments(attacker, victimCounterSpells);
}

export function getAllGearEnchantments(
  attacker: Combatant,
  counterSpells: number = 0,
): EnchantmentType[] {
  let enchantments: EnchantmentType[] = [];

  attacker.equipment.quests.forEach((questItem) => {
    const baseItem = BaseItems[questItem.baseItem];

    if (baseItem && baseItem.passiveEnchantments) {
      enchantments = enchantments.concat(baseItem.passiveEnchantments);
    }
  });
  attacker.equipment.armor.forEach((armor) => {
    if (armor.enchantment) {
      enchantments.push(armor.enchantment);
    }
  });

  attacker.equipment.weapons.forEach((weapon) => {
    if (weapon.enchantment) {
      enchantments.push(weapon.enchantment);
    }
  });

  enchantments = expandEnchantmentList(enchantments);

  if (counterSpells > 0) {
    EnchantmentCounterSpellOrder.reverse();
    enchantments = enchantments.sort(
      (a, b) =>
        EnchantmentCounterSpellOrder.indexOf(b) -
        EnchantmentCounterSpellOrder.indexOf(a),
    );
    EnchantmentCounterSpellOrder.reverse();

    enchantments = enchantments.slice(counterSpells);
  }

  return enchantments.sort(
    (a, b) =>
      EnchantmentActivationOrder.indexOf(a) -
      EnchantmentActivationOrder.indexOf(b),
  );
}

type ModifierDefinitionList = ModifierDefinition<Modifier<any>, any>[];

function applyAttackModifiers(attackerUnit: Unit, victimUnit: Unit) {
  victimUnit.modifiers.forEach((modifier) => {
    if (modifier instanceof ParentModifier) {
      if (modifier.id === "applyAttackModifiers") {
        modifier.remove();
      }
    }
  });
  const modifierList = attackerUnit.equipment.reduce<ModifierDefinitionList>(
    (memo, item) => {
      if (item instanceof InventoryItem) {
        if (item.victimModifiers && item.victimModifiers.length) {
          return memo.concat(item.victimModifiers);
        }
      }
      return memo;
    },
    [] as ModifierDefinitionList,
  );

  victimUnit.applyModifier({
    type: ParentModifier,
    options: {
      modifiers: modifierList,
      id: "applyAttackModifiers",
    },
  });
}

function applyCounterSpells(attackerUnit: Unit, victimUnit: Unit) {
  const attackerCounters = attackerUnit.stats.counterSpell;
  const victimCounters = victimUnit.stats.counterSpell;
  // counter spells cancel each other out, so if they're equal (including both 0) we skip
  if (attackerCounters === victimCounters) {
    return;
  }

  const counterVictim =
    attackerCounters > victimCounters ? victimUnit : attackerUnit;
  const counterCount = Math.abs(attackerCounters - victimCounters);

  let result = counterVictim.modifiers.filter(
    (modifier) =>
      !modifier.isDebuff() &&
      modifier.enchantment &&
      modifier.enchantment !== EnchantmentType.CounterSpell,
  );

  // if everything is going to be countered then short circuit
  if (result.length <= counterCount) {
    result.forEach((modifier) => modifier.remove());
    return;
  }

  result
    .sort(
      (a, b) =>
        EnchantmentCounterSpellOrder.indexOf(b.enchantment as EnchantmentType) -
        EnchantmentCounterSpellOrder.indexOf(a.enchantment as EnchantmentType),
    )
    .slice(0, counterCount)
    .forEach((modifier) => modifier.remove());
}

export function getEnchantedAttributes(
  attackerInput: Combatant,
  victimInput: Combatant,
): { attacker: EnchantedCombatant; victim: EnchantedCombatant } {
  let attacker: EnchantedCombatant = {
    ...attackerInput,
    attributes: { ...attackerInput.attributes },
  } as EnchantedCombatant;
  let victim: EnchantedCombatant = {
    ...victimInput,
    attributes: { ...victimInput.attributes },
  } as EnchantedCombatant;

  createStatStealModifiers(attacker.unit, victim.unit);
  createStatStealModifiers(victim.unit, attacker.unit);

  applyAttackModifiers(attacker.unit, victim.unit);
  applyAttackModifiers(victim.unit, attacker.unit);

  applyCounterSpells(attacker.unit, victim.unit);

  const result = enchantCombatants(attacker, victim);
  attacker = result.attacker;
  victim = result.victim;

  attacker.luck = createLuck(attacker.attributes.luck);
  victim.luck = createLuck(victim.attributes.luck);

  return { attacker, victim };
}

export function enchantCombatants(
  attackerInput: Combatant,
  victimInput: Combatant,
): { attacker: EnchantedCombatant; victim: EnchantedCombatant } {
  let attacker = attackerInput as EnchantedCombatant;
  let victim = victimInput as EnchantedCombatant;

  const { attackType } = attacker;

  attacker.attributes = {
    strength: attacker.unit.stats.strength,
    dexterity: attacker.unit.stats.dexterity,
    constitution: attacker.unit.stats.constitution,
    intelligence: attacker.unit.stats.intelligence,
    wisdom: attacker.unit.stats.wisdom,
    willpower: attacker.unit.stats.willpower,
    luck: attacker.unit.stats.luck,
  };
  attacker.percentageDamageIncrease =
    attacker.unit.stats.percentageDamageIncrease;
  attacker.percentageDamageReduction =
    attacker.unit.stats.percentageDamageReduction;
  attacker.percentageEnchantmentDamageReduction =
    attacker.unit.stats.percentageEnchantmentDamageReduction;
  attacker.bonusDodge = attacker.unit.stats.bonusDodge;
  attacker.bonusAccuracy = attacker.unit.stats.bonusAccuracy;
  attacker.bonusWeaponTiers = attacker.unit.stats.bonusWeaponTiers;
  attacker.bonusArmorTiers = attacker.unit.stats.bonusArmorTiers;
  attacker.bonusShieldTiers = attacker.unit.stats.bonusShieldTiers;
  attacker.mesmerizeChance = attacker.unit.stats.mesmerizeChance;
  attacker.focusChance = attacker.unit.stats.focusChance;
  attacker.lifesteal = attacker.unit.stats.lifesteal;

  victim.attributes = {
    strength: victim.unit.stats.strength,
    dexterity: victim.unit.stats.dexterity,
    constitution: victim.unit.stats.constitution,
    intelligence: victim.unit.stats.intelligence,
    wisdom: victim.unit.stats.wisdom,
    willpower: victim.unit.stats.willpower,
    luck: victim.unit.stats.luck,
  };
  victim.percentageDamageIncrease = victim.unit.stats.percentageDamageIncrease;
  victim.percentageDamageReduction =
    victim.unit.stats.percentageDamageReduction;
  victim.percentageEnchantmentDamageReduction =
    victim.unit.stats.percentageEnchantmentDamageReduction;
  victim.bonusDodge = victim.unit.stats.bonusDodge;
  victim.bonusAccuracy = victim.unit.stats.bonusAccuracy;
  victim.bonusWeaponTiers = victim.unit.stats.bonusWeaponTiers;
  victim.bonusArmorTiers = victim.unit.stats.bonusArmorTiers;
  victim.bonusShieldTiers = victim.unit.stats.bonusShieldTiers;
  victim.mesmerizeChance = victim.unit.stats.mesmerizeChance;
  victim.focusChance = victim.unit.stats.focusChance;
  victim.lifesteal = victim.unit.stats.lifesteal;

  if (attacker.attackType === AttackType.Ranged) {
    attacker.bonusWeaponTiers += 1;
  }

  /// skillz
  // i don't know why i wrote it that why and im sorry

  // toHit: Attribute;
  // damage: Attribute;
  // dodge: Attribute;
  // damageReduction: Attribute;
  /*
    MELEE
    RANGED
    CAST
    SMITE
    BLOOD
  */

  /**** Everything up until this point is complete using modifiers alone *****/

  if (attacker.skills) {
    const attackAttributes = attributesForAttack(attacker.attackType);
    const victimAttributes = attributesForAttack(victim.attackType);

    attacker.attributes[victimAttributes.damageReduction] *= Math.pow(
      1.05,
      attacker.skills.resilience,
    );
  }

  attacker = getArtifactBuffs(attacker);
  victim = getArtifactBuffs(victim);

  return { attacker, victim };
}
