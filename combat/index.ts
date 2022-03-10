import {
  Hero,
  MonsterInstance,
  Monster,
  CombatEntry,
  AttackType,
  HeroStats,
  Attributes,
  InventoryItem,
  InventoryItemType,
  EnchantmentType,
  HeroClasses,
  MonsterEquipment,
} from "types/graphql";

import Databases from "../db";

import { BaseItems } from "../schema/items/base-items";
import {
  EnchantmentActivationOrder,
  EnchantmentCounterSpellOrder,
} from "./enchantment-order";

type MonsterHeroCombatResult = {
  monsterDamage: number;
  heroDamage: number;
  monsterEnchantmentDamage: number;
  heroEnchantmentDamage: number;
  monsterHeal: number;
  heroHeal: number;

  monsterDied: boolean;
  heroDied: boolean;
  log: CombatEntry[];
};

type CombatGear = {
  type?: InventoryItemType;
  level: number;
  baseItem?: string;
  enchantment?: EnchantmentType | null;
};
type QuestItem = {
  name: string;
  baseItem: string;
};
export type CombatantGear = {
  armor: CombatGear[];
  weapons: CombatGear[];
  quests: QuestItem[];
};
export type Combatant = {
  level: number;
  name: string;
  class: HeroClasses;
  equipment: CombatantGear;
  attributes: HeroStats;
  damageReduction: number;
  luck: {
    smallModifier: number;
    largeModifier: number;
    ultraModifier: number;
  };
};

function randomNumber(min: number, max: number) {
  return Math.round(Math.random() * (max - min) + min);
}
type Attribute = keyof HeroStats;
type AttackAttributes = {
  toHit: Attribute;
  damage: Attribute;
  dodge: Attribute;
  damageReduction: Attribute;
};

function createMonsterStatsByLevel(level: number): HeroStats {
  return {
    strength: Math.ceil(Math.pow(1.35, level - 1) * 8) - 5,
    dexterity: Math.ceil(Math.pow(1.35, level - 1) * 8) - 5,
    constitution: Math.ceil(Math.pow(1.35, level - 1) * 8) - 5,
    intelligence: Math.ceil(Math.pow(1.35, level - 1) * 8) - 5,
    wisdom: Math.ceil(Math.pow(1.35, level - 1) * 8) - 5,
    willpower: Math.ceil(Math.pow(1.35, level - 1) * 8) - 5,
    luck: Math.ceil(Math.pow(1.35, level - 1) * 8) - 5,
  };
}

function createMonsterLuck(monster: Monster) {
  // damage spread
  const smallModifier =
    monster.combat.maxHealth / (monster.combat.maxHealth + 20);
  // critical
  const largeModifier =
    monster.combat.maxHealth / (monster.combat.maxHealth + 100);
  // super crit
  const ultraModifier =
    monster.combat.maxHealth / (monster.combat.maxHealth + 500);

  return { smallModifier, largeModifier, ultraModifier };
}

export function createMonsterEquipment(
  monster: Partial<Monster> & Pick<Monster, "level">,
  equipmentOverride?: MonsterEquipment | null
): CombatantGear {
  if (equipmentOverride) {
    return {
      armor: [
        {
          level: equipmentOverride.bodyArmor.level,
          enchantment: equipmentOverride.bodyArmor.enchantment,
          type: InventoryItemType.BodyArmor,
        }, // bodyArmor
        {
          level: equipmentOverride.handArmor.level,
          enchantment: equipmentOverride.handArmor.enchantment,
          type: InventoryItemType.HandArmor,
        }, // handArmor
        {
          level: equipmentOverride.legArmor.level,
          enchantment: equipmentOverride.legArmor.enchantment,
          type: InventoryItemType.LegArmor,
        }, // legArmor
        {
          level: equipmentOverride.headArmor.level,
          enchantment: equipmentOverride.headArmor.enchantment,
          type: InventoryItemType.HeadArmor,
        }, // headArmor
        {
          level: equipmentOverride.footArmor.level,
          enchantment: equipmentOverride.footArmor.enchantment,
          type: InventoryItemType.FootArmor,
        }, // footArmor
      ],
      weapons: [
        {
          level: equipmentOverride.leftHand.level,
          enchantment: equipmentOverride.leftHand.enchantment,
        }, // leftHand
        {
          level: equipmentOverride.rightHand.level,
          enchantment: equipmentOverride.rightHand.enchantment,
        }, // rightHand
      ],
      quests: [],
    };
  }
  return {
    armor: [
      { level: monster.level * 1, type: InventoryItemType.BodyArmor }, // bodyArmor
      { level: monster.level * 1, type: InventoryItemType.HandArmor }, // handArmor
      { level: monster.level * 1, type: InventoryItemType.LegArmor }, // legArmor
      { level: monster.level * 1, type: InventoryItemType.HeadArmor }, // headArmor
      { level: monster.level * 1, type: InventoryItemType.FootArmor }, // footArmor
    ],
    weapons: [
      { level: monster.level * 1 }, // leftHand
      { level: monster.level * 1 }, // rightHand
    ],
    quests: [],
  };
}

