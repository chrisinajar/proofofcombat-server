import {
  HeroClasses,
  AttackType,
  CombatEntry,
  InventoryItemType,
  EnchantmentType,
} from "types/graphql";

import { Combatant, CombatResult } from "./types";
import { calculateHit } from "./calculate-hit";
import { calculateDamage } from "./calculate-damage";
import { calculateEnchantmentDamage } from "./calculate-enchantment-damage";
import { getEnchantedAttributes } from "./enchantments";

function hasTwoAttacks(combatant: Combatant): boolean {
  let hasTwoAttacks = false;

  // mobs don't attack twice.
  if (combatant.class === HeroClasses.Monster) {
    return false;
  }

  if (combatant.equipment.weapons.length > 1) {
    // has two weapons, check their types...
    if (
      combatant.equipment.weapons[0].type !== InventoryItemType.RangedWeapon &&
      combatant.equipment.weapons[1].type !== InventoryItemType.RangedWeapon
    ) {
      // neither are ranged weapons
      // only other things that can go into weapon array are
      // spell focus, weapons, shield (paladin)
      // all of those are allowed to be combined, their levels are already set accordingly
      // level 0 means this weapon isn't appropriate for this attack
      // so we don't want them (weps are sorted)
      hasTwoAttacks = combatant.equipment.weapons[1].level !== 0;
    }
  }

  if (combatant.attackType === AttackType.Ranged) {
    // 0 = 1, goes *DOWN* from there
    hasTwoAttacks =
      Math.random() > combatant.unit.stats.rangedSecondAttackChance;
  }

  return hasTwoAttacks;
}

