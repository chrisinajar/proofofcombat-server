import Databases from "../db";
// forward export moved function
export { attributesForAttack } from "./constants";

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
