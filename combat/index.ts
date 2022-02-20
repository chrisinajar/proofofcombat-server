import {
  Hero,
  MonsterInstance,
  Monster,
  CombatEntry,
  AttackType,
  HeroStats,
  Attributes,
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
    strength: monster.combat.maxHealth,
    dexterity: monster.combat.maxHealth,
    constitution: monster.combat.maxHealth,
    intelligence: monster.combat.maxHealth,
    wisdom: monster.combat.maxHealth,
    charisma: monster.combat.maxHealth,
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

// D20 needs to scale with stats, these values will enter the 10's of thousands, if not millions
function didHit(
  attacker: Attributes,
  attackType: AttackType,
  victim: Attributes
): boolean {
  const attackAttributes = attributesForAttack(attackType);

  // rarely massive, 1 when even, 0.5 when dodge is double, etc
  // "how many times bigger is attack than dodge"
  const baseChange =
    attacker[attackAttributes.toHit] / victim[attackAttributes.dodge];

  const oddBase = ((baseChange - 1) / baseChange + 1) / 2;

  if (oddBase < 0) {
    // attacker has less than half the attackers dodge stat
    return Math.random() * Math.random() * Math.random() * 100 + oddBase > 0;
  }

  return Math.random() < oddBase;
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
  const heroDidHit = didHit(heroAttributes, heroAttackType, monsterAttributes);
  let heroDamage = 0;

  if (heroDidHit) {
    heroDamage = Math.round(
      randomNumber(1, 5) *
        Math.max(1, hero.stats[heroAttributeTypes.damage] - monster.level)
    );
    battleResults.push({
      attackType: heroAttackType,
      damage: heroDamage,
      success: true,
      from: hero.name,
      to: monster.name,
    });

    console.log(
      hero.name,
      `(${hero.level})`,
      "dealt",
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
    });
  }

  const attackOptions = [
    AttackType.Melee,
    AttackType.Ranged,
    AttackType.Wizard,
    AttackType.Elemental,
    AttackType.Blood,
    AttackType.Holy,
  ];
  const monsterAttackType = attackOptions[monster.level % attackOptions.length];
  const monsterAttributeTypes = attributesForAttack(monsterAttackType);
  const monsterDidHit =
    heroDamage < monster.combat.health &&
    didHit(monsterAttributes, monsterAttackType, heroAttributes);

  let monsterDamage = 0;

  if (monsterDidHit) {
    monsterDamage = Math.round(
      randomNumber(1, 5) *
        Math.max(
          1,
          monsterAttributes[monsterAttributeTypes.damage] - hero.level
        )
    );

    battleResults.push({
      attackType: monsterAttackType,
      damage: monsterDamage,
      success: true,
      from: monster.name,
      to: hero.name,
    });
    console.log(
      monster.name,
      `(${monster.level})`,
      "dealt",
      monsterDamage,
      "to",
      hero.name,
      `(${hero.level})`,
      "with",
      monsterAttackType
    );
  } else {
    battleResults.push({
      attackType: monsterAttackType,
      damage: 0,
      success: false,
      from: monster.name,
      to: hero.name,
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