export async function executeFight(
  attackerCombatant: Combatant,
  victimCombatant: Combatant,
): Promise<CombatResult> {
  let battleResults: CombatEntry[] = [];

  const enchantmentBattle = calculateEnchantmentDamage(
    attackerCombatant,
    victimCombatant,
  );
  let attackerDamage = 0;

  const { attacker: enchantedAttacker, victim: enchantedVictim } =
    getEnchantedAttributes(attackerCombatant, victimCombatant);

  const attackerDidMesmerize =
    Math.random() > enchantedAttacker.mesmerizeChance;
  const victimDidMesmerize = Math.random() > enchantedVictim.mesmerizeChance;
  const attackerDidFocus = Math.random() > enchantedAttacker.focusChance;
  const victimDidFocus = Math.random() > enchantedVictim.focusChance;

  const attackerIsMesmerized = !attackerDidFocus && victimDidMesmerize;
  const victimIsMesmerized = !victimDidFocus && attackerDidMesmerize;

  if (attackerIsMesmerized) {
    battleResults.push({
      attackType: victimCombatant.attackType,
      success: true,
      isEnchantment: true,
      isMesmerize: true,
      from: victimCombatant.name,
      to: attackerCombatant.name,
      damage: 0,
      critical: false,
    });
    enchantmentBattle.victimDamage = 0;
    enchantmentBattle.attackerHeal = 0;
  }
  if (victimIsMesmerized) {
    battleResults.push({
      attackType: attackerCombatant.attackType,
      success: true,
      isEnchantment: true,
      isMesmerize: true,
      from: attackerCombatant.name,
      to: victimCombatant.name,
      damage: 0,
      critical: false,
    });
    enchantmentBattle.attackerDamage = 0;
    enchantmentBattle.victimHeal = 0;
  }

  if (enchantmentBattle.victimDamage > 0) {
    battleResults.push({
      attackType: attackerCombatant.attackType,
      success: true,
      isEnchantment: true,
      from: attackerCombatant.name,
      to: victimCombatant.name,
      damage: enchantmentBattle.victimDamage,
      critical: false,
    });
  }

  if (enchantmentBattle.attackerHeal > 0) {
    battleResults.push({
      attackType: attackerCombatant.attackType,
      success: true,
      isEnchantment: true,
      from: attackerCombatant.name,
      to: attackerCombatant.name,
      damage: 0 - enchantmentBattle.attackerHeal,
      critical: false,
    });
  }

  if (enchantmentBattle.attackerDamage > 0) {
    battleResults.push({
      attackType: victimCombatant.attackType,
      success: true,
      isEnchantment: true,
      from: victimCombatant.name,
      to: attackerCombatant.name,
      damage: enchantmentBattle.attackerDamage,
      critical: false,
    });
  }

  if (enchantmentBattle.victimHeal > 0) {
    battleResults.push({
      attackType: victimCombatant.attackType,
      success: true,
      isEnchantment: true,
      from: victimCombatant.name,
      to: victimCombatant.name,
      damage: 0 - enchantmentBattle.victimHeal,
      critical: false,
    });
  }

  if (
    !attackerIsMesmerized &&
    enchantmentBattle.attackerDamage - enchantmentBattle.attackerHeal <
      attackerCombatant.health
  ) {
    const attackerAttack = attackCombatant(attackerCombatant, victimCombatant);
    attackerDamage += attackerAttack.damage;
    battleResults = battleResults.concat(attackerAttack.combatLog);
  }

  const bloodMageDamage =
    attackerCombatant.class === HeroClasses.BloodMage ||
    attackerCombatant.class === HeroClasses.Vampire
      ? attackerCombatant.health * 0.01
      : attackerCombatant.health * 0.05;

  let victimDamage =
    attackerCombatant.attackType === AttackType.Blood ? bloodMageDamage : 0;

  if (
    !victimIsMesmerized &&
    enchantmentBattle.victimDamage -
      enchantmentBattle.victimHeal +
      attackerDamage <
      victimCombatant.health
  ) {
    const victimAttack = attackCombatant(victimCombatant, attackerCombatant);

    victimDamage += victimAttack.damage;
    battleResults = battleResults.concat(victimAttack.combatLog);
  }

  if (
    !attackerIsMesmerized &&
    enchantmentBattle.attackerDamage -
      enchantmentBattle.attackerHeal +
      victimDamage <
      attackerCombatant.health &&
    hasTwoAttacks(attackerCombatant)
  ) {
    const secondAttackerAttack = attackCombatant(
      attackerCombatant,
      victimCombatant,
      true,
    );
    attackerDamage += secondAttackerAttack.damage;
    battleResults = battleResults.concat(secondAttackerAttack.combatLog);
  }

  if (
    !victimIsMesmerized &&
    enchantmentBattle.victimDamage -
      enchantmentBattle.victimHeal +
      attackerDamage <
      victimCombatant.health &&
    hasTwoAttacks(victimCombatant)
  ) {
    const secondVictimAttack = attackCombatant(
      victimCombatant,
      attackerCombatant,
      true,
    );
    victimDamage += secondVictimAttack.damage;
    battleResults = battleResults.concat(secondVictimAttack.combatLog);
  }

  // do not allow overhealing
  victimDamage = Math.max(
    victimDamage,
    attackerCombatant.health - attackerCombatant.maxHealth,
  );
  attackerDamage = Math.max(
    attackerDamage,
    victimCombatant.health - victimCombatant.maxHealth,
  );

  const totalDamageAgainstHero =
    victimDamage +
    enchantmentBattle.attackerDamage -
    enchantmentBattle.attackerHeal;
  const totalDamageAgainstMonster =
    attackerDamage +
    enchantmentBattle.victimDamage -
    enchantmentBattle.victimHeal;

  return {
    attackerEnchantmentDamage: enchantmentBattle.attackerDamage,
    victimEnchantmentDamage: enchantmentBattle.victimDamage,
    victimHeal: enchantmentBattle.victimHeal,
    attackerHeal: enchantmentBattle.attackerHeal,
    // im sorry okay
    attackerDamage: victimDamage,
    victimDamage: attackerDamage,
    victimDied: totalDamageAgainstMonster >= victimCombatant.health,
    attackerDied: totalDamageAgainstHero >= attackerCombatant.health,
    log: battleResults,
  };
}

export function attackCombatant(
  attacker: Combatant,
  victim: Combatant,
  isSecondAttack: boolean = false,
): {
  hit: boolean;
  damage: number;
  critical: boolean;
  doubleCritical: boolean;
  combatLog: CombatEntry[];
} {
  let { attackType } = attacker;
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

  const hit = calculateHit(attacker, victim, isSecondAttack);
  let damage = 0;
  let critical = false;
  let doubleCritical = false;
  const combatLog: CombatEntry[] = [];

  if (hit) {
    const damageResult = calculateDamage(attacker, victim, isSecondAttack);
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