export function attributesForAttack(attackType: AttackType): AttackAttributes {
  switch (attackType) {
    case AttackType.Blood:
      return {
        toHit: "constitution",
        damage: "constitution",
        dodge: "constitution",
        damageReduction: "willpower",
      };
      break;
    case AttackType.Smite:
      return {
        toHit: "wisdom",
        damage: "willpower",
        dodge: "wisdom",
        damageReduction: "willpower",
      };
      break;
    case AttackType.Cast:
      return {
        toHit: "wisdom",
        damage: "intelligence",
        dodge: "wisdom",
        damageReduction: "willpower",
      };
      break;
    case AttackType.Ranged:
      return {
        toHit: "dexterity",
        damage: "dexterity",
        dodge: "dexterity",
        damageReduction: "willpower",
      };
      break;
    case AttackType.Melee:
    default:
      return {
        toHit: "dexterity",
        damage: "strength",
        dodge: "dexterity",
        damageReduction: "willpower",
      };
      break;
  }
}

export function calculateHit(
  attackerInput: Combatant,
  attackType: AttackType,
  victimInput: Combatant,
  isSecondAttack: boolean
): boolean {
  const attackAttributes = attributesForAttack(attackType);

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput
  );

  let attackerAccStat = attacker.attributes[attackAttributes.toHit];
  let victimDodgeStat = victim.attributes[attackAttributes.dodge];

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

