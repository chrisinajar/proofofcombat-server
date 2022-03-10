import { AttackType, HeroClasses, InventoryItemType } from "types/graphql";
import { Combatant } from "./types";
import { attributesForAttack, getItemPassiveUpgradeTier } from "./helpers";
import { getEnchantedAttributes } from "./enchantments";

export function calculateHit(
  attackerInput: Combatant,
  victimInput: Combatant,
  isSecondAttack: boolean
): boolean {
  const { attackType } = attackerInput;
  const attackAttributes = attributesForAttack(attackType);

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput
  );

  let attackerAccStat = attacker.attributes[attackAttributes.toHit];
  let victimDodgeStat = victim.attributes[attackAttributes.dodge];

  if (
    attacker.class === HeroClasses.DemonHunter ||
    attacker.class === HeroClasses.BattleMage
  ) {
    let otherAccStat = 0;
    if (attackType === AttackType.Melee) {
      const otherAttackAttributes = attributesForAttack(AttackType.Cast);
      otherAccStat = attacker.attributes[attackAttributes.toHit];
    } else if (attackType === AttackType.Cast) {
      const otherAttackAttributes = attributesForAttack(AttackType.Melee);
      otherAccStat = attacker.attributes[attackAttributes.toHit];
    }
    attackerAccStat += 0.5 * otherAccStat;
  }

  if (
    attacker.class === HeroClasses.Gambler ||
    attacker.class === HeroClasses.Daredevil
  ) {
    attackerAccStat += Math.random() * attacker.attributes.luck;
  }
  if (
    victim.class === HeroClasses.Gambler ||
    victim.class === HeroClasses.Daredevil
  ) {
    victimDodgeStat += Math.random() * victim.attributes.luck;
  }

  victimDodgeStat *= victim.bonusDodge;
  attackerAccStat *= attacker.bonusAccuracy;

  victim.equipment.armor.forEach((armor) => {
    // if (armor.type === InventoryItemType.Shield) {
    // } else {
    // }
    if (getItemPassiveUpgradeTier(armor) > 1) {
      victimDodgeStat *= 2;
    } else if (getItemPassiveUpgradeTier(armor) > 0) {
      victimDodgeStat *= 1.5;
    }
  });

  // for paladins (or any other future reason that shields end up in weapon lists)
  victim.equipment.weapons.forEach((armor) => {
    if (
      armor.type === InventoryItemType.Shield &&
      getItemPassiveUpgradeTier(armor) > 1
    ) {
      victimDodgeStat *= 2;
    } else if (
      armor.type === InventoryItemType.Shield &&
      getItemPassiveUpgradeTier(armor) > 0
    ) {
      victimDodgeStat *= 1.5;
    }
  });

  const weapon = isSecondAttack
    ? attacker.equipment.weapons[1]
    : attacker.equipment.weapons[0];

  const weaponLevel = weapon?.level ?? 0;

  if (weapon) {
    if (getItemPassiveUpgradeTier(weapon) > 1) {
      attackerAccStat *= 4;
    } else if (getItemPassiveUpgradeTier(weapon) > 0) {
      attackerAccStat *= 2;
    }
  }

  // rarely massive, 1 when even, 0.5 when dodge is double, etc
  // "how many times bigger is attack than dodge"
  const baseChange = attackerAccStat / victimDodgeStat;
  const oddBase = baseChange / (baseChange + 1);
  // console.log({ baseChange, oddBase, attackerAccStat, victimDodgeStat });

  return Math.random() < oddBase;
}
