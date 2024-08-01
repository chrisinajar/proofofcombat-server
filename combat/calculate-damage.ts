import {
  AttackType,
  InventoryItemType,
  HeroClasses,
  EnchantmentType,
  DamageType,
} from "types/graphql";

import { Combatant } from "./types";
import { attributesForAttack, getItemPassiveUpgradeTier } from "./helpers";
import { getEnchantedAttributes } from "./enchantments";

type DamageInstance = {
  damage: number;
  damageType: DamageType;
};

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
  let damageType = DamageType.Physical;

  switch (attackType) {
    case AttackType.Melee:
    case AttackType.Ranged:
      break;

    case AttackType.Cast:
    case AttackType.Smite:
    case AttackType.Blood:
      damageType = DamageType.Magical;
      break;
  }

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
    damageType,
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
  damages: DamageInstance[];
  overDamage: number;
  critical: boolean;
  doubleCritical: boolean;
} {
  const {
    baseDamage,
    variation,
    damageType,
    criticalChance,
    doubleCriticalChance,
    trippleCriticalChance,
    canOnlyTakeOneDamage,
    multiplier,
  } = calculateDamageValues(attackerInput, victimInput, isSecondAttack, debug);
  const damages: DamageInstance[] = [];

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput,
  );

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

  // unit can have stats of damageAsType where type is any of these
  // they'll be any value between 0 and 1, and they'll be used to convert damage to other types
  // since they're splitting up damage, we need to make sure all the multipliers add up to no more than 1
  // we also ignore damage conversion for the type of damage we're dealing
  const possibleDamageTypes = [
    DamageType.Magical,
    DamageType.Physical,
    DamageType.Fire,
    DamageType.Ice,
    DamageType.Lightning,
  ];

  const damageByType: { [x in DamageType]?: number } = {};

  let totalDamageConversion = 0;
  for (let type of possibleDamageTypes) {
    if (type === damageType) {
      continue;
    }
    totalDamageConversion += attacker.unit.stats[`damageAs${type}`];
  }
  for (let type of possibleDamageTypes) {
    if (type === damageType) {
      continue;
    }
    let conversion = attacker.unit.stats[`damageAs${type}`];
    if (conversion > 0) {
      if (totalDamageConversion > 1) {
        conversion /= totalDamageConversion;
      }
      const converted = damage * conversion;
      damage -= converted;
      damageByType[type] = converted;
    }
  }

  const resistance =
    1 - victim.unit.stats[`${damageType.toLowerCase()}Resistance`];
  damage *= resistance;

  let uncappedDamage = Math.round(Math.max(1, damage));

  // add basic damage to damages and subtract it from damage
  const standardDamage = Math.min(1000000000, uncappedDamage);
  uncappedDamage -= standardDamage;
  damageByType[damageType] = standardDamage;

  for (let type of possibleDamageTypes) {
    const resistance = 1 - victim.unit.stats[`${type.toLowerCase()}Resistance`];

    const damage = Math.round(
      Math.min(1000000000, (damageByType[type] ?? 0) * resistance),
    );
    if (damage) {
      damages.push({ damage, damageType: type });
    }
  }
  // damages.push({ damage: standardDamage, damageType });

  if (canOnlyTakeOneDamage) {
    for (let damage of damages) {
      damage.damage = 1;
    }
    uncappedDamage = 0;
  }

  return {
    overDamage: uncappedDamage,
    damages,
    critical,
    doubleCritical,
  };
}
