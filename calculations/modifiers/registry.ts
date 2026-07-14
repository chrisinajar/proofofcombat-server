import { ModifierClass } from "./index";
import { Modifier } from "./modifier";
import { GenericStatsModifier } from "./generic-stats-modifier";

const registry = new Map<string, ModifierClass<Modifier<any>, any>>();

export function registerModifier(
  id: string,
  ctor: ModifierClass<Modifier<any>, any>,
) {
  registry.set(id, ctor);
}

export function getModifierById(id: string) {
  return registry.get(id);
}

registerModifier("generic-stats", GenericStatsModifier);
