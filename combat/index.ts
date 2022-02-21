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
} from "types/graphql";

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
  const smallModifier = monster.level / (monster.level + 2);
  // critical
  const largeModifier = monster.level / (monster.level + 10);
  // super crit
  const ultraModifier = monster.level / (monster.level + 15);

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
};
type Combatant = {
  equipment: {
    armor: CombatGear[];
    weapons: CombatGear[];
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

  percentageDamageReduction = victim.equipment.armor.reduce((dr, armor) => {
    return dr * (1 - armor.level / (armor.level + 20));
  }, percentageDamageReduction);

  percentageDamageIncrease = victim.equipment.weapons.reduce((amp, weapon) => {
    return (
      amp *
      (1 + (weapon.level / (weapon.level + 40)) * Math.pow(1.3, weapon.level))
    );
  }, percentageDamageIncrease);

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

  damage = Math.round(Math.max(1, damage));

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
  if (!doesWeaponAffectAttack(item, attackType)) {
    return combatant;
  }
  if (
    item.type === InventoryItemType.MeleeWeapon ||
    item.type === InventoryItemType.RangedWeapon
  ) {
    combatant.equipment.weapons.push({ level: item.level });
  } else {
    combatant.equipment.armor.push({ level: item.level });
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

  const smallLuckModifier = 1 - 5 / Math.max(5, heroAttributes.luck);
  const largeLuckModifier = 1 - 20 / Math.max(20, heroAttributes.luck);
  const ultraLuckModifier =
    largeLuckModifier * largeLuckModifier * largeLuckModifier;

  const heroCombatant = {
    equipment: {
      armor: [],
      weapons: [],
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
