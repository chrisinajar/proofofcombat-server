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

  // negate enchantment battle if they were mesmerized
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

  let attackerIsDead =
    enchantmentBattle.attackerDamage - enchantmentBattle.attackerHeal >=
    attackerCombatant.health;

  let victimIsDead =
    enchantmentBattle.victimDamage - enchantmentBattle.victimHeal >=
    victimCombatant.health;

  let victimDamage = 0;
  let attackerAttack: AttackCombcatantResult | false = false;
  let victimAttack: AttackCombcatantResult | false = false;
  let secondAttackerAttack: AttackCombcatantResult | false = false;
  let secondVictimAttack: AttackCombcatantResult | false = false;

  // attacker attacks victim first
  if (!attackerIsMesmerized && !attackerIsDead) {
    attackerAttack = attackCombatant(attackerCombatant, victimCombatant);

    attackerDamage += attackerAttack.damage;
    if (attackerAttack.overDamage > 0 && enchantmentBattle.victimHeal > 0) {
      // reduce healing with overdamage
      enchantmentBattle.victimHeal = Math.max(
        0,
        enchantmentBattle.victimHeal -
          Math.round(attackerAttack.overDamage / 2),
      );
    }

    const bloodMageDamage =
      attackerCombatant.class === HeroClasses.BloodMage ||
      attackerCombatant.class === HeroClasses.Vampire
        ? attackerCombatant.health * 0.01
        : attackerCombatant.health * 0.05;

    victimDamage +=
      attackerCombatant.attackType === AttackType.Blood ? bloodMageDamage : 0;
  }

  victimIsDead =
    enchantmentBattle.victimDamage -
      enchantmentBattle.victimHeal +
      attackerDamage >=
    victimCombatant.health;

  if (!victimIsMesmerized && !victimIsDead) {
    victimAttack = attackCombatant(victimCombatant, attackerCombatant);

    victimDamage += victimAttack.damage;
    if (victimAttack.overDamage > 0 && enchantmentBattle.attackerHeal > 0) {
      // reduce healing with overdamage
      enchantmentBattle.attackerHeal = Math.max(
        0,
        enchantmentBattle.attackerHeal -
          Math.round(victimAttack.overDamage / 2),
      );
    }

    if (victimCombatant.class !== HeroClasses.Monster) {
      const bloodMageDamage =
        victimCombatant.class === HeroClasses.BloodMage ||
        victimCombatant.class === HeroClasses.Vampire
          ? victimCombatant.health * 0.01
          : victimCombatant.health * 0.05;

      attackerDamage +=
        victimCombatant.attackType === AttackType.Blood ? bloodMageDamage : 0;
    }
  }

  attackerIsDead =
    enchantmentBattle.attackerDamage -
      enchantmentBattle.attackerHeal +
      victimDamage >=
    attackerCombatant.health;

  if (
    !attackerIsMesmerized &&
    !attackerIsDead &&
    hasTwoAttacks(attackerCombatant)
  ) {
    secondAttackerAttack = attackCombatant(
      attackerCombatant,
      victimCombatant,
      true,
    );

    attackerDamage += secondAttackerAttack.damage;
    if (
      secondAttackerAttack.overDamage > 0 &&
      enchantmentBattle.victimHeal > 0
    ) {
      // reduce healing with overdamage
      enchantmentBattle.victimHeal = Math.max(
        0,
        enchantmentBattle.victimHeal -
          Math.round(secondAttackerAttack.overDamage / 2),
      );
    }
  }

  victimIsDead =
    enchantmentBattle.victimDamage -
      enchantmentBattle.victimHeal +
      attackerDamage >=
    victimCombatant.health;

  if (!victimIsMesmerized && !victimIsDead && hasTwoAttacks(victimCombatant)) {
    secondVictimAttack = attackCombatant(
      victimCombatant,
      attackerCombatant,
      true,
    );

    victimDamage += secondVictimAttack.damage;
    if (
      secondVictimAttack.overDamage > 0 &&
      enchantmentBattle.attackerHeal > 0
    ) {
      // reduce healing with overdamage
      enchantmentBattle.attackerHeal = Math.max(
        0,
        enchantmentBattle.attackerHeal -
          Math.round(secondVictimAttack.overDamage / 2),
      );
    }
  }

  if (attackerAttack) {
    battleResults = battleResults.concat(attackerAttack.combatLog);
  }
  if (victimAttack) {
    battleResults = battleResults.concat(victimAttack.combatLog);
  }
  if (secondAttackerAttack) {
    battleResults = battleResults.concat(secondAttackerAttack.combatLog);
  }
  if (secondVictimAttack) {
    battleResults = battleResults.concat(secondVictimAttack.combatLog);
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

    for (let damage of damageResult.damages) {
      combatLog.push({
        attackType: attackType,
        success: true,
        isEnchantment: false,
        from: attacker.name,
        to: victim.name,
        critical,
        ...damage,
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
