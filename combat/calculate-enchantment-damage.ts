import { AttackType, EnchantmentType, HeroClasses } from "types/graphql";

import { Combatant } from "./types";
import { attributesForAttack } from "./helpers";
import {
  getAllGearEnchantments,
  getEnchantedAttributes,
  getCounteredGearEnchantments,
} from "./enchantments";

export function calculateEnchantmentDamage(
  attackerInput: Combatant,
  victimInput: Combatant
): {
  attackerDamage: number;
  victimDamage: number;
  attackerHeal: number;
  victimHeal: number;
} {
  const { attackType } = attackerInput;
  const attackAttributes = attributesForAttack(attackType);
  let attackerDamage = 0;
  let victimDamage = 0;
  let attackerHeal = 0;
  let victimHeal = 0;

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput
  );

  // blood attacks deal additional enchantment damage!
  if (attackType === AttackType.Blood) {
    attacker.attributes.constitution *= 1.2;
  }

  const attackerEnchantments = getCounteredGearEnchantments(attacker, victim);

  attackerEnchantments.forEach((enchantment) => {
    switch (enchantment) {
      case EnchantmentType.LifeHeal:
        attackerHeal += Math.round(attacker.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeDamage:
        victimDamage += Math.round(attacker.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeSteal:
        attackerHeal += Math.round(attacker.attributes.constitution * 0.1);
        victimDamage += Math.round(attacker.attributes.constitution * 0.1);
        break;

      case EnchantmentType.Vampirism:
        attackerHeal += Math.round(attacker.attributes.constitution * 0.2);
        victimDamage += Math.round(attacker.attributes.constitution * 0.2);
        break;
    }
  });

  const victimEnchantments = getCounteredGearEnchantments(victim, attacker);

  victimEnchantments.forEach((enchantment) => {
    switch (enchantment) {
      case EnchantmentType.LifeHeal:
        victimHeal += Math.round(victim.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeDamage:
        attackerDamage += Math.round(victim.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeSteal:
        victimHeal += Math.round(victim.attributes.constitution * 0.1);
        attackerDamage += Math.round(victim.attributes.constitution * 0.1);
        break;

      case EnchantmentType.Vampirism:
        victimHeal += Math.round(victim.attributes.constitution * 0.2);
        attackerDamage += Math.round(victim.attributes.constitution * 0.2);
        break;
    }
  });

  victimDamage /= Math.max(
    1,
    victim.level * victim.percentageEnchantmentDamageReduction
  );
  attackerHeal /= Math.max(
    1,
    victim.level * victim.percentageEnchantmentDamageReduction
  );

  attackerDamage /= Math.max(
    1,
    attacker.level * attacker.percentageEnchantmentDamageReduction
  );
  victimHeal /= Math.max(
    1,
    attacker.level * attacker.percentageEnchantmentDamageReduction
  );

  const victimCanOnlyTakeOneDamage = getAllGearEnchantments(victim).find(
    (ench) => ench === EnchantmentType.CanOnlyTakeOneDamage
  );
  const attackerCanOnlyTakeOneDamage = getAllGearEnchantments(attacker).find(
    (ench) => ench === EnchantmentType.CanOnlyTakeOneDamage
  );

  if (victimCanOnlyTakeOneDamage) {
    victimDamage = Math.min(1, victimDamage);
  }
  if (attackerCanOnlyTakeOneDamage) {
    attackerDamage = Math.min(1, attackerDamage);
  }

  attackerDamage = Math.round(attackerDamage);
  victimDamage = Math.round(victimDamage);
  attackerHeal = Math.round(attackerHeal);
  victimHeal = Math.round(victimHeal);

  return {
    attackerDamage,
    victimDamage,
    attackerHeal,
    victimHeal,
  };
}
