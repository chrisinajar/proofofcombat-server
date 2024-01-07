import type { Unit } from "../units/unit";
import type { Item } from "../items/item";

export type ModifierOptions<T> = {
  parent: Unit;
  source: Unit | Item;
  options: T;
};

export abstract class Modifier<T> {
  parent: Unit;
  source: Unit | Item;

  constructor(options: ModifierOptions<T>) {
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
      this.remove();
    }
    this.parent = unit;
    if (this.parent.modifiers.find((modifier) => modifier === this)) {
      this.onUpdated();
    } else {
      this.parent.modifiers.push(this);
      this.onAttached();
    }
  }

  remove() {
    this.parent.removeModifier(this);
    this.onRemoved();
  }

  onUpdated() {}
  onAttached() {}
  onRemoved() {}
}
