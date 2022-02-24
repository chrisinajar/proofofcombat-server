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
} from "types/graphql";

import Databases from "../db";

import { BaseItems } from "../schema/items/base-items";

type MonsterHeroCombatResult = {
  monsterDamage: number;
  heroDamage: number;
  monsterDied: boolean;
  heroDied: boolean;
  log: CombatEntry[];
};

function randomNumber(min: number, max: number) {
  return Math.round(Math.random() * (max - min) + min);
}
type Attribute = keyof HeroStats;
type AttackAttributes = {
  toHit: Attribute;
  damage: Attribute;
  dodge: Attribute;
};

function createMonsterStats(monster: Monster): HeroStats {
  console.log(monster.name, "has", monster.combat.maxHealth - 5, "stats");
  return {
    strength: monster.combat.maxHealth - 5,
    dexterity: monster.combat.maxHealth - 5,
    constitution: monster.combat.maxHealth - 5,
    intelligence: monster.combat.maxHealth - 5,
    wisdom: monster.combat.maxHealth - 5,
    charisma: monster.combat.maxHealth - 5,
    luck: monster.combat.maxHealth - 5,
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

function createMonsterEquipment(monster: Monster) {
  return {
    armor: [
      { level: monster.level }, // bodyArmor
      { level: monster.level }, // handArmor
      { level: monster.level }, // legArmor
      { level: monster.level }, // headArmor
      { level: monster.level }, // footArmor
    ],
    weapons: [
      { level: monster.level }, // leftHand
      { level: monster.level }, // rightHand
    ],
    quests: [],
  };
}

function attributesForAttack(attackType: AttackType): AttackAttributes {
  switch (attackType) {
    case AttackType.Blood:
      return {
        toHit: "constitution",
        damage: "constitution",
        dodge: "constitution",
      };
      break;
    case AttackType.Holy:
      return {
        toHit: "charisma",
        damage: "charisma",
        dodge: "intelligence",
      };
      break;
    case AttackType.Wizard:
      return {
        toHit: "intelligence",
        damage: "intelligence",
        dodge: "wisdom",
      };
      break;
    case AttackType.Elemental:
      return {
        toHit: "wisdom",
        damage: "wisdom",
        dodge: "dexterity",
      };
      break;
    case AttackType.Ranged:
      return {
        toHit: "dexterity",
        damage: "dexterity",
        dodge: "dexterity",
      };
      break;
    case AttackType.Melee:
    default:
      return {
        toHit: "strength",
        damage: "strength",
        dodge: "constitution",
      };
      break;
  }
}

type CombatGear = {
  level: number;
  enchantment?: EnchantmentType | null;
};
type QuestItem = {
  name: string;
  baseItem: string;
};
export type Combatant = {
  equipment: {
    armor: CombatGear[];
    weapons: CombatGear[];
    quests: QuestItem[];
  };
  attributes: HeroStats;
  damageReduction: number;
  luck: {
    smallModifier: number;
    largeModifier: number;
    ultraModifier: number;
  };
};

export function didHit(
  attackerInput: Combatant,
  attackType: AttackType,
  victimInput: Combatant
): boolean {
  const attackAttributes = attributesForAttack(attackType);

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput
  );

  // rarely massive, 1 when even, 0.5 when dodge is double, etc
  // "how many times bigger is attack than dodge"
  const baseChange =
    attacker.attributes[attackAttributes.toHit] /
    victim.attributes[attackAttributes.dodge];

  const oddBase = ((baseChange - 1) / baseChange + 1) / 2;

  if (oddBase < 0) {
    // attacker has less than half the attackers dodge stat
    return Math.random() * Math.random() * Math.random() * 100 + oddBase > 0;
  }

  return Math.random() < oddBase;
}

type EnchantedCombatant = Combatant & {
  percentageDamageIncrease: number;
  percentageDamageReduction: number;
  enchanted: true;
};

export function getEnchantedAttributes(
  attackerInput: Combatant,
  victimInput: Combatant
): { attacker: EnchantedCombatant; victim: EnchantedCombatant } {
  let attacker = attackerInput as EnchantedCombatant;
  let victim = victimInput as EnchantedCombatant;
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

  victim.attributes = { ...victim.attributes };
  victim.percentageDamageIncrease = victim.percentageDamageIncrease ?? 1;
  victim.percentageDamageReduction = victim.percentageDamageReduction ?? 1;
  victim.enchanted = true;

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
      case EnchantmentType.BonusCharisma:
        attacker.attributes.charisma *= 1.2;
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
        attacker.attributes.charisma *= 1.1;
        break;
      case EnchantmentType.BonusAllStats:
        attacker.attributes.strength *= 1.1;
        attacker.attributes.dexterity *= 1.1;
        attacker.attributes.constitution *= 1.1;
        attacker.attributes.intelligence *= 1.1;
        attacker.attributes.wisdom *= 1.1;
        attacker.attributes.charisma *= 1.1;
        break;

      case EnchantmentType.MinusEnemyArmor:
        victim.percentageDamageReduction *= 0.8;
        break;
      case EnchantmentType.BonusArmor:
        attacker.percentageDamageIncrease *= 1.2;
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
      case EnchantmentType.MinusEnemyCharisma:
        victim.attributes.charisma *= 0.8;
        break;
      case EnchantmentType.MinusEnemyPhysical:
        victim.attributes.strength *= 0.9;
        victim.attributes.dexterity *= 0.9;
        victim.attributes.constitution *= 0.9;
        break;
      case EnchantmentType.MinusEnemyMental:
        victim.attributes.intelligence *= 0.9;
        victim.attributes.wisdom *= 0.9;
        victim.attributes.charisma *= 0.9;
        break;
      case EnchantmentType.MinusEnemyAllStats:
        victim.attributes.strength *= 0.9;
        victim.attributes.dexterity *= 0.9;
        victim.attributes.constitution *= 0.9;
        victim.attributes.intelligence *= 0.9;
        victim.attributes.wisdom *= 0.9;
        victim.attributes.charisma *= 0.9;
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
      case EnchantmentType.FishermansCharisma:
        attacker.attributes.charisma *= 1.5;
        break;
      case EnchantmentType.FishermansLuck:
        attacker.attributes.luck *= 1.5;
        break;
    }
  });

  return { attacker, victim };
}

