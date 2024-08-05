import { AttackType } from "types/graphql";
import { Modifier } from "./modifier";

export class BasicMobModifier extends Modifier<undefined> {
  getBonus(prop: string): number | void {
    switch (prop) {
      case "physicalResistance":
      case "magicalResistance":
      case "fireResistance":
      case "iceResistance":
      case "lightningResistance":
      case "holyResistance":
      case "blightResistance":
        return 0.01 * this.parent.stats.level;
    }
    return;
  }
  getMultiplier(prop: string): number | void {
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}
