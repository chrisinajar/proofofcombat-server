import { Modifier, ModifierOptions } from "./modifier";

export type GenericArmorModifierOptions = {
  // ? i dunno something like this
  tier: number;
  shield?: boolean;
  isDebuff?: boolean;
};

export class GenericArmorModifier extends Modifier<GenericArmorModifierOptions> {
  tier: number;
  shield: boolean;

  constructor(options: ModifierOptions<GenericArmorModifierOptions>) {
    super(options);

    this.tier = options.options.tier;
    this.shield = !!options.options.shield;

    if (!this.tier) {
      console.log("Got bad generic armor modifier", this.tier, options.options);
      this.tier = 0;
    }
  }
  getBonus(prop: string): number | void {
    if (this.shield) {
      if (prop === "shieldTier" || prop === "armorTier") {
        return (
          this.tier +
          this.parent.stats.bonusShieldTiers +
          this.parent.stats.bonusArmorTiers
        );
      }
    } else {
      if (prop === "armorTier") {
        return this.tier + this.parent.stats.bonusArmorTiers;
      }
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
