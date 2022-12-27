import type { Unit } from "../units/unit";

export type ModifierOptions = {
  parent: Unit;
  source: Unit;
  options: any;
};

export abstract class Modifier {
  parent: Unit;
  source: Unit;

  constructor(options: ModifierOptions) {
    this.getBonus = this.getBonus.bind(this);
    this.getMultiplier = this.getMultiplier.bind(this);
    this.getExtraBonus = this.getExtraBonus.bind(this);

    this.source = options.source;
    this.attachToUnit(options.parent);
    // just makes ts happy, attachToUnit already does this
    this.parent = options.parent;
  }

  abstract getBonus(prop: string): number | void;
  abstract getMultiplier(prop: string): number | void;
  abstract getExtraBonus(prop: string): number | void;

  attachToUnit(unit: Unit) {
    if (
      this.parent &&
      this.parent.modifiers.find((modifier) => modifier === this)
    ) {
      if (unit === this.parent) {
        this.onUpdated();
        return;
      }
      this.parent.modifiers = this.parent.modifiers.filter(
        (modifier) => modifier !== this
      );
      this.onRemoved();
    }
    this.parent = unit;
    if (this.parent.modifiers.find((modifier) => modifier === this)) {
      this.onUpdated();
    } else {
      this.parent.modifiers.push(this);
      this.onAttached();
    }
  }

  onUpdated() {}
  onAttached() {}
  onRemoved() {}
}
