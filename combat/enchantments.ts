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
import { Modifier } from "../calculations/modifiers/modifier";
import { ModifierDefinition } from "../calculations/modifiers/enchantments";
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

  attacker.unit.enterCombat(victim.unit);

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

  attacker = getArtifactBuffs(attacker);
  victim = getArtifactBuffs(victim);

  return { attacker, victim };
}
