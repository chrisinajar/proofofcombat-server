import {
  AttackType,
  InventoryItemType,
  HeroClasses,
  EnchantmentType,
} from "types/graphql";

import { Combatant } from "./types";
import { attributesForAttack, getItemPassiveUpgradeTier } from "./helpers";
import { getEnchantedAttributes } from "./enchantments";

export function calculateDamageValues(
  attackerInput: Combatant,
  victimInput: Combatant,
  isSecondAttack: boolean = false,
  debug: boolean = false,
) {
  const { attackType } = attackerInput;
  let damage = 0;
  let critical = false;
  let doubleCritical = false;

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput,
  );

  const attributeTypes = attributesForAttack(attackType);

  let percentageDamageReduction = victim.percentageDamageReduction;
  let percentageDamageIncrease = attacker.percentageDamageIncrease;
  let totalArmor = 0;
  let totalArmorDamageReduction = 1;
  let baseDamageDecrease = 1;
  const attackerDamageStat = attacker.attributes[attributeTypes.damage];
  let victimReductionStat = victim.attributes[attributeTypes.damageReduction];

  victim.equipment.armor.forEach((armor) => {
    if (armor.type === InventoryItemType.Shield) {
      totalArmorDamageReduction *= Math.pow(
        0.98,
        armor.level + victim.bonusShieldTiers + victim.bonusArmorTiers,
      );
    } else {
      totalArmorDamageReduction *= Math.pow(
        0.99,
        armor.level + victim.bonusArmorTiers,
      );
    }
    totalArmor += Math.pow(1.3, armor.level + victim.bonusArmorTiers);

    if (getItemPassiveUpgradeTier(armor) > 0) {
      baseDamageDecrease *= 0.8;
      victimReductionStat *= 1.5;
    }
    // totalArmor += (armor.level + victim.bonusArmorTiers);
  });

  // for paladins (or any other future reason that shields end up in weapon lists)
  victim.equipment.weapons.forEach((armor) => {
    if (armor.type === InventoryItemType.Shield) {
      totalArmorDamageReduction *= Math.pow(
        0.98,
        armor.level + victim.bonusShieldTiers + victim.bonusArmorTiers,
      );
      totalArmor += Math.pow(
        1.3,
        armor.level + victim.bonusShieldTiers + victim.bonusArmorTiers,
      );

      if (getItemPassiveUpgradeTier(armor) > 0) {
        baseDamageDecrease *= 0.75;
        victimReductionStat *= 2;
      }
    }
  });
  totalArmor *= percentageDamageReduction;

  // vampires reduce enemy base damage by 1/2
  if (victim.class === HeroClasses.Vampire) {
    baseDamageDecrease *= 0.5;
  }

  const weapon =
    isSecondAttack && attacker.attackType !== AttackType.Ranged
      ? attacker.equipment.weapons[1]
      : attacker.equipment.weapons[0];
  let weaponLevel = weapon?.level ?? 0;

  if (weapon) {
    // for now, each upper tier counts as 2 tiers
    weaponLevel += getItemPassiveUpgradeTier(weapon);
    weaponLevel += attacker.bonusWeaponTiers;

    if (weapon.type === InventoryItemType.Shield) {
      weaponLevel += attacker.bonusShieldTiers;
    }
  }

  const baseDamage = Math.max(
    1,
    (Math.pow(1.4, weaponLevel) + weaponLevel * 15 - totalArmor) *
      baseDamageDecrease,
  );
  // const baseDamage = Math.pow(1.4, weaponLevel) + weaponLevel * 15;

  if (debug) {
    console.log({
      weaponDamage: Math.pow(1.4, weaponLevel) + weaponLevel * 15,
      name: attacker.name,
      baseDamage,
      totalArmor,
      weaponLevel,
      totalArmorDamageReduction,
      percentageDamageIncrease,
    });
  }

  const variation = baseDamage * 0.4 * attacker.luck.smallModifier;
  // damage spread based on small luck factor
  damage = baseDamage - variation * Math.random();

  let criticalChance = 0;
  let doubleCriticalChance = 0;
  let trippleCriticalChance = 0;

  if (attackType !== AttackType.Blood) {
    // crits
    criticalChance = attacker.luck.largeModifier;
    doubleCriticalChance = attacker.luck.ultraModifier;

    if (
      attacker.class === HeroClasses.Gambler ||
      attacker.class === HeroClasses.Daredevil
    ) {
      trippleCriticalChance = attacker.luck.ultraModifier / 2;
    }
  }

  if (debug) {
    console.log({
      damage,
      attackerStat: attackerDamageStat,
      victimStat: victimReductionStat,
      dr: attackerDamageStat / (victimReductionStat / 2),
      percentageDamageIncrease,
      totalArmorDamageReduction,
    });
  }

  const canOnlyTakeOneDamage = victim.unit.stats.canOnlyTakeOneDamage > 0;

  let multiplier = 1;

  // apply contested stats rolls
  multiplier *= attackerDamageStat / (victimReductionStat / 2);

  // amp damage from weapon
  multiplier *= percentageDamageIncrease;
  // reduce / increase armor from enchantments
  // const drFromArmor = Math.pow(0.95, totalArmor);
  // multiplier *= drFromArmor;
  multiplier *= totalArmorDamageReduction;

  return {
    baseDamage,
    variation,
    criticalChance,
    doubleCriticalChance,
    trippleCriticalChance,
    canOnlyTakeOneDamage,
    multiplier,
  };
}

export function calculateDamage(
  attackerInput: Combatant,
  victimInput: Combatant,
  isSecondAttack: boolean = false,
  debug: boolean = false,
): {
  damage: number;
  overDamage: number;
  critical: boolean;
  doubleCritical: boolean;
} {
  const {
    baseDamage,
    variation,
    criticalChance,
    doubleCriticalChance,
    trippleCriticalChance,
    canOnlyTakeOneDamage,
    multiplier,
  } = calculateDamageValues(attackerInput, victimInput, isSecondAttack, debug);
  let damage = baseDamage - variation * Math.random();

  let critical = false;
  let doubleCritical = false;
  let trippleCritical = false;

  if (Math.random() < criticalChance) {
    critical = true;
    damage = damage * 3;
    if (Math.random() < doubleCriticalChance) {
      doubleCritical = true;
      damage = damage * 3;
      if (Math.random() < trippleCriticalChance) {
        trippleCritical = true;
        damage = damage * 3;
      }
    }
  }

  if (debug) {
    console.log("final damage", damage);
  }
  damage *= multiplier;
  const uncappedDamage = Math.round(Math.max(1, damage));
  damage = Math.min(1000000000, uncappedDamage);

  if (canOnlyTakeOneDamage) {
    damage = 1;
  }

  return {
    overDamage: uncappedDamage - damage,
    damage,
    critical,
    doubleCritical,
  };
}
