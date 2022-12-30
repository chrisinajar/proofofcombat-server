import { Modifier } from "./modifier";
import { registerModifier } from "./index";

class BasicUnitModifier extends Modifier {
  getBonus(prop: string): number | void {
    return;
  }
  getMultiplier(prop: string): number | void {
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}

registerModifier("BasicUnitModifier", BasicUnitModifier);
