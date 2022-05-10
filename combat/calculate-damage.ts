import {
  AttackType,
  InventoryItemType,
  HeroClasses,
  EnchantmentType,
} from "types/graphql";

import { Combatant } from "./types";
import { attributesForAttack, getItemPassiveUpgradeTier } from "./helpers";
import { getEnchantedAttributes, getAllGearEnchantments } from "./enchantments";

export function calculateDamage(
  attackerInput: Combatant,
  victimInput: Combatant,
  isSecondAttack: boolean = false,
  debug: boolean = false
): { damage: number; critical: boolean; doubleCritical: boolean } {
  const { attackType } = attackerInput;
  let damage = 0;
  let critical = false;
  let doubleCritical = false;

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput
  );

  const attributeTypes = attributesForAttack(attackType);

  let percentageDamageReduction = victim.percentageDamageReduction;
  let percentageDamageIncrease = attacker.percentageDamageIncrease;
  let totalArmor = 0;
  let totalArmorDamageReduction = 1;
  let baseDamageDecrease = 1;
  let attackerDamageStat = attacker.attributes[attributeTypes.damage];
  let victimReductionStat = victim.attributes[attributeTypes.damageReduction];

  victim.equipment.armor.forEach((armor) => {
    if (armor.type === InventoryItemType.Shield) {
      totalArmorDamageReduction *= Math.pow(
        0.98,
        armor.level + victim.bonusShieldTiers + victim.bonusArmorTiers
      );
    } else {
      totalArmorDamageReduction *= Math.pow(
        0.99,
        armor.level + victim.bonusArmorTiers
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
        armor.level + victim.bonusShieldTiers + victim.bonusArmorTiers
      );
      totalArmor += Math.pow(
        1.3,
        armor.level + victim.bonusShieldTiers + victim.bonusArmorTiers
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

  if (victim.skills) {
    baseDamageDecrease *= Math.pow(0.99, victim.skills.resilience);
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
      baseDamageDecrease
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

  if (attackType !== AttackType.Blood) {
    // crits
    critical = Math.random() < attacker.luck.largeModifier;
    if (critical) {
      damage = damage * 3;
      doubleCritical = Math.random() < attacker.luck.ultraModifier;
      if (doubleCritical) {
        damage = damage * 3;
      }

      if (
        attacker.class === HeroClasses.Gambler ||
        attacker.class === HeroClasses.Daredevil
      ) {
        const trippleCritical = Math.random() < attacker.luck.ultraModifier / 2;
        if (trippleCritical) {
          damage = damage * 3;
        }
      }
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

  // apply contested stats rolls
  damage *= attackerDamageStat / (victimReductionStat / 2);

  // amp damage from weapon
  damage *= percentageDamageIncrease;
  // reduce / increase armor from enchantments
  // const drFromArmor = Math.pow(0.95, totalArmor);
  // damage *= drFromArmor;
  damage *= totalArmorDamageReduction;

  if (debug) {
    console.log("final damage", damage);
  }

  damage = Math.round(Math.max(1, Math.min(1000000000, damage)));

  const canOnlyTakeOneDamage = getAllGearEnchantments(victim).find(
    (ench) => ench === EnchantmentType.CanOnlyTakeOneDamage
  );
  if (canOnlyTakeOneDamage) {
    damage = 1;
  }

  return {
    damage,
    critical,
    doubleCritical,
  };
}
