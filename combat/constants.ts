import { AttackType } from "types/graphql";

import { AttackAttributes } from "./types";

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
