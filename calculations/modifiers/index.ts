import type { Modifier, ModifierOptions } from "./modifier";

export type ModifierClass<T> = new (o: ModifierOptions<T>) => Modifier<T>;

const ModifierMap: { [x in string]?: ModifierClass<any> } = {};

export function registerModifier<T>(name: string, type: ModifierClass<T>) {
  ModifierMap[name] = type;
}
export function getModifierByName<T>(
  name: string
): ModifierClass<T> | undefined {
  return ModifierMap[name];
}
