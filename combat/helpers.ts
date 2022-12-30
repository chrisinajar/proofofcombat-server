import Databases from "../db";
// forward export moved function
export { attributesForAttack } from "./constants";

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