function calculateDamage(
  attackerInput: Combatant,
  attackType: AttackType,
  victimInput: Combatant
): { damage: number; critical: boolean } {
  let damage = 0;
  let critical = false;

  const { attacker, victim } = getEnchantedAttributes(
    attackerInput,
    victimInput
  );

  const attributeTypes = attributesForAttack(attackType);

  let percentageDamageReduction = 1;
  let percentageDamageIncrease = attacker.percentageDamageIncrease;

  victim.equipment.armor.forEach((armor) => {
    percentageDamageReduction =
      percentageDamageReduction * (1 - armor.level / (armor.level + 20));
  });

  // "amounr of armor" reduced, then turned back into inverse
  percentageDamageReduction =
    1 - (1 - percentageDamageReduction) * victim.percentageDamageReduction;

  attacker.equipment.weapons.forEach((weapon) => {
    percentageDamageIncrease =
      percentageDamageIncrease *
      (1 + (weapon.level / (weapon.level + 40)) * Math.pow(1.1, weapon.level));
  });

  // melee does double damage
  // if (attackType === AttackType.Melee) {
  //   percentageDamageIncrease *= 2;
  // }

  // holy ignores half of armor
  // if (attackType === AttackType.Holy) {
  //   percentageDamageReduction += (1 - percentageDamageReduction) / 2;
  // }

  // console.log(
  //   "base damage",
  //   attacker.attributes[attributeTypes.damage],
  //   percentageDamageIncrease,
  //   "against DR",
  //   victim.damageReduction,
  //   "%DR",
  //   percentageDamageReduction
  // );

  // console.log(
  //   "Base result is",
  //   attacker.attributes[attributeTypes.damage] *
  //     percentageDamageIncrease *
  //     percentageDamageReduction -
  //     victim.damageReduction
  // );

  damage =
    (1.2 - Math.random() * (1 - attacker.luck.smallModifier)) *
    attacker.attributes[attributeTypes.damage];

  critical = Math.random() < attacker.luck.largeModifier;
  if (critical) {
    damage = damage * 3;
    if (Math.random() < attacker.luck.ultraModifier) {
      damage = damage * 3;
    }
  }

  damage *= percentageDamageIncrease;
  damage -= victim.damageReduction;
  damage *= percentageDamageReduction;

  damage = Math.round(Math.max(1, Math.min(1000000000, damage)));

  return {
    damage,
    critical,
  };
}

