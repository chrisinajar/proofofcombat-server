import type { Unit } from "../units/unit";
import type {
  Modifier,
  ModifierOptions,
  OptionsForModifier,
  ModifierConstructorFromType,
} from "../modifiers/modifier";
import type { ModifierDefinition } from "../modifiers/enchantments";

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
    modifierDefinition: ModifierDefinition<T>,
    _unused?: void,
  ): T;
  registerModifier<T extends Modifier<unknown>>(
    ModifierType: ModifierConstructorFromType<T>,
    options: OptionsForModifier<T>,
  ): T;

  registerModifier<T extends Modifier<O>, O>(
    definitionOrClass: unknown,
    sourceOrOptions: unknown,
  ): T {
    if (typeof definitionOrClass === "function") {
      const ModifierType = definitionOrClass as new (
        o: ModifierOptions<O>,
      ) => T;
      const options = sourceOrOptions as O;
      return this.unit.applyModifier(ModifierType, options, this);
    }
    const modifierDefinition = definitionOrClass as ModifierDefinition<T>;
    return this.unit.applyModifier(modifierDefinition, this);
  }

  getModifierValue(name: string): number | void {
    return;
  }
}
