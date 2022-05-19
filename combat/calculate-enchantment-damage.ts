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
  let attackerDamage = 0;
  let victimDamage = 0;
  let attackerHeal = 0;
  let victimHeal = 0;
  let attackerLeech = 0;
  let victimLeech = 0;

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput
  );

  // blood attacks deal additional enchantment damage!
  if (attacker.attackType === AttackType.Blood) {
    victim.percentageEnchantmentDamageReduction *= 0.75;
  }
  // blood attacks deal additional enchantment damage!
  if (victim.attackType === AttackType.Blood) {
    attacker.percentageEnchantmentDamageReduction *= 0.75;
  }

  const attackerEnchantments = getCounteredGearEnchantments(attacker, victim);

  function reduceEnchantment(
    total: { damage: number; heal: number; leech: number },
    enchantment: EnchantmentType
  ) {
    switch (enchantment) {
      case EnchantmentType.LifeHeal:
        total.heal += Math.round(attacker.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeDamage:
        total.damage += Math.round(attacker.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeSteal:
        total.leech += Math.round(attacker.attributes.constitution * 0.1);
        break;

      case EnchantmentType.Vampirism:
        total.leech += Math.round(attacker.attributes.constitution * 0.2);
        break;

      case EnchantmentType.TwentyLifeSteal:
        total.leech += Math.round(attacker.attributes.constitution * 0.2);
        break;
      case EnchantmentType.ThirtyLifeSteal:
        total.leech += Math.round(attacker.attributes.constitution * 0.3);
        break;

      case EnchantmentType.SuperVampStats:
        total.leech += Math.round(attacker.attributes.constitution * 0.4);
        break;
    }
    return total;
  }

  const attackEnchantmentResults = attackerEnchantments.reduce<{
    damage: number;
    heal: number;
    leech: number;
  }>(reduceEnchantment, { damage: 0, heal: 0, leech: 0 });

  attackerHeal = attackEnchantmentResults.heal;
  victimDamage = attackEnchantmentResults.damage;
  attackerLeech = attackEnchantmentResults.leech;

  const victimEnchantments = getCounteredGearEnchantments(victim, attacker);

  const victimEnchantmentResults = victimEnchantments.reduce<{
    damage: number;
    heal: number;
    leech: number;
  }>(reduceEnchantment, { damage: 0, heal: 0, leech: 0 });

  victimHeal = victimEnchantmentResults.heal;
  attackerDamage = victimEnchantmentResults.damage;
  victimLeech = victimEnchantmentResults.leech;

  victimDamage /= Math.max(
    1,
    victim.level * victim.percentageEnchantmentDamageReduction
  );
  attackerLeech /= Math.max(
    1,
    victim.level * victim.percentageEnchantmentDamageReduction
  );

  attackerDamage /= Math.max(
    1,
    attacker.level * attacker.percentageEnchantmentDamageReduction
  );
  victimLeech /= Math.max(
    1,
    attacker.level * attacker.percentageEnchantmentDamageReduction
  );

  attackerLeech = Math.min(1000000000, attackerLeech);
  victimLeech = Math.min(1000000000, victimLeech);

  attackerHeal += attackerLeech;
  victimDamage += attackerLeech;

  victimHeal += victimLeech;
  attackerDamage += victimLeech;

  attackerDamage = Math.min(1000000000, attackerDamage);
  victimDamage = Math.min(1000000000, victimDamage);

  const victimCanOnlyTakeOneDamage = getAllGearEnchantments(victim).find(
    (ench) => ench === EnchantmentType.CanOnlyTakeOneDamage
  );
  const attackerCanOnlyTakeOneDamage = getAllGearEnchantments(attacker).find(
    (ench) => ench === EnchantmentType.CanOnlyTakeOneDamage
  );

  if (attacker.skills) {
    attackerHeal +=
      attacker.maxHealth * (1 - Math.pow(0.99, attacker.skills.regeneration));
  }
  if (victim.skills) {
    victimHeal +=
      victim.maxHealth * (1 - Math.pow(0.99, victim.skills.regeneration));
  }

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