function addItemToCombatant(
  combatant: Combatant,
  item: InventoryItem,
  attackType: AttackType
): Combatant {
  const affectsAttackType = doesWeaponAffectAttack(item, attackType);

  if (
    item.type === InventoryItemType.MeleeWeapon ||
    item.type === InventoryItemType.RangedWeapon
  ) {
    combatant.equipment.weapons.push({
      level: affectsAttackType ? item.level : 1,
      enchantment: item.enchantment,
    });
  } else {
    combatant.equipment.armor.push({
      level: item.level,
      enchantment: item.enchantment,
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
    case AttackType.Holy:
      if (
        weapon.type === InventoryItemType.MeleeWeapon ||
        weapon.type === InventoryItemType.RangedWeapon
      ) {
        return false;
      }
      break;
    case AttackType.Wizard:
      if (
        weapon.type === InventoryItemType.MeleeWeapon ||
        weapon.type === InventoryItemType.RangedWeapon
      ) {
        return false;
      }
      break;
    case AttackType.Elemental:
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
  const heroCombatant = {
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

  return heroCombatant;
}

export async function fightMonster(
  hero: Hero,
  monsterInstance: MonsterInstance,
  attackType: AttackType
): Promise<MonsterHeroCombatResult> {
  const { monster } = monsterInstance;
  const battleResults: CombatEntry[] = [];
  const heroAttackType = attackType;
  const heroAttributeTypes = attributesForAttack(heroAttackType);
  const heroAttributes = hero.stats;
  const monsterAttributes = createMonsterStats(monster);
  const heroCombatant = createHeroCombatant(hero, heroAttackType);

  const monsterCombatant = {
    equipment: createMonsterEquipment(monster),
    damageReduction: monsterAttributes.constitution / 2,
    attributes: monsterAttributes,
    luck: createMonsterLuck(monster),
  };

  const heroDidHit = didHit(heroCombatant, heroAttackType, monsterCombatant);
  let heroDamage = 0;

  if (heroDidHit) {
    const { damage, critical } = calculateDamage(
      heroCombatant,
      heroAttackType,
      monsterCombatant
    );
    heroDamage = damage;

    battleResults.push({
      attackType: heroAttackType,
      success: true,
      from: hero.name,
      to: monster.name,
      damage,
      critical,
    });

    console.log(
      hero.name,
      `(${hero.level})`,
      critical ? "crit" : "dealt",
      heroDamage,
      "to",
      monster.name,
      `(${monster.level})`,
      "with",
      heroAttackType
    );
  } else {
    battleResults.push({
      attackType: heroAttackType,
      damage: 0,
      success: false,
      from: hero.name,
      to: monster.name,
      critical: false,
    });
  }

  const monsterAttributeTypes = attributesForAttack(monster.attackType);
  const monsterDidHit =
    heroDamage < monster.combat.health &&
    didHit(monsterCombatant, monster.attackType, heroCombatant);

  let monsterDamage = 0;

  if (monsterDidHit) {
    const { damage, critical } = calculateDamage(
      monsterCombatant,
      monster.attackType,
      heroCombatant
    );
    monsterDamage = damage;

    battleResults.push({
      attackType: monster.attackType,
      success: true,
      from: monster.name,
      to: hero.name,
      critical,
      damage,
    });
    console.log(
      monster.name,
      `(${monster.level})`,
      critical ? "dealt" : "crit",
      monsterDamage,
      "to",
      hero.name,
      `(${hero.level})`,
      "with",
      monster.attackType
    );
  } else {
    battleResults.push({
      attackType: monster.attackType,
      damage: 0,
      success: false,
      from: monster.name,
      to: hero.name,
      critical: false,
    });
  }

  return {
    monsterDamage: monsterDamage,
    heroDamage: heroDamage,
    monsterDied: heroDamage >= monster.combat.health,
    heroDied: monsterDamage >= hero.combat.health,
    log: battleResults,
  };
}
