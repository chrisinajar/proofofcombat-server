import { Hero, MonsterInstance, CombatEntry, AttackType } from "../types";

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

export async function fightMonster(
  hero: Hero,
  monsterInstance: MonsterInstance
): Promise<MonsterHeroCombatResult> {
  const { monster } = monsterInstance;
  const battleResults: CombatEntry[] = [];
  const heroAttackType = AttackType.Melee;
  const heroDidHit =
    hero.stats.strength + randomNumber(0, 20) > monster.level + 10;
  let heroDamage = 0;

  if (heroDidHit) {
    heroDamage = Math.round(
      randomNumber(1, 5) + Math.max(1, hero.stats.strength - monster.level)
    );
    battleResults.push({
      attackType: heroAttackType,
      damage: heroDamage,
      success: true,
      from: hero.name,
      to: monster.name,
    });
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
