import type { Modifier, ModifierOptions } from "./modifier";

export type ModifierClass<T extends Modifier, O> = new (
  o: ModifierOptions<O>,
) => T;
