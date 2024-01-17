import { Modifier, ModifierOptions } from "./modifier";
import { ModifierDefinition } from "./enchantments";

export type ParentModifierOptions = {
  modifiers: ModifierDefinition<Modifier<any>, any>[];
  id: string;
};

export class ParentModifier extends Modifier<ParentModifierOptions> {
  modifiers: ModifierDefinition<Modifier<any>, any>[];
  id: string;

  constructor(options: ModifierOptions<ParentModifierOptions>) {
    super(options);

    this.modifiers = options.options.modifiers;
    this.id = options.options.id;

    this.createChildren(this.modifiers);
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
