import { Modifier, ModifierOptions } from "./modifier";

type ModifierClass = new (o: ModifierOptions) => Modifier;

const ModifierMap: { [x in string]?: ModifierClass } = {};

export function registerModifier(name: string, type: ModifierClass) {
  ModifierMap[name] = type;
}
export function getModifierByName(name: string): ModifierClass | undefined {
  return ModifierMap[name];
}
