import { AttackType, EnchantmentType, HeroClasses } from "types/graphql";

import { Combatant, EnchantedCombatant } from "./types";
import { attributesForAttack } from "./helpers";
import { getEnchantedAttributes } from "./enchantments";

import { Unit } from "../calculations/units/unit";
import { Hero } from "../calculations/units/hero";

function isHero(maybeHero: Unit): maybeHero is Hero {
  if ("isHero" in maybeHero) {
    return (maybeHero as Hero).isHero();
  }
  return false;
}

export function getOneSidedData(
  attacker: EnchantedCombatant,
  victim: EnchantedCombatant,
): { damage: number; heal: number } {
  let attackerHeal = Math.round(
    attacker.unit.stats.enchantmentHeal * attacker.attributes.constitution,
  );
  let attackerLeech = Math.round(
    attacker.unit.stats.enchantmentLeech * attacker.attributes.constitution,
  );
  let victimDamage = Math.round(
    attacker.unit.stats.enchantmentDamage * attacker.attributes.constitution,
  );

  let enchantDamageResist = 1;
  const victimUnit = victim.unit;

  if (isHero(victimUnit)) {
    enchantDamageResist = victim.level;
  } else {
    enchantDamageResist = Math.sqrt(victim.level);
  }

  victimDamage /= Math.max(
    1,
    enchantDamageResist * victim.percentageEnchantmentDamageReduction,
  );
  attackerLeech /= Math.max(
    1,
    enchantDamageResist * victim.percentageEnchantmentDamageReduction,
  );
  attackerLeech = Math.min(1000000000, attackerLeech);

  attackerHeal += attackerLeech;
  victimDamage += attackerLeech;

  victimDamage = Math.min(1000000000, victimDamage);
  attackerHeal += attacker.maxHealth * attacker.unit.stats.healthRegeneration;

  if (victim.unit.stats.canOnlyTakeOneDamage > 0) {
    victimDamage = Math.min(1, victimDamage);
  }
  victimDamage = Math.round(victimDamage);
  attackerHeal = Math.round(attackerHeal);

  return { damage: victimDamage, heal: attackerHeal };
}

export function calculateEnchantmentDamage(
  attackerInput: Combatant,
  victimInput: Combatant,
): {
  attackerDamage: number;
  victimDamage: number;
  attackerHeal: number;
  victimHeal: number;
} {
  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput,
  );

  const { damage: victimDamage, heal: attackerHeal } = getOneSidedData(
    attacker,
    victim,
  );
  const { damage: attackerDamage, heal: victimHeal } = getOneSidedData(
    victim,
    attacker,
  );

  return {
    attackerDamage,
    victimDamage,
    attackerHeal,
    victimHeal,
  };
}
