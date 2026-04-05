import { Combatant } from "./types";
import { getEnchantedAttributes } from "./enchantments";
import { calculateHitChance } from "../maths";

export function calculateOdds(
  attackerInput: Combatant,
  victimInput: Combatant,
): number {
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
): boolean {
  return Math.random() < calculateOdds(attackerInput, victimInput);
}
