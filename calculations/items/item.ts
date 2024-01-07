import type { Unit } from "../units/unit";
import type { Modifier, ModifierOptions } from "../modifiers/modifier";

export type ItemOptions = {
  level: number;
  unit: Unit;
  name?: string;
};

export class Item {
  level: number;
  unit: Unit;
  name?: string;

  constructor(options: ItemOptions) {
    this.level = options.level;
    this.name = options.name;
    this.unit = options.unit;
  }

  registerModifier<T extends Modifier<O>, O>(
    ModifierType: new (o: ModifierOptions<O>) => T,
    options: O,
  ): T {
    return this.unit.applyModifier(ModifierType, options, this);
  }

  getModifierValue(name: string): number | void {
    return;
  }
}
