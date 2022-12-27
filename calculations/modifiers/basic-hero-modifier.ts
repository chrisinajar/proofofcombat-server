import { Modifier } from "./modifier";
import { registerModifier } from "./index";

class BasicHeroModifier extends Modifier {
  getBonus(prop: string): number | void {
    return;
  }
  getMultiplier(prop: string): number | void {
    switch (prop) {
      case "health":
        if (!this.parent.stats.vitality) {
          return;
        }
        return Math.pow(1.08, this.parent.stats.vitality);
    }
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}

registerModifier("BasicHeroModifier", BasicHeroModifier);
