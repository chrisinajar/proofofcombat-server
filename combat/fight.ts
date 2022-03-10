import {
  HeroClasses,
  AttackType,
  CombatEntry,
  InventoryItemType,
} from "types/graphql";

import { Combatant } from "./types";
import { calculateHit } from "./calculate-hit";
import { calculateDamage } from "./calculate-damage";

export function attackCombatant(
  attacker: Combatant,
  victim: Combatant,
  isSecondAttack: boolean = false
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
