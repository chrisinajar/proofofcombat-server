import { AttackType } from "types/graphql";
import { Modifier } from "./modifier";

export class BasicUnitModifier extends Modifier<undefined> {
  getBonus(prop: string): number | void {
    switch (prop) {
      case "physicalResistance":
      case "magicalResistance":
      case "fireResistance":
      case "iceResistance":
      case "lightningResistance":
        return this.parent.stats.allResistances;
    }

    return;
  }
  getMultiplier(prop: string): number | void {
    // // blood attacks deal additional enchantment damage!
    // if (attacker.attackType === AttackType.Blood) {
    //   victim.percentageEnchantmentDamageReduction *= 0.75;
    // }
    // // blood attacks deal additional enchantment damage!
    // if (victim.attackType === AttackType.Blood) {
    //   attacker.percentageEnchantmentDamageReduction *= 0.75;
    // }

    if (prop === "percentageEnchantmentDamageReduction") {
      if (
        this.parent.opponent &&
        this.parent.opponent.attackType === AttackType.Blood
      ) {
        return 0.75;
      }
    }
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}
