import { AttackType } from "types/graphql";
import { AttackAttributes } from "./types";

import Databases from "../db";

export function getItemPassiveUpgradeTier({
  baseItem,
  level,
}: {
  baseItem?: string;
  level: number;
}): number {
  if (baseItem?.length) {
    if (level > 33) {
      return 2;
    }
    if (level > 32) {
      return 1;
    }
  }
  return 0;
}

export function createLuck(luck: number): {
  smallModifier: number;
  largeModifier: number;
  ultraModifier: number;
} {
  return {
    smallModifier: Databases.hero.smallLuck(luck),
    largeModifier: Databases.hero.largeLuck(luck),
    ultraModifier: Databases.hero.ultraLuck(luck),
  };
}

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
