import { Modifier, ModifierOptions } from "./modifier";

export type GenericStatsModifierOptions = {};

export class GenericStatsModifier extends Modifier<GenericStatsModifierOptions> {
  constructor(options: ModifierOptions<GenericStatsModifierOptions>) {
    super(options);
  }
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
