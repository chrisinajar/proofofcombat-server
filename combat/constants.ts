import { AttackType } from "types/graphql";

import { AttackAttributes } from "./types";

export const BASE_ATTACK_SPEED = 1500; // 1.5 seconds
export const BASE_MONSTER_SPEED = 1600; // just barely slower
export const COMBAT_DURATION = BASE_ATTACK_SPEED * 2;
export const ENCHANTMENT_INTERVAL = COMBAT_DURATION - 10; // enchantment timing is from the end instead of the beginning

export function attributesForAttack(attackType: AttackType): AttackAttributes {
  switch (attackType) {
    case AttackType.Blood:
      return {
        toHit: "constitution",
        damage: "constitution",
        dodge: "constitution",
        damageReduction: "willpower",
      };
      break;
    case AttackType.Smite:
      return {
        toHit: "wisdom",
        damage: "willpower",
        dodge: "wisdom",
        damageReduction: "willpower",
      };
      break;
    case AttackType.Cast:
      return {
        toHit: "wisdom",
        damage: "intelligence",
        dodge: "wisdom",
        damageReduction: "willpower",
      };
      break;
    case AttackType.Ranged:
      return {
        toHit: "dexterity",
        damage: "dexterity",
        dodge: "dexterity",
        damageReduction: "willpower",
      };
      break;
    case AttackType.Melee:
    default:
      return {
        toHit: "dexterity",
        damage: "strength",
        dodge: "dexterity",
        damageReduction: "willpower",
      };
      break;
  }
}
