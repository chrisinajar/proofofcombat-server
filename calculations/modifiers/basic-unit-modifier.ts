import { Modifier } from "./modifier";
import { registerModifier } from "./index";

class BasicUnitModifier extends Modifier {
  getBonus(prop: string): number | void {
    switch (prop) {
      case "health":
        // old code:
        // hero.combat.health = Math.round(
        //   (hero.stats.constitution * 20 + hero.level * 20) * bonusHealth
        // );
        return (
          (this.parent.stats.constitution + this.parent.stats.level) * 20 -
          this.parent.baseValues.health
        );
      // Math.pow(1.08, this.parent.stats.vitality)
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

registerModifier("BasicUnitModifier", BasicUnitModifier);
