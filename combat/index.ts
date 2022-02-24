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
type Attribute = keyof Attributes;
type AttackAttributes = {
  toHit: Attribute;
  damage: Attribute;
  dodge: Attribute;
};

function createMonsterStats(monster: Monster): Attributes {
  console.log(monster.name, "has", monster.combat.maxHealth - 5, "stats");
  return {
    strength: monster.combat.maxHealth - 5,
    dexterity: monster.combat.maxHealth - 5,
    constitution: monster.combat.maxHealth - 5,
    intelligence: monster.combat.maxHealth - 5,
    wisdom: monster.combat.maxHealth - 5,
    charisma: monster.combat.maxHealth - 5,
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
type Combatant = {
  equipment: {
    armor: CombatGear[];
    weapons: CombatGear[];
    quests: QuestItem[];
  };
  attributes: Attributes;
  damageReduction: number;
  luck: {
    smallModifier: number;
    largeModifier: number;
    ultraModifier: number;
  };
};

// D20 needs to scale with stats, these values will enter the 10's of thousands, if not millions
function didHit(
  attacker: Combatant,
  attackType: AttackType,
  victim: Combatant
): boolean {
  const attackAttributes = attributesForAttack(attackType);

  const enchantedStats = getEnchantedAttributes(attacker, victim);
  attacker = enchantedStats.attacker;
  victim = enchantedStats.victim;

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
  enchanted?: true;
};

function getEnchantedAttributes(
  attacker: EnchantedCombatant,
  victim: EnchantedCombatant
): { attacker: EnchantedCombatant; victim: EnchantedCombatant } {
  if (!attacker.enchanted) {
    attacker = enchantAttacker(attacker, victim);
  }
  if (!victim.enchanted) {
    victim = enchantVictim(attacker, victim);
  }

  return { attacker, victim };
}

function enchantVictim(
  attacker: EnchantedCombatant,
  victim: EnchantedCombatant
): EnchantedCombatant {
  // symmetrical right now!
  return enchantAttacker(victim, attacker);
}

function enchantAttacker(
  attacker: EnchantedCombatant,
  victim: EnchantedCombatant
): EnchantedCombatant {
  if (attacker.enchanted) {
    return attacker;
  }
  attacker = {
    ...attacker,
    attributes: { ...attacker.attributes },
    enchanted: true,
  };

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
        attacker.luck.smallModifier = (attacker.luck.smallModifier * 5 + 1) / 6;
        attacker.luck.largeModifier =
          (attacker.luck.smallModifier * 10 + 1) / 11;
        attacker.luck.ultraModifier =
          (attacker.luck.smallModifier * 50 + 1) / 51;
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
        attacker.luck.smallModifier = (attacker.luck.smallModifier * 5 + 1) / 6;
        attacker.luck.largeModifier =
          (attacker.luck.smallModifier * 10 + 1) / 11;
        attacker.luck.ultraModifier =
          (attacker.luck.smallModifier * 50 + 1) / 51;
        break;
    }
  });

  return attacker;
}

function calculateDamage(
  attacker: Combatant,
  attackType: AttackType,
  victim: Combatant
): { damage: number; critical: boolean } {
  let damage = 0;
  let critical = false;
  const attributeTypes = attributesForAttack(attackType);
  let percentageDamageReduction = 1;
  let percentageDamageIncrease = 1;

  victim.equipment.armor.forEach((armor) => {
    percentageDamageReduction =
      percentageDamageReduction * (1 - armor.level / (armor.level + 20));
  });

  attacker.equipment.weapons.forEach((weapon) => {
    percentageDamageIncrease =
      percentageDamageIncrease *
      (1 + (weapon.level / (weapon.level + 40)) * Math.pow(1.1, weapon.level));
  });

  const enchantedStats = getEnchantedAttributes(attacker, victim);
  attacker = enchantedStats.attacker;
  victim = enchantedStats.victim;

  // melee does double damage
  if (attackType === AttackType.Melee) {
    percentageDamageIncrease *= 2;
  }

  // holy ignores half of armor
  if (attackType === AttackType.Holy) {
    percentageDamageReduction += (1 - percentageDamageReduction) / 2;
  }

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

  const smallLuckModifier = Databases.hero.smallLuck(heroAttributes.luck);
  const largeLuckModifier = Databases.hero.largeLuck(heroAttributes.luck);
  const ultraLuckModifier = Databases.hero.ultraLuck(heroAttributes.luck);

  const heroCombatant = {
    equipment: {
      armor: [],
      weapons: [],
      quests: hero.inventory.filter((i) => i.type === InventoryItemType.Quest),
    },
    damageReduction: hero.level,
    attributes: heroAttributes,
    luck: {
      smallModifier: smallLuckModifier,
      largeModifier: largeLuckModifier,
      ultraModifier: ultraLuckModifier,
    },
  };

  if (hero.equipment.leftHand) {
    addItemToCombatant(heroCombatant, hero.equipment.leftHand, heroAttackType);
  }
  if (hero.equipment.rightHand) {
    addItemToCombatant(heroCombatant, hero.equipment.rightHand, heroAttackType);
  }
  if (hero.equipment.bodyArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.bodyArmor, heroAttackType);
  }
  if (hero.equipment.handArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.handArmor, heroAttackType);
  }
  if (hero.equipment.legArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.legArmor, heroAttackType);
  }
  if (hero.equipment.headArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.headArmor, heroAttackType);
  }
  if (hero.equipment.footArmor) {
    addItemToCombatant(heroCombatant, hero.equipment.footArmor, heroAttackType);
  }

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
