import type { Modifier } from "./modifier";

export type ModifierClass<T extends Modifier, O> = new (o: O) => T<O>;
