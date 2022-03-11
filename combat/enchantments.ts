import { EnchantmentType, HeroClasses, AttackType } from "types/graphql";

import { BaseItems } from "../schema/items/base-items";

import { Combatant, EnchantedCombatant, Attribute } from "./types";
import { createLuck } from "./helpers";
import {
  EnchantmentActivationOrder,
  EnchantmentCounterSpellOrder,
} from "./enchantment-order";

export function countCounterSpells(attacker: Combatant): number {
  // eventually other sources of counter spell maybe?
  return getAllGearEnchantments(attacker).filter(
    (ench) => ench === EnchantmentType.CounterSpell
  ).length;
}
export function getCounteredGearEnchantments(
  attacker: Combatant,
  victim: Combatant
): EnchantmentType[] {
  const attackerCounterSpells = countCounterSpells(attacker);
  const victimCounterSpells = countCounterSpells(victim);
  const victimCounteredCounterSpells = Math.max(
    0,
    victimCounterSpells - attackerCounterSpells
  );

  return getAllGearEnchantments(attacker, victimCounteredCounterSpells);
}
export function getAllGearEnchantments(
  attacker: Combatant,
  counterSpells: number = 0
): EnchantmentType[] {
  let enchantments: EnchantmentType[] = [];

  attacker.equipment.quests.forEach((questItem) => {
    const baseItem = BaseItems[questItem.baseItem];

    if (baseItem && baseItem.passiveEnchantments) {
      enchantments = enchantments.concat(baseItem.passiveEnchantments);
    }
  });
  attacker.equipment.armor.forEach((armor) => {
    if (armor.enchantment) {
      enchantments.push(armor.enchantment);
    }
  });

  attacker.equipment.weapons.forEach((weapon) => {
    if (weapon.enchantment) {
      enchantments.push(weapon.enchantment);
    }
  });

  if (counterSpells > 0) {
    enchantments = enchantments
      .sort(
        (a, b) =>
          EnchantmentCounterSpellOrder.indexOf(a) -
          EnchantmentCounterSpellOrder.indexOf(b)
      )
      .slice(counterSpells);
  }

  return enchantments.sort(
    (a, b) =>
      EnchantmentActivationOrder.indexOf(a) -
      EnchantmentActivationOrder.indexOf(b)
  );
}

export function getEnchantedAttributes(
  attackerInput: Combatant,
  victimInput: Combatant
): { attacker: EnchantedCombatant; victim: EnchantedCombatant } {
  let attacker: EnchantedCombatant = { ...attackerInput } as EnchantedCombatant;
  let victim: EnchantedCombatant = { ...victimInput } as EnchantedCombatant;
  if (!attacker.enchanted) {
    enchantAttacker(attacker, victim);
  }
  if (!victim.enchanted) {
    enchantVictim(attacker, victim);
  }

  attacker.luck = createLuck(attacker.attributes.luck);
  victim.luck = createLuck(victim.attributes.luck);

  return { attacker, victim };
}

function enchantVictim(
  attackerInput: Combatant,
  victimInput: Combatant
): { attacker: EnchantedCombatant; victim: EnchantedCombatant } {
  let attacker = attackerInput as EnchantedCombatant;
  let victim = victimInput as EnchantedCombatant;
  // symmetrical right now!
  return enchantAttacker(victim, attacker);
}

export function stealStat(
  attacker: EnchantedCombatant,
  victim: EnchantedCombatant,
  attribute: Attribute,
  percent: number
): { attacker: EnchantedCombatant; victim: EnchantedCombatant } {
  const statGain = attacker.attributes[attribute] * percent;
  victim.attributes[attribute] = Math.max(
    1,
    victim.attributes[attribute] - statGain
  );
  attacker.attributes[attribute] += statGain;

  return { attacker, victim };
}

