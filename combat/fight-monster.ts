import {
  AttackType,
  HeroClasses,
  MonsterInstance,
  InventoryItemType,
  CombatEntry,
  Hero,
} from "types/graphql";
import { attributesForAttack } from "./helpers";
import { CombatResult } from "./types";
import { createHeroCombatant } from "./hero";
import { getEnchantedAttributes } from "./enchantments";
import { calculateEnchantmentDamage } from "./calculate-enchantment-damage";
import { attackCombatant } from "./fight";
import { createMonsterCombatant } from "./monster";

export async function fightMonster(
  hero: Hero,
  monsterInstance: MonsterInstance,
  attackType: AttackType
): Promise<CombatResult> {
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
    monster.attackType,
    equipment
  );

  const enchantmentBattle = calculateEnchantmentDamage(
    heroCombatant,
    monsterCombatant
  );
  let heroDamage = 0;

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
    const heroAttack = attackCombatant(heroCombatant, monsterCombatant);
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
    const monsterAttack = attackCombatant(monsterCombatant, heroCombatant);

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
    attackerEnchantmentDamage: enchantmentBattle.attackerDamage,
    victimEnchantmentDamage: enchantmentBattle.victimDamage,
    victimHeal: enchantmentBattle.victimHeal,
    attackerHeal: enchantmentBattle.attackerHeal,
    attackerDamage: monsterDamage,
    victimDamage: heroDamage,
    victimDied: totalDamageAgainstMonster >= monster.combat.health,
    attackerDied: totalDamageAgainstHero >= hero.combat.health,
    log: battleResults,
  };
}
