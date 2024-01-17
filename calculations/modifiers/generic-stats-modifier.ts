import { Modifier, ModifierOptions } from "./modifier";

type StatsEntry = {
  [x in string]: number;
};

export type GenericStatsModifierOptions = {
  multiplier?: StatsEntry;
  bonus?: StatsEntry;
  extraBonus?: StatsEntry;
  isDebuff?: boolean;
};

export class GenericStatsModifier extends Modifier<GenericStatsModifierOptions> {
  options: GenericStatsModifierOptions;

  constructor(options: ModifierOptions<GenericStatsModifierOptions>) {
    super(options);

    this.options = options.options;
  }
  getBonus(prop: string): number | void {
    if (this.options.bonus && this.options.bonus[prop]) {
      return this.options.bonus[prop];
    }
    return;
  }
  getMultiplier(prop: string): number | void {
    if (this.options.multiplier && this.options.multiplier[prop]) {
      return this.options.multiplier[prop];
    }
    return;
  }
  getExtraBonus(prop: string): number | void {
    if (this.options.extraBonus && this.options.extraBonus[prop]) {
      return this.options.extraBonus[prop];
    }
    return;
  }
}