type EnchantedCombatant = Combatant & {
  percentageDamageIncrease: number;
  percentageDamageReduction: number;
  enchanted: true;
  bonusAccuracy: number;
  bonusDodge: number;
  bonusWeaponTiers: number;
  bonusArmorTiers: number;
  // inverse for MATHS
  mesmerizeChance: number;
  focusChance: number;
};

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

  attacker.attributes = { ...attacker.attributes };
  attacker.percentageDamageIncrease = attacker.percentageDamageIncrease ?? 1;
  attacker.percentageDamageReduction = attacker.percentageDamageReduction ?? 1;
  attacker.enchanted = true;
  attacker.bonusDodge = attacker.bonusDodge ?? 1;
  attacker.bonusAccuracy = attacker.bonusAccuracy ?? 1;
  attacker.bonusWeaponTiers = attacker.bonusWeaponTiers ?? 0;
  attacker.bonusArmorTiers = attacker.bonusArmorTiers ?? 0;
  attacker.mesmerizeChance = attacker.mesmerizeChance ?? 1;
  attacker.focusChance = attacker.focusChance ?? 1;

  victim.attributes = { ...victim.attributes };
  victim.percentageDamageIncrease = victim.percentageDamageIncrease ?? 1;
  victim.percentageDamageReduction = victim.percentageDamageReduction ?? 1;
  victim.enchanted = true;
  victim.bonusDodge = victim.bonusDodge ?? 1;
  victim.bonusAccuracy = victim.bonusAccuracy ?? 1;
  victim.bonusWeaponTiers = victim.bonusWeaponTiers ?? 0;
  victim.bonusArmorTiers = victim.bonusArmorTiers ?? 0;
  victim.mesmerizeChance = victim.mesmerizeChance ?? 1;
  victim.focusChance = victim.focusChance ?? 1;

  const enchantments = getCounteredGearEnchantments(attacker, victim);

  enchantments.forEach((enchantment) => {
    switch (enchantment) {
      case EnchantmentType.BonusStrength:
        attacker.attributes.strength *= 1.2;
        break;
      case EnchantmentType.BonusDexterity:
        attacker.attributes.dexterity *= 1.2;
        break;
      case EnchantmentType.BonusConstitution:
        attacker.attributes.constitution *= 1.2;
        break;
      case EnchantmentType.BonusIntelligence:
        attacker.attributes.intelligence *= 1.2;
        break;
      case EnchantmentType.BonusWisdom:
        attacker.attributes.wisdom *= 1.2;
        break;
      case EnchantmentType.BonusWillpower:
        attacker.attributes.willpower *= 1.2;
        break;
      case EnchantmentType.BonusLuck:
        attacker.attributes.luck *= 1.2;
        break;
      case EnchantmentType.BonusPhysical:
        attacker.attributes.strength *= 1.1;
        attacker.attributes.dexterity *= 1.1;
        attacker.attributes.constitution *= 1.1;
        break;
      case EnchantmentType.BonusMental:
        attacker.attributes.intelligence *= 1.1;
        attacker.attributes.wisdom *= 1.1;
        attacker.attributes.willpower *= 1.1;
        break;
      case EnchantmentType.BonusAllStats:
        attacker.attributes.strength *= 1.1;
        attacker.attributes.dexterity *= 1.1;
        attacker.attributes.constitution *= 1.1;
        attacker.attributes.intelligence *= 1.1;
        attacker.attributes.wisdom *= 1.1;
        attacker.attributes.willpower *= 1.1;
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
        stealStat(attacker, victim, "strength", 0.2);
        break;
      case EnchantmentType.DexteritySteal:
        stealStat(attacker, victim, "dexterity", 0.2);
        break;
      case EnchantmentType.ConstitutionSteal:
        stealStat(attacker, victim, "constitution", 0.2);
        break;
      case EnchantmentType.IntelligenceSteal:
        stealStat(attacker, victim, "intelligence", 0.2);
        break;
      case EnchantmentType.WisdomSteal:
        stealStat(attacker, victim, "wisdom", 0.2);
        break;
      case EnchantmentType.WillpowerSteal:
        stealStat(attacker, victim, "willpower", 0.2);
        break;
      case EnchantmentType.LuckSteal:
        stealStat(attacker, victim, "luck", 0.2);
        break;
      case EnchantmentType.Vampirism:
        stealStat(attacker, victim, "constitution", 0.3);
        break;
      case EnchantmentType.AllStatsSteal:
        stealStat(attacker, victim, "strength", 0.2);
        stealStat(attacker, victim, "dexterity", 0.2);
        stealStat(attacker, victim, "constitution", 0.2);
        stealStat(attacker, victim, "intelligence", 0.2);
        stealStat(attacker, victim, "wisdom", 0.2);
        stealStat(attacker, victim, "willpower", 0.2);
        stealStat(attacker, victim, "luck", 0.2);
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
      attacker.attributes.dexterity *= 2;
      attacker.bonusAccuracy *= 2;
      attacker.bonusWeaponTiers += 1;

    case HeroClasses.Ranger:
      attacker.attributes.dexterity *= 2;
      attacker.bonusAccuracy *= 2;
      break;
    case HeroClasses.Vampire:
      attacker.attributes.constitution *= 1.5;
      attacker.attributes.willpower *= 1.5;
      attacker.bonusAccuracy *= 2;
    case HeroClasses.BloodMage:
      // you've had enough...
      break;
  }

  return { attacker, victim };
}

export function calculateDamage(
  attackerInput: Combatant,
  attackType: AttackType,
  victimInput: Combatant,
  isSecondAttack: boolean = false,
  debug: boolean = false
): { damage: number; critical: boolean; doubleCritical: boolean } {
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
        armor.level + victim.bonusArmorTiers
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
        armor.level + victim.bonusArmorTiers
      );
      totalArmor += Math.pow(1.3, armor.level + victim.bonusArmorTiers);

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

  const weapon = isSecondAttack
    ? attacker.equipment.weapons[1]
    : attacker.equipment.weapons[0];
  let weaponLevel = weapon?.level ?? 0;

  if (weapon) {
    // they count as 1 level higher
    if (getItemPassiveUpgradeTier(weapon) > 1) {
      weaponLevel += 1;
    }
    weaponLevel += attacker.bonusWeaponTiers;
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

function addItemToCombatant(
  combatant: Combatant,
  item: InventoryItem,
  attackType: AttackType
): Combatant {
  let itemLevel = item.level;
  // affectsAttackType ? item.level : 1
  if (!doesWeaponAffectAttack(item, attackType)) {
    itemLevel = 0;
  }
  if (
    combatant.class === HeroClasses.BattleMage ||
    combatant.class === HeroClasses.DemonHunter
  ) {
    if (
      attackType === AttackType.Cast &&
      item.type === InventoryItemType.MeleeWeapon
    ) {
      itemLevel = item.level / 2;
    }
    if (
      attackType === AttackType.Melee &&
      item.type === InventoryItemType.SpellFocus
    ) {
      itemLevel = item.level / 2;
    }
  }

  if (
    item.type === InventoryItemType.MeleeWeapon ||
    item.type === InventoryItemType.SpellFocus ||
    item.type === InventoryItemType.RangedWeapon ||
    (item.type === InventoryItemType.Shield &&
      (combatant.class === HeroClasses.Paladin ||
        combatant.class === HeroClasses.Zealot))
  ) {
    if (
      item.type === InventoryItemType.RangedWeapon &&
      combatant.equipment.weapons.length
    ) {
      return combatant;
    }
    combatant.equipment.weapons.push({
      level: itemLevel,
      baseItem: item.baseItem,
      enchantment: item.enchantment,
      type: item.type,
    });
  } else {
    combatant.equipment.armor.push({
      level: item.level,
      baseItem: item.baseItem,
      enchantment: item.enchantment,
      type: item.type,
    });
  }

  return combatant;
}

function doesWeaponAffectAttack(
  weapon: InventoryItem,
  attackType: AttackType
): boolean {
  switch (attackType) {
    case AttackType.Blood:
      if (
        weapon.type === InventoryItemType.RangedWeapon ||
        weapon.type === InventoryItemType.MeleeWeapon
      ) {
        return false;
      }
      break;
    case AttackType.Smite:
      if (weapon.type === InventoryItemType.RangedWeapon) {
        return false;
      }
      break;
    case AttackType.Cast:
      if (
        weapon.type === InventoryItemType.MeleeWeapon ||
        weapon.type === InventoryItemType.RangedWeapon
      ) {
        return false;
      }
      break;
    case AttackType.Ranged:
      if (
        weapon.type === InventoryItemType.MeleeWeapon ||
        weapon.type === InventoryItemType.SpellFocus
      ) {
        return false;
      }
      break;
    case AttackType.Melee:
      if (
        weapon.type === InventoryItemType.SpellFocus ||
        weapon.type === InventoryItemType.RangedWeapon
      ) {
        return false;
      }
      break;
    default:
      break;
  }
  return true;
}

function createLuck(luck: number): {
  smallModifier: number;
  largeModifier: number;
  ultraModifier: number;
} {
  return {
    smallModifier: Databases.hero.smallLuck(luck),
    largeModifier: Databases.hero.largeLuck(luck),
    ultraModifier: Databases.hero.ultraLuck(luck),
  };
}

export function createHeroCombatant(
  hero: Hero,
  attackType: AttackType
): Combatant {
  const heroCombatant: Combatant = {
    class: hero.class,
    level: hero.level,
    name: hero.name,
    equipment: {
      armor: [],
      weapons: [],
      quests: hero.inventory.filter((i) => i.type === InventoryItemType.Quest),
    },
    damageReduction: hero.level,
    attributes: hero.stats,
    luck: createLuck(hero.stats.luck),
  };

  if (hero.equipment.leftHand) {
    addItemToCombatant(heroCombatant, hero.equipment.leftHand, attackType);
  }
  if (hero.equipment.rightHand) {
    addItemToCombatant(heroCombatant, hero.equipment.rightHand, attackType);
  }
  if (hero.equipment.bodyArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.bodyArmor, attackType);
  }
  if (hero.equipment.handArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.handArmor, attackType);
  }
  if (hero.equipment.legArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.legArmor, attackType);
  }
  if (hero.equipment.headArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.headArmor, attackType);
  }
  if (hero.equipment.footArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.footArmor, attackType);
  }

  heroCombatant.equipment.weapons = heroCombatant.equipment.weapons.sort(
    (a, b) => b.level - a.level
  );

  return heroCombatant;
}

