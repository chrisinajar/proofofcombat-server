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
import { ENCHANTMENT_INTERVAL } from "./constants";

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

export function executeFight(
  attackerCombatant: Combatant,
  victimCombatant: Combatant,
  duration: number = 4000,
  result?: CombatResult,
): CombatResult {
  if (!result) {
    result = {
      attackerCombatant,
      victimCombatant,
      // enchantment damage dealt to attacker
      attackerEnchantmentDamage: 0,
      // enchantment damage dealt to victim
      victimEnchantmentDamage: 0,
      // how much the victim healed
      victimHeal: 0,
      // how much the attacker healed
      attackerHeal: 0,
      // how much damage was dealt to the attacker
      attackerDamage: 0,
      // how much damage was dealt to the victim
      victimDamage: 0,

      victimDied: false,
      attackerDied: false,
      victimIsMesmerized: false,
      attackerIsMesmerized: false,
      victimIsDead: false,
      attackerIsDead: false,
      log: [],
    };
  }

  // clean up just in case
  if (attackerCombatant.attackSpeedRemainder > attackerCombatant.attackSpeed) {
    attackerCombatant.attackSpeedRemainder =
      attackerCombatant.attackSpeedRemainder % attackerCombatant.attackSpeed;
  }
  if (victimCombatant.attackSpeedRemainder > victimCombatant.attackSpeed) {
    victimCombatant.attackSpeedRemainder =
      victimCombatant.attackSpeedRemainder % victimCombatant.attackSpeed;
  }

  let attackerNextAttack =
    attackerCombatant.attackSpeed - attackerCombatant.attackSpeedRemainder;
  let victimNextAttack =
    victimCombatant.attackSpeed - victimCombatant.attackSpeedRemainder;
  const enchantmentNextAttack = duration % ENCHANTMENT_INTERVAL;

  result.attackerIsDead =
    result.attackerDamage +
      result.attackerEnchantmentDamage -
      result.attackerHeal >=
    attackerCombatant.health;

  result.victimIsDead =
    result.victimDamage + result.victimEnchantmentDamage - result.victimHeal >=
    victimCombatant.health;

  if (result.attackerIsDead || result.victimIsDead) {
    // one of them is dead, no need to continue
    attackerCombatant.attackSpeedRemainder = 0;
    victimCombatant.attackSpeedRemainder = 0;
    return result;
  }

  if (duration < attackerNextAttack && duration < victimNextAttack) {
    // no one can attack
    // use the rest of the duration up
    attackerCombatant.attackSpeedRemainder += duration;
    victimCombatant.attackSpeedRemainder += duration;

    return result;
  }

  const { attacker: enchantedAttacker, victim: enchantedVictim } =
    getEnchantedAttributes(attackerCombatant, victimCombatant);

  if (
    enchantmentNextAttack > 0 &&
    enchantmentNextAttack < attackerNextAttack &&
    enchantmentNextAttack < victimNextAttack
  ) {
    // enchantment damage time
    const enchantmentBattle = calculateEnchantmentDamage(
      attackerCombatant,
      victimCombatant,
    );

    const attackerDidMesmerize =
      Math.random() > enchantedAttacker.mesmerizeChance;
    const victimDidMesmerize = Math.random() > enchantedVictim.mesmerizeChance;
    const attackerDidFocus = Math.random() > enchantedAttacker.focusChance;
    const victimDidFocus = Math.random() > enchantedVictim.focusChance;

    result.attackerIsMesmerized = !attackerDidFocus && victimDidMesmerize;
    result.victimIsMesmerized = !victimDidFocus && attackerDidMesmerize;

    // negate enchantment battle if they were mesmerized
    if (result.attackerIsMesmerized) {
      result.log.push({
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
    } else {
      if (enchantmentBattle.victimDamage > 0) {
        result.log.push({
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
        result.log.push({
          attackType: attackerCombatant.attackType,
          success: true,
          isEnchantment: true,
          from: attackerCombatant.name,
          to: attackerCombatant.name,
          damage: 0 - enchantmentBattle.attackerHeal,
          critical: false,
        });
      }
    }
    if (result.victimIsMesmerized) {
      result.log.push({
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
    } else {
      if (enchantmentBattle.attackerDamage > 0) {
        result.log.push({
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
        result.log.push({
          attackType: victimCombatant.attackType,
          success: true,
          isEnchantment: true,
          from: victimCombatant.name,
          to: victimCombatant.name,
          damage: 0 - enchantmentBattle.victimHeal,
          critical: false,
        });
      }
    }

    result.attackerEnchantmentDamage += enchantmentBattle.attackerDamage;
    result.victimEnchantmentDamage += enchantmentBattle.victimDamage;
    result.victimHeal += enchantmentBattle.victimHeal;
    result.attackerHeal += enchantmentBattle.attackerHeal;

    duration -= enchantmentNextAttack;
    attackerCombatant.attackSpeedRemainder += enchantmentNextAttack;
    victimCombatant.attackSpeedRemainder += enchantmentNextAttack;

    // short circuit for enchantment before attacks start
    return executeFight(attackerCombatant, victimCombatant, duration, result);
  }

  if (attackerNextAttack > 0 && attackerNextAttack <= victimNextAttack) {
    // do attacker attack

    if (!result.attackerIsMesmerized && !result.attackerIsDead) {
      const attackerAttack = attackCombatant(
        attackerCombatant,
        victimCombatant,
      );

      result.victimDamage += attackerAttack.damage;
      if (attackerAttack.overDamage > 0 && result.victimHeal > 0) {
        // reduce healing with overdamage
        result.victimHeal = Math.max(
          0,
          result.victimHeal - Math.round(attackerAttack.overDamage / 2),
        );
      }

      const bloodMageDamage =
        attackerCombatant.class === HeroClasses.BloodMage ||
        attackerCombatant.class === HeroClasses.Vampire
          ? attackerCombatant.health * 0.01
          : attackerCombatant.health * 0.05;

      result.victimDamage +=
        attackerCombatant.attackType === AttackType.Blood ? bloodMageDamage : 0;

      result.log = result.log.concat(attackerAttack.combatLog);
    }

    const attackHasTwoAttacks = hasTwoAttacks(attackerCombatant);

    duration -= attackerNextAttack;
    // double cooldown when you don't have "two attacks"
    attackerCombatant.attackSpeedRemainder = attackHasTwoAttacks
      ? 0
      : 0 - attackerCombatant.attackSpeed;
    victimCombatant.attackSpeedRemainder += attackerNextAttack;
  } else if (victimNextAttack > 0) {
    // do victim attack
    if (!result.victimIsMesmerized && !result.victimIsDead) {
      const victimAttack = attackCombatant(victimCombatant, attackerCombatant);

      result.attackerDamage += victimAttack.damage;
      if (victimAttack.overDamage > 0 && result.attackerHeal > 0) {
        // reduce healing with overdamage
        result.attackerHeal = Math.max(
          0,
          result.attackerHeal - Math.round(victimAttack.overDamage / 2),
        );
      }

      if (victimCombatant.class !== HeroClasses.Monster) {
        const bloodMageDamage =
          victimCombatant.class === HeroClasses.BloodMage ||
          victimCombatant.class === HeroClasses.Vampire
            ? victimCombatant.health * 0.01
            : victimCombatant.health * 0.05;

        result.attackerDamage +=
          victimCombatant.attackType === AttackType.Blood ? bloodMageDamage : 0;
      }
      result.log = result.log.concat(victimAttack.combatLog);
    }

    const victimHasTwoAttacks = hasTwoAttacks(victimCombatant);

    duration -= victimNextAttack;
    attackerCombatant.attackSpeedRemainder += victimNextAttack;
    // double cooldown when you don't have "two attacks"
    victimCombatant.attackSpeedRemainder = victimHasTwoAttacks
      ? 0
      : 0 - victimCombatant.attackSpeed;
  } else {
    console.error("Failed to figure out next action in combat", {
      duration,
      attackerNextAttack,
      victimNextAttack,
      enchantmentNextAttack,
    });
  }

  return executeFight(attackerCombatant, victimCombatant, duration, result);
}

type AttackCombcatantResult = {
  hit: boolean;
  damage: number;
  overDamage: number;
  critical: boolean;
  doubleCritical: boolean;
  combatLog: CombatEntry[];
};

export function attackCombatant(
  attacker: Combatant,
  victim: Combatant,
  isSecondAttack: boolean = false,
): AttackCombcatantResult {
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
  let overDamage = 0;
  let critical = false;
  let doubleCritical = false;
  const combatLog: CombatEntry[] = [];

  if (hit) {
    const damageResult = calculateDamage(attacker, victim, isSecondAttack);
    overDamage = damageResult.overDamage;
    critical = damageResult.critical;
    doubleCritical = damageResult.doubleCritical;

    for (let damageEntry of damageResult.damages) {
      damage += damageEntry.damage;
      combatLog.push({
        attackType: attackType,
        success: true,
        isEnchantment: false,
        from: attacker.name,
        to: victim.name,
        critical,
        ...damageEntry,
      });
    }

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
    overDamage,
    critical,
    doubleCritical,
    combatLog,
  };
}
