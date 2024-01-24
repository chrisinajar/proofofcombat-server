import { EnchantmentType } from "types/graphql";

import type { Unit } from "../units/unit";
import type { Item } from "../items/item";
import type { ModifierDefinition } from "./enchantments";

export type ModifierPersistancyData<O> = {
  expireTime: number;
  options: O;
};

export type ModifierOptions<O> = {
  parent: Unit;
  source: Unit | Item;
  options: O;
  enchantment?: EnchantmentType;
};

export abstract class Modifier<O> {
  parent: Unit;
  source: Unit | Item;
  enchantment?: EnchantmentType;
  children: Modifier<any>[] = [];
  _isDebuff: boolean = false;
  _isDisabled: boolean = false;

  constructor(options: ModifierOptions<O>) {
    this.getBonus = this.getBonus.bind(this);
    this.getMultiplier = this.getMultiplier.bind(this);
    this.getExtraBonus = this.getExtraBonus.bind(this);

    this.source = options.source;
    this.enchantment = options.enchantment;
    this.attachToUnit(options.parent);
    // just makes ts happy, attachToUnit already does this
    this.parent = options.parent;

    if (
      options.options &&
      typeof options.options === "object" &&
      "isDebuff" in options.options &&
      typeof options.options.isDebuff === "boolean"
    ) {
      this._isDebuff = options.options.isDebuff;
    }
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
    if (this.isUnique()) {
      this.parent.modifiers.forEach((modifier) => {
        if (modifier === this) {
          return;
        }
        if (modifier.constructor !== this.constructor) {
          return;
        }
        modifier.remove();
      });
    }
    if (this.parent.modifiers.find((modifier) => modifier === this)) {
      this.onUpdated();
    } else {
      this.parent.modifiers.push(this);
      this.onAttached();
    }
  }

  createChildren(modifiers: ModifierDefinition<Modifier<any>, any>[]) {
    modifiers.forEach((modifierDefinition) => {
      const modifier = this.parent.applyModifier(
        modifierDefinition,
        this.source,
      );
      this.children.push(modifier);
    });
  }

  remove() {
    const { children } = this;
    this.children = [];
    children.forEach((modifier) => modifier.remove());

    this.parent.removeModifier(this);
    this.onRemoved();
  }

  onUpdated() {}
  onAttached() {}
  onRemoved() {}

  isDebuff(): boolean {
    return this._isDebuff;
  }
  isDisabled(): boolean {
    return this._isDisabled;
  }

  disable() {
    this._isDisabled = true;
  }
  enable() {
    this._isDisabled = false;
  }
  isUnique() {
    return false;
  }
  isPersistent(): ModifierPersistancyData<O> | false {
    return false;
  }
}
