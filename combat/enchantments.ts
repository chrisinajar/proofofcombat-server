import { Combatant, EnchantedCombatant } from "./types";
import { createLuck } from "./helpers";

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

  attacker.attributes = {
    strength: attacker.unit.stats.strength,
    dexterity: attacker.unit.stats.dexterity,
    constitution: attacker.unit.stats.constitution,
    intelligence: attacker.unit.stats.intelligence,
    wisdom: attacker.unit.stats.wisdom,
    willpower: attacker.unit.stats.willpower,
    luck: attacker.unit.stats.luck,
  };

  victim.attributes = {
    strength: victim.unit.stats.strength,
    dexterity: victim.unit.stats.dexterity,
    constitution: victim.unit.stats.constitution,
    intelligence: victim.unit.stats.intelligence,
    wisdom: victim.unit.stats.wisdom,
    willpower: victim.unit.stats.willpower,
    luck: victim.unit.stats.luck,
  };

  return { attacker, victim };
}
