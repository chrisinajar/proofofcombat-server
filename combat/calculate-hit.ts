import { AttackType, HeroClasses, InventoryItemType } from "types/graphql";
import { Combatant } from "./types";
import { attributesForAttack, getItemPassiveUpgradeTier } from "./helpers";
import { getEnchantedAttributes } from "./enchantments";
import { calculateHitChance } from "../maths";

export function calculateOdds(
  attackerInput: Combatant,
  victimInput: Combatant,
  isSecondAttack: boolean,
): number {
  const { attackType } = attackerInput;

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput,
  );

  return calculateHitChance(
    attacker.unit.stats.attackRating,
    victim.unit.stats.evasionRating,
  );
}

export function calculateHit(
  attackerInput: Combatant,
  victimInput: Combatant,
  isSecondAttack: boolean,
): boolean {
  return (
    Math.random() < calculateOdds(attackerInput, victimInput, isSecondAttack)
  );
}
