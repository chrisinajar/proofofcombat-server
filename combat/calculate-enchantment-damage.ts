import { AttackType, EnchantmentType, HeroClasses } from "types/graphql";

import { Combatant } from "./types";
import { attributesForAttack } from "./helpers";
import { getEnchantedAttributes } from "./enchantments";

export function calculateEnchantmentDamage(
  attackerInput: Combatant,
  victimInput: Combatant,
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
    victimInput,
  );

  attackerHeal = Math.round(
    attacker.unit.stats.enchantmentHeal * attacker.attributes.constitution,
  );
  victimDamage = Math.round(
    attacker.unit.stats.enchantmentDamage * attacker.attributes.constitution,
  );
  attackerLeech = Math.round(
    attacker.unit.stats.enchantmentLeech * attacker.attributes.constitution,
  );

  victimHeal = Math.round(
    victim.unit.stats.enchantmentHeal * victim.attributes.constitution,
  );
  attackerDamage = Math.round(
    victim.unit.stats.enchantmentDamage * victim.attributes.constitution,
  );
  victimLeech = Math.round(
    victim.unit.stats.enchantmentLeech * victim.attributes.constitution,
  );

  victimDamage /= Math.max(
    1,
    victim.level * victim.percentageEnchantmentDamageReduction,
  );
  attackerLeech /= Math.max(
    1,
    victim.level * victim.percentageEnchantmentDamageReduction,
  );

  attackerDamage /= Math.max(
    1,
    attacker.level * attacker.percentageEnchantmentDamageReduction,
  );
  victimLeech /= Math.max(
    1,
    attacker.level * attacker.percentageEnchantmentDamageReduction,
  );

  attackerLeech = Math.min(1000000000, attackerLeech);
  victimLeech = Math.min(1000000000, victimLeech);

  attackerHeal += attackerLeech;
  victimDamage += attackerLeech;

  victimHeal += victimLeech;
  attackerDamage += victimLeech;

  attackerDamage = Math.min(1000000000, attackerDamage);
  victimDamage = Math.min(1000000000, victimDamage);

  const victimCanOnlyTakeOneDamage = victim.unit.stats.canOnlyTakeOneDamage > 0;
  const attackerCanOnlyTakeOneDamage =
    attacker.unit.stats.canOnlyTakeOneDamage > 0;

  attackerHeal += attacker.maxHealth * attacker.unit.stats.regeneration;
  victimHeal += victim.maxHealth * victim.unit.stats.regeneration;

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
