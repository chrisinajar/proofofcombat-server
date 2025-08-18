import {
  AttackType,
  InventoryItemType,
  HeroClasses,
  EnchantmentType,
  DamageType,
  HeroStance,
} from "types/graphql";

import { Combatant } from "./types";
import { attributesForAttack, getItemPassiveUpgradeTier } from "./helpers";
import { getEnchantedAttributes } from "./enchantments";

import { Hero } from "../calculations/units/hero";
import { Unit } from "../calculations/units/unit";

type DamageInstance = {
  damage: number;
  damageType: DamageType;
};

function isHeroUnit(unit: Unit): unit is Hero {
  return "hero" in unit;
}

export function calculateDamageValues(
  attackerInput: Combatant,
  victimInput: Combatant,
  isSecondAttack: boolean = false,
  debug: boolean = false,
) {
  const { attackType } = attackerInput;
  let damage = 0;

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
    case AttackType.Blood:
      damageType = DamageType.Magical;
      break;

    case AttackType.Smite:
      // default holy
      damageType = DamageType.Holy;
      // override with stance
      const unit = attacker.unit;
      if (isHeroUnit(unit)) {
        if (unit.hero.activeStance === HeroStance.Blight) {
          damageType = DamageType.Blight;
        }
      }
      break;
  }

  let { percentageArmorReduction, armor } = victim.unit.stats;
  const attackerAmplification = attacker.unit.stats.percentageDamageIncrease;
  const victimDamageReduction = victim.unit.stats.percentageDamageReduction;
  let baseDamageDecrease = 1;
  const attackerDamageStat = attacker.attributes[attributeTypes.damage];
  let victimReductionStat = victim.attributes[attributeTypes.damageReduction];

  armor *= percentageArmorReduction;

  let baseDamage = attacker.unit.getBaseDamage(isSecondAttack);

  if (armor + 1 >= baseDamage) {
    baseDamage = 1 + baseDamage / armor;
  } else {
    baseDamage = baseDamage - armor;
  }

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

  const canOnlyTakeOneDamage = victim.unit.stats.canOnlyTakeOneDamage > 0;

  let multiplier = attackerAmplification * victimDamageReduction;

  // up to 40% of damage as variation, larger luck = less variation
  const variation =
    baseDamage * 0.2 * (1 - attacker.luck.smallModifier) +
    baseDamage * 0.1 * (1 - attacker.luck.largeModifier) +
    baseDamage * 0.1 * (1 - attacker.luck.ultraModifier);
  // it's used like this in damage calculations:
  // let damage = baseDamage - variation * Math.random();

  if (debug) {
    console.log({ multiplier, baseDamage });
  }

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
  if (debug) {
    console.log({ isSecondAttack });
  }
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

  let damage = Math.max(1, baseDamage - variation * Math.random());

  let critical = false;
  let doubleCritical = false;
  let trippleCritical = false;

  if (Math.random() < criticalChance) {
    critical = true;
    damage = damage * 2;
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
    DamageType.Holy,
    DamageType.Blight,
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
      damageByType[type] = converted;
    }
  }

  let overDamage = 0;
  // Reduce the original damage by the total conversion amount
  damage *= Math.max(0, 1 - totalDamageConversion);

  // if we dealt damage and didn't convert it all
  if (damage > 0) {
    // apply resistances
    const maxResistance = victim.unit.stats[`max${damageType}Resistance`];
    const resistance =
      1 - victim.unit.stats[`${damageType.toLowerCase()}Resistance`];

    damage *= Math.min(resistance, maxResistance);
    damage = Math.max(1, damage);

    let uncappedDamage = Math.round(damage);

    // add basic damage to damages and subtract it from damage
    const standardDamage = Math.min(1000000000, uncappedDamage);
    uncappedDamage -= standardDamage;
    damageByType[damageType] = Math.max(1, standardDamage);
    damages.push({ damage: Math.max(1, standardDamage), damageType });

    if (uncappedDamage > 0) {
      overDamage += uncappedDamage;
    }
  }

  for (let type of possibleDamageTypes) {
    if (type === damageType) {
      continue;
    }

    // Use the correct cap for the converted type, not the original damage type
    const maxResistance = victim.unit.stats[`max${type}Resistance`];
    const resistance = 1 - victim.unit.stats[`${type.toLowerCase()}Resistance`];

    const damage = Math.round(
      Math.min(
        1000000000,
        (damageByType[type] ?? 0) * Math.min(resistance, maxResistance),
      ),
    );
    if (damage > 0) {
      damages.push({ damage: Math.max(1, damage), damageType: type });
    }
  }

  if (canOnlyTakeOneDamage) {
    for (let damage of damages) {
      damage.damage = 1;
    }
    overDamage = 0;
  }

  return {
    overDamage,
    damages,
    critical,
    doubleCritical,
  };
}