function countCounterSpells(attacker: Combatant): number {
  // eventually other sources of counter spell maybe?
  return getAllGearEnchantments(attacker).filter(
    (ench) => ench === EnchantmentType.CounterSpell
  ).length;
}
function getCounteredGearEnchantments(
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
function getAllGearEnchantments(
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

function calculateEnchantmentDamage(
  attackerInput: Combatant,
  victimInput: Combatant,
  attackType: AttackType
): {
  attackerDamage: number;
  victimDamage: number;
  attackerHeal: number;
  victimHeal: number;
} {
  const attackAttributes = attributesForAttack(attackType);
  let attackerDamage = 0;
  let victimDamage = 0;
  let attackerHeal = 0;
  let victimHeal = 0;

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput
  );

  // blood attacks deal additional enchantment damage!
  if (attackType === AttackType.Blood) {
    attacker.attributes.constitution *= 1.2;
  }

  const attackerEnchantments = getCounteredGearEnchantments(attacker, victim);

  attackerEnchantments.forEach((enchantment) => {
    switch (enchantment) {
      case EnchantmentType.LifeHeal:
        attackerHeal += Math.round(attacker.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeDamage:
        victimDamage += Math.round(attacker.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeSteal:
        attackerHeal += Math.round(attacker.attributes.constitution * 0.1);
        victimDamage += Math.round(attacker.attributes.constitution * 0.1);
        break;

      case EnchantmentType.Vampirism:
        attackerHeal += Math.round(attacker.attributes.constitution * 0.2);
        victimDamage += Math.round(attacker.attributes.constitution * 0.2);
        break;
    }
  });

  const victimEnchantments = getCounteredGearEnchantments(victim, attacker);

  victimEnchantments.forEach((enchantment) => {
    switch (enchantment) {
      case EnchantmentType.LifeHeal:
        victimHeal += Math.round(victim.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeDamage:
        attackerDamage += Math.round(victim.attributes.constitution * 0.1);
        break;

      case EnchantmentType.LifeSteal:
        victimHeal += Math.round(victim.attributes.constitution * 0.1);
        attackerDamage += Math.round(victim.attributes.constitution * 0.1);
        break;

      case EnchantmentType.Vampirism:
        victimHeal += Math.round(victim.attributes.constitution * 0.2);
        attackerDamage += Math.round(victim.attributes.constitution * 0.2);
        break;
    }
  });

  const victimCanOnlyTakeOneDamage = getAllGearEnchantments(victim).find(
    (ench) => ench === EnchantmentType.CanOnlyTakeOneDamage
  );
  const attackerCanOnlyTakeOneDamage = getAllGearEnchantments(attacker).find(
    (ench) => ench === EnchantmentType.CanOnlyTakeOneDamage
  );

  if (victimCanOnlyTakeOneDamage) {
    victimDamage = Math.min(1, victimDamage);
  }
  if (attackerCanOnlyTakeOneDamage) {
    attackerDamage = Math.min(1, attackerDamage);
  }

  return {
    attackerDamage,
    victimDamage,
    attackerHeal,
    victimHeal,
  };
}

function attackCombatant(
  attacker: Combatant,
  victim: Combatant,
  attackType: AttackType,
  isSecondAttack: boolean = false
): {
  hit: boolean;
  damage: number;
  critical: boolean;
  doubleCritical: boolean;
  combatLog: CombatEntry[];
} {
  if (
    isSecondAttack &&
    (attacker.class === HeroClasses.BattleMage ||
      attacker.class === HeroClasses.DemonHunter)
  ) {
    if (attacker.equipment.weapons[1].type === InventoryItemType.MeleeWeapon) {
      attackType = AttackType.Melee;
    }
    if (attacker.equipment.weapons[1].type === InventoryItemType.SpellFocus) {
      attackType = AttackType.Cast;
    }
  }

  const hit = calculateHit(attacker, attackType, victim, isSecondAttack);
  let damage = 0;
  let critical = false;
  let doubleCritical = false;
  const combatLog: CombatEntry[] = [];

  if (hit) {
    const damageResult = calculateDamage(
      attacker,
      attackType,
      victim,
      isSecondAttack
    );
    damage = damageResult.damage;
    critical = damageResult.critical;
    doubleCritical = damageResult.doubleCritical;

    combatLog.push({
      attackType: attackType,
      success: true,
      isEnchantment: false,
      from: attacker.name,
      to: victim.name,
      damage,
      critical,
    });

    // console.log(
    //   attacker.name,
    //   `(${attacker.level})`,
    //   critical ? "crit" : "dealt",
    //   damage,
    //   "to",
    //   victim.name,
    //   `(${victim.level})`,
    //   "with",
    //   attackType
    // );
  } else {
    combatLog.push({
      attackType: attackType,
      damage: 0,
      success: false,
      isEnchantment: false,
      from: attacker.name,
      to: victim.name,
      critical: false,
    });
  }

  return {
    hit,
    damage,
    critical,
    doubleCritical,
    combatLog,
  };
}

export function createMonsterCombatant(
  level: number,
  name: string,
  equipment?: MonsterEquipment | null
) {
  const monsterAttributes = createMonsterStatsByLevel(level);

  return {
    class: HeroClasses.Monster,
    level: level,
    name: name,
    equipment: equipment
      ? createMonsterEquipment({ level }, equipment)
      : createMonsterEquipment({ level }),
    damageReduction: monsterAttributes.constitution / 2,
    attributes: monsterAttributes,
    luck: createLuck(monsterAttributes.luck),
  };
}

export async function fightMonster(
  hero: Hero,
  monsterInstance: MonsterInstance,
  attackType: AttackType
): Promise<MonsterHeroCombatResult> {
  const { monster, equipment } = monsterInstance;
  let battleResults: CombatEntry[] = [];
  const heroAttackType = attackType;
  const heroAttributeTypes = attributesForAttack(heroAttackType);
  const heroAttributes = hero.stats;
  const heroCombatant = createHeroCombatant(hero, heroAttackType);
  let heroHasTwoAttacks = false;

  if (heroCombatant.equipment.weapons.length > 1) {
    // has two weapons, check their types...
    if (
      heroCombatant.equipment.weapons[0].type !==
        InventoryItemType.RangedWeapon &&
      heroCombatant.equipment.weapons[1].type !== InventoryItemType.RangedWeapon
    ) {
      // neither are ranged weapons
      // only other things that can go into weapon array are
      // spell focus, weapons, shield (paladin)
      // all of those are allowed to be combined, their levels are already set accordingly
      // level 0 means this weapon isn't appropriate for this attack
      // so we don't want them (weps are sorted)
      heroHasTwoAttacks = heroCombatant.equipment.weapons[1].level !== 0;
    }
  }

  const monsterCombatant = createMonsterCombatant(
    monster.level,
    monster.name,
    equipment
  );

  const enchantmentBattle = calculateEnchantmentDamage(
    heroCombatant,
    monsterCombatant,
    attackType
  );
  let heroDamage = 0;

  // disallow overhealing.... hmm.....
  enchantmentBattle.attackerHeal = Math.min(
    hero.combat.maxHealth - hero.combat.health,
    enchantmentBattle.attackerHeal
  );
  enchantmentBattle.victimHeal = Math.min(
    monster.combat.maxHealth - monster.combat.health,
    enchantmentBattle.victimHeal
  );

  const { attacker, victim } = getEnchantedAttributes(
    heroCombatant,
    monsterCombatant
  );

  const attackerDidMesmerize = Math.random() > attacker.mesmerizeChance;
  const victimDidMesmerize = Math.random() > victim.mesmerizeChance;
  const attackerDidFocus = Math.random() > attacker.focusChance;
  const victimDidFocus = Math.random() > victim.focusChance;

  const attackerIsMesmerized = !attackerDidFocus && victimDidMesmerize;
  const victimIsMesmerized = !victimDidFocus && attackerDidMesmerize;

  if (attackerIsMesmerized) {
    battleResults.push({
      attackType: monster.attackType,
      success: true,
      isEnchantment: true,
      isMesmerize: true,
      from: monster.name,
      to: hero.name,
      damage: 0,
      critical: false,
    });
    enchantmentBattle.victimDamage = 0;
    enchantmentBattle.attackerHeal = 0;
  }
  if (victimIsMesmerized) {
    battleResults.push({
      attackType: heroAttackType,
      success: true,
      isEnchantment: true,
      isMesmerize: true,
      from: hero.name,
      to: monster.name,
      damage: 0,
      critical: false,
    });
    enchantmentBattle.attackerDamage = 0;
    enchantmentBattle.victimHeal = 0;
  }

  if (enchantmentBattle.victimDamage > 0) {
    battleResults.push({
      attackType: heroAttackType,
      success: true,
      isEnchantment: true,
      from: hero.name,
      to: monster.name,
      damage: enchantmentBattle.victimDamage,
      critical: false,
    });
  }

  if (enchantmentBattle.attackerHeal > 0) {
    battleResults.push({
      attackType: heroAttackType,
      success: true,
      isEnchantment: true,
      from: hero.name,
      to: hero.name,
      damage: 0 - enchantmentBattle.attackerHeal,
      critical: false,
    });
  }

  if (enchantmentBattle.attackerDamage > 0) {
    battleResults.push({
      attackType: monster.attackType,
      success: true,
      isEnchantment: true,
      from: monster.name,
      to: hero.name,
      damage: enchantmentBattle.attackerDamage,
      critical: false,
    });
  }

  if (enchantmentBattle.victimHeal > 0) {
    battleResults.push({
      attackType: monster.attackType,
      success: true,
      isEnchantment: true,
      from: monster.name,
      to: monster.name,
      damage: 0 - enchantmentBattle.victimHeal,
      critical: false,
    });
  }

  if (
    !attackerIsMesmerized &&
    enchantmentBattle.attackerDamage - enchantmentBattle.attackerHeal <
      hero.combat.health
  ) {
    const heroAttack = attackCombatant(
      heroCombatant,
      monsterCombatant,
      attackType
    );
    heroDamage += heroAttack.damage;
    battleResults = battleResults.concat(heroAttack.combatLog);
  }

  const bloodMageDamage =
    heroCombatant.class === HeroClasses.BloodMage ||
    heroCombatant.class === HeroClasses.Vampire
      ? hero.combat.health * 0.01
      : hero.combat.health * 0.05;

  let monsterDamage = heroAttackType === AttackType.Blood ? bloodMageDamage : 0;

  if (
    !victimIsMesmerized &&
    enchantmentBattle.victimDamage - enchantmentBattle.victimHeal + heroDamage <
      monster.combat.health
  ) {
    const monsterAttack = attackCombatant(
      monsterCombatant,
      heroCombatant,
      monster.attackType
    );

    monsterDamage += monsterAttack.damage;
    battleResults = battleResults.concat(monsterAttack.combatLog);
  }

  if (
    !attackerIsMesmerized &&
    enchantmentBattle.attackerDamage -
      enchantmentBattle.attackerHeal +
      monsterDamage <
      hero.combat.health &&
    heroHasTwoAttacks
  ) {
    const secondHeroAttack = attackCombatant(
      heroCombatant,
      monsterCombatant,
      attackType,
      true
    );
    heroDamage += secondHeroAttack.damage;
    battleResults = battleResults.concat(secondHeroAttack.combatLog);
  }

  // do not allow overhealing
  monsterDamage = Math.max(
    monsterDamage,
    hero.combat.health - hero.combat.maxHealth
  );
  heroDamage = Math.max(
    heroDamage,
    monster.combat.health - monster.combat.maxHealth
  );

  const totalDamageAgainstHero =
    monsterDamage +
    enchantmentBattle.attackerDamage -
    enchantmentBattle.attackerHeal;
  const totalDamageAgainstMonster =
    heroDamage + enchantmentBattle.victimDamage - enchantmentBattle.victimHeal;

  // "monster" / "hero" is "damage from them"
  // "attacker" / "victim" is "damage/heal to them"
  // generally in result, monster == attacker even though the input to the functions as player as the attacker
  // ugh
  return {
    monsterEnchantmentDamage: enchantmentBattle.attackerDamage,
    heroEnchantmentDamage: enchantmentBattle.victimDamage,
    monsterHeal: enchantmentBattle.victimHeal,
    heroHeal: enchantmentBattle.attackerHeal,
    monsterDamage: monsterDamage,
    heroDamage: heroDamage,
    monsterDied: totalDamageAgainstMonster >= monster.combat.health,
    heroDied: totalDamageAgainstHero >= hero.combat.health,
    log: battleResults,
  };
}

function getItemPassiveUpgradeTier({
  baseItem,
  level,
}: {
  baseItem?: string;
  level: number;
}): number {
  if (baseItem?.length) {
    if (level > 33) {
      return 2;
    }
    if (level > 32) {
      return 1;
    }
  }
  return 0;
}