export function enchantAttacker(
  attackerInput: Combatant,
  victimInput: Combatant
): { attacker: EnchantedCombatant; victim: EnchantedCombatant } {
  let attacker = attackerInput as EnchantedCombatant;
  let victim = victimInput as EnchantedCombatant;

  if (attacker.enchanted) {
    return { attacker, victim };
  }

  const { attackType } = attacker;

  attacker.attributes = { ...attacker.attributes };
  attacker.percentageDamageIncrease = attacker.percentageDamageIncrease ?? 1;
  attacker.percentageDamageReduction = attacker.percentageDamageReduction ?? 1;
  attacker.percentageEnchantmentDamageReduction =
    attacker.percentageEnchantmentDamageReduction ?? 1;
  attacker.enchanted = true;
  attacker.bonusDodge = attacker.bonusDodge ?? 1;
  attacker.bonusAccuracy = attacker.bonusAccuracy ?? 1;
  attacker.bonusWeaponTiers = attacker.bonusWeaponTiers ?? 0;
  attacker.bonusArmorTiers = attacker.bonusArmorTiers ?? 0;
  attacker.bonusShieldTiers = attacker.bonusShieldTiers ?? 0;
  attacker.mesmerizeChance = attacker.mesmerizeChance ?? 1;
  attacker.focusChance = attacker.focusChance ?? 1;

  victim.attributes = { ...victim.attributes };
  victim.percentageDamageIncrease = victim.percentageDamageIncrease ?? 1;
  victim.percentageDamageReduction = victim.percentageDamageReduction ?? 1;
  victim.percentageEnchantmentDamageReduction =
    victim.percentageEnchantmentDamageReduction ?? 1;
  victim.enchanted = true;
  victim.bonusDodge = victim.bonusDodge ?? 1;
  victim.bonusAccuracy = victim.bonusAccuracy ?? 1;
  victim.bonusWeaponTiers = victim.bonusWeaponTiers ?? 0;
  victim.bonusArmorTiers = victim.bonusArmorTiers ?? 0;
  victim.bonusShieldTiers = victim.bonusShieldTiers ?? 0;
  victim.mesmerizeChance = victim.mesmerizeChance ?? 1;
  victim.focusChance = victim.focusChance ?? 1;

  const enchantments = getCounteredGearEnchantments(attacker, victim);

  enchantments.forEach((enchantment) => {
    switch (enchantment) {
      case EnchantmentType.BonusStrength:
        attacker.attributes.strength *= 1.3;
        break;
      case EnchantmentType.BonusDexterity:
        attacker.attributes.dexterity *= 1.3;
        break;
      case EnchantmentType.BonusConstitution:
        attacker.attributes.constitution *= 1.3;
        break;
      case EnchantmentType.BonusIntelligence:
        attacker.attributes.intelligence *= 1.3;
        break;
      case EnchantmentType.BonusWisdom:
        attacker.attributes.wisdom *= 1.3;
        break;
      case EnchantmentType.BonusWillpower:
        attacker.attributes.willpower *= 1.3;
        break;
      case EnchantmentType.BonusLuck:
        attacker.attributes.luck *= 1.3;
        break;
      case EnchantmentType.BonusPhysical:
        attacker.attributes.strength *= 1.2;
        attacker.attributes.dexterity *= 1.2;
        attacker.attributes.constitution *= 1.2;
        break;
      case EnchantmentType.BonusMental:
        attacker.attributes.intelligence *= 1.2;
        attacker.attributes.wisdom *= 1.2;
        attacker.attributes.willpower *= 1.2;
        break;
      case EnchantmentType.BonusAllStats:
        attacker.attributes.strength *= 1.2;
        attacker.attributes.dexterity *= 1.2;
        attacker.attributes.constitution *= 1.2;
        attacker.attributes.intelligence *= 1.2;
        attacker.attributes.wisdom *= 1.2;
        attacker.attributes.willpower *= 1.2;
        break;

      case EnchantmentType.MinusEnemyArmor:
        victim.percentageDamageReduction *= 0.5;
        break;
      case EnchantmentType.BonusArmor:
        attacker.percentageDamageReduction *= 2;
        break;
      case EnchantmentType.MinusEnemyStrength:
        victim.attributes.strength *= 0.8;
        break;
      case EnchantmentType.MinusEnemyDexterity:
        victim.attributes.dexterity *= 0.8;
        break;
      case EnchantmentType.MinusEnemyConstitution:
        victim.attributes.constitution *= 0.8;
        break;
      case EnchantmentType.MinusEnemyIntelligence:
        victim.attributes.intelligence *= 0.8;
        break;
      case EnchantmentType.MinusEnemyWisdom:
        victim.attributes.wisdom *= 0.8;
        break;
      case EnchantmentType.MinusEnemyWillpower:
        victim.attributes.willpower *= 0.8;
        break;
      case EnchantmentType.MinusEnemyPhysical:
        victim.attributes.strength *= 0.9;
        victim.attributes.dexterity *= 0.9;
        victim.attributes.constitution *= 0.9;
        break;
      case EnchantmentType.MinusEnemyMental:
        victim.attributes.intelligence *= 0.9;
        victim.attributes.wisdom *= 0.9;
        victim.attributes.willpower *= 0.9;
        break;
      case EnchantmentType.MinusEnemyAllStats:
        victim.attributes.strength *= 0.9;
        victim.attributes.dexterity *= 0.9;
        victim.attributes.constitution *= 0.9;
        victim.attributes.intelligence *= 0.9;
        victim.attributes.wisdom *= 0.9;
        victim.attributes.willpower *= 0.9;
        break;
      case EnchantmentType.StrengthSteal:
        stealStat(attacker, victim, "strength", 0.3);
        break;
      case EnchantmentType.DexteritySteal:
        stealStat(attacker, victim, "dexterity", 0.3);
        break;
      case EnchantmentType.ConstitutionSteal:
        stealStat(attacker, victim, "constitution", 0.3);
        break;
      case EnchantmentType.IntelligenceSteal:
        stealStat(attacker, victim, "intelligence", 0.3);
        break;
      case EnchantmentType.WisdomSteal:
        stealStat(attacker, victim, "wisdom", 0.3);
        break;
      case EnchantmentType.WillpowerSteal:
        stealStat(attacker, victim, "willpower", 0.3);
        break;
      case EnchantmentType.LuckSteal:
        stealStat(attacker, victim, "luck", 0.3);
        break;
      case EnchantmentType.Vampirism:
        stealStat(attacker, victim, "constitution", 0.3);
        victim.percentageEnchantmentDamageReduction *= 0.95;

        break;
      case EnchantmentType.AllStatsSteal:
        stealStat(attacker, victim, "strength", 0.3);
        stealStat(attacker, victim, "dexterity", 0.3);
        stealStat(attacker, victim, "constitution", 0.3);
        stealStat(attacker, victim, "intelligence", 0.3);
        stealStat(attacker, victim, "wisdom", 0.3);
        stealStat(attacker, victim, "willpower", 0.3);
        stealStat(attacker, victim, "luck", 0.3);
        break;

      case EnchantmentType.BigMelee:
        attacker.attributes.strength *= 2;
        stealStat(attacker, victim, "dexterity", 0.4);
        break;
      case EnchantmentType.BigCaster:
        attacker.attributes.intelligence *= 2;
        stealStat(attacker, victim, "wisdom", 0.4);
        break;
      case EnchantmentType.WisDexWill:
        attacker.attributes.wisdom *= 1.4;
        attacker.attributes.dexterity *= 1.4;
        attacker.attributes.willpower *= 1.4;
        break;
      case EnchantmentType.Mesmerize:
        attacker.mesmerizeChance *= 0.5;
        break;
      case EnchantmentType.Focus:
        attacker.focusChance *= 0.5;
        break;

      // quest rewards
      case EnchantmentType.FishermansStrength:
        attacker.attributes.strength *= 1.5;
        break;
      case EnchantmentType.FishermansDexterity:
        attacker.attributes.dexterity *= 1.5;
        break;
      case EnchantmentType.FishermansConstitution:
        attacker.attributes.constitution *= 1.5;
        break;
      case EnchantmentType.FishermansIntelligence:
        attacker.attributes.intelligence *= 1.5;
        break;
      case EnchantmentType.FishermansWisdom:
        attacker.attributes.wisdom *= 1.5;
        break;
      case EnchantmentType.FishermansWillpower:
        attacker.attributes.willpower *= 1.5;
        break;
      case EnchantmentType.FishermansLuck:
        attacker.attributes.luck *= 1.5;
        break;

      case EnchantmentType.DoubleAccuracy:
        attacker.bonusAccuracy *= 2;
        break;
      case EnchantmentType.DoubleDodge:
        attacker.bonusDodge *= 2;
        break;
      case EnchantmentType.DoubleAllStats:
        attacker.attributes.strength *= 2;
        attacker.attributes.dexterity *= 2;
        attacker.attributes.constitution *= 2;
        attacker.attributes.intelligence *= 2;
        attacker.attributes.wisdom *= 2;
        attacker.attributes.willpower *= 2;
        attacker.attributes.luck *= 2;
        break;
      case EnchantmentType.BonusWeaponTier:
        attacker.bonusWeaponTiers += 1;
        break;
      case EnchantmentType.BonusArmorTier:
        attacker.bonusArmorTiers += 1;
        break;

      case EnchantmentType.BonusMeleeWeaponTier:
        if (attackType === AttackType.Melee) {
          attacker.bonusWeaponTiers += 1;
        }
        break;
      case EnchantmentType.BonusCasterWeaponTier:
        if (attackType === AttackType.Cast) {
          attacker.bonusWeaponTiers += 1;
        }
        break;
      case EnchantmentType.BonusRangedWeaponTier:
        if (attackType === AttackType.Ranged) {
          attacker.bonusWeaponTiers += 1;
        }
        break;
      case EnchantmentType.BonusSmiteWeaponTier:
        attacker.bonusShieldTiers += 1;
        break;
      case EnchantmentType.RangedArmorPiercing:
        if (attackType === AttackType.Ranged) {
          victim.percentageDamageReduction *= 0.5;
        }
        break;
      case EnchantmentType.MeleeArmorPiercing:
        if (attackType === AttackType.Melee) {
          victim.percentageDamageReduction *= 0.5;
        }
        break;
      case EnchantmentType.CasterArmorPiercing:
        if (attackType === AttackType.Cast) {
          victim.percentageDamageReduction *= 0.5;
        }
        break;
      case EnchantmentType.SmiteArmorPiercing:
        if (attackType === AttackType.Smite) {
          victim.percentageDamageReduction *= 0.5;
        }
        break;
      case EnchantmentType.VampireArmorPiercing:
        if (attackType === AttackType.Blood) {
          victim.percentageEnchantmentDamageReduction *= 0.5;
        }
        break;
    }
  });

  switch (attacker.class) {
    case HeroClasses.Adventurer:
      break;
    case HeroClasses.JackOfAllTrades:
      attacker.attributes.strength *= 1.5;
      attacker.attributes.dexterity *= 1.5;
      attacker.attributes.constitution *= 1.5;
      attacker.attributes.intelligence *= 1.5;
      attacker.attributes.wisdom *= 1.5;
      attacker.attributes.willpower *= 1.5;
      break;

    case HeroClasses.Daredevil:
      attacker.attributes.strength *= 1 + Math.random();
      attacker.attributes.dexterity *= 1 + Math.random();
      attacker.attributes.constitution *= 1 + Math.random();
      attacker.attributes.intelligence *= 1 + Math.random();
      attacker.attributes.wisdom *= 1 + Math.random();
      attacker.attributes.willpower *= 1 + Math.random();
      attacker.attributes.luck *= 1 + Math.random();
      attacker.bonusAccuracy *= 2;
      attacker.bonusWeaponTiers += Math.round(Math.random() * 3);
    case HeroClasses.Gambler:
      attacker.attributes.strength *= 1.1;
      attacker.attributes.dexterity *= 1.2;
      attacker.attributes.constitution *= 1.1;
      attacker.attributes.intelligence *= 1.1;
      attacker.attributes.wisdom *= 1.2;
      attacker.attributes.willpower *= 1.1;
      attacker.attributes.luck *= 1.2;
      break;

    // melee
    case HeroClasses.EnragedBerserker:
      attacker.attributes.strength *= 2;
      attacker.attributes.dexterity *= 2;
      attacker.bonusAccuracy *= 2;
      attacker.bonusWeaponTiers += 1;
    case HeroClasses.Berserker:
      attacker.attributes.strength *= 2;
      attacker.attributes.dexterity *= 1.3;
      break;

    case HeroClasses.Gladiator:
      attacker.attributes.strength *= 2;
      attacker.attributes.dexterity *= 2;
      attacker.bonusAccuracy *= 2;
      attacker.bonusWeaponTiers += 1;
    case HeroClasses.Fighter:
      attacker.attributes.strength *= 1.5;
      attacker.attributes.dexterity *= 1.3;
      attacker.attributes.willpower *= 1.2;
      break;

    // casters
    case HeroClasses.MasterWizard:
      attacker.attributes.intelligence *= 2;
      attacker.attributes.wisdom *= 2;
      attacker.bonusAccuracy *= 2;
      attacker.bonusWeaponTiers += 1;
    case HeroClasses.Wizard:
      attacker.attributes.intelligence *= 2;
      attacker.attributes.wisdom *= 1.3;
      break;

    case HeroClasses.MasterWarlock:
      attacker.attributes.intelligence *= 2;
      attacker.attributes.wisdom *= 2;
      attacker.bonusAccuracy *= 2;
      attacker.bonusWeaponTiers += 1;
    case HeroClasses.Warlock:
      attacker.attributes.intelligence *= 1.5;
      attacker.attributes.wisdom *= 1.3;
      attacker.attributes.willpower *= 1.2;
      break;

    // mixed
    case HeroClasses.DemonHunter:
      attacker.attributes.strength *= 3;
      attacker.attributes.dexterity *= 1.3;
      attacker.attributes.intelligence *= 3;
      attacker.attributes.wisdom *= 1.3;
      attacker.attributes.willpower *= 1.2;
      attacker.bonusAccuracy *= 2;
      attacker.bonusWeaponTiers += 1;
    case HeroClasses.BattleMage:
      attacker.attributes.strength *= 2;
      attacker.attributes.dexterity *= 1.3;
      attacker.attributes.intelligence *= 2;
      attacker.attributes.wisdom *= 1.3;
      attacker.attributes.willpower *= 1.2;
      break;

    case HeroClasses.Zealot:
      attacker.attributes.willpower *= 1.3;
      attacker.attributes.wisdom *= 2;
      attacker.bonusAccuracy *= 2;
      attacker.bonusWeaponTiers += 1;
    case HeroClasses.Paladin:
      attacker.attributes.willpower *= 1.3;
      break;

    case HeroClasses.Archer:
      attacker.attributes.dexterity *= 4;
      attacker.bonusWeaponTiers += 1;
    case HeroClasses.Ranger:
      attacker.attributes.dexterity *= 2;
      attacker.bonusAccuracy *= 2;
      break;

    case HeroClasses.Vampire:
      attacker.attributes.constitution *= 1.5;
      attacker.attributes.willpower *= 1.5;
      victim.percentageEnchantmentDamageReduction *= 0.5;
    case HeroClasses.BloodMage:
      attacker.attributes.constitution *= 1.2;
      break;
  }

  return { attacker, victim };
}
