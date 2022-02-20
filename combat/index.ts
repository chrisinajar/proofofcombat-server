import {
  Hero,
  MonsterInstance,
  Monster,
  CombatEntry,
  AttackType,
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

function didHit(hero: Hero, attackType: AttackType, monster: Monster): boolean {
  switch (attackType) {
    case AttackType.Blood:
      return hero.stats.constitution + randomNumber(0, 20) > monster.level + 10;
      break;
    case AttackType.Holy:
      return hero.stats.charisma + randomNumber(0, 20) > monster.level + 10;
      break;
    case AttackType.Wizard:
      return hero.stats.intelligence + randomNumber(0, 20) > monster.level + 10;
      break;
    case AttackType.Elemental:
      return hero.stats.wisdom + randomNumber(0, 20) > monster.level + 10;
      break;
    case AttackType.Ranged:
      return hero.stats.dexterity + randomNumber(0, 20) > monster.level + 10;
      break;
    case AttackType.Melee:
    default:
      return hero.stats.strength + randomNumber(0, 20) > monster.level + 10;
      break;
  }
}

export async function fightMonster(
  hero: Hero,
  monsterInstance: MonsterInstance,
  attackType: AttackType
): Promise<MonsterHeroCombatResult> {
  const { monster } = monsterInstance;
  const battleResults: CombatEntry[] = [];
  const heroAttackType = attackType;
  const heroDidHit =
    hero.stats.strength + randomNumber(0, 20) > monster.level + 10;
  let heroDamage = 0;

  if (heroDidHit) {
    heroDamage = Math.round(
      randomNumber(1, 5) * Math.max(1, hero.stats.strength - monster.level)
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

  const monasterAttackType = AttackType.Melee;
  const monsterDidHit =
    heroDamage < monster.combat.health &&
    monster.level * 10 + randomNumber(0, 20) > hero.stats.dexterity;
  let monsterDamage = 0;

  if (monsterDidHit) {
    monsterDamage = Math.round(
      randomNumber(monster.level, monster.combat.maxHealth)
    );

    battleResults.push({
      attackType: monasterAttackType,
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
      monasterAttackType
    );
  } else {
    battleResults.push({
      attackType: monasterAttackType,
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
