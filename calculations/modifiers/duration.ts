import { ModifierPersistancyData } from "./modifier";

export function isModifierExpired(
  data: ModifierPersistancyData<any>,
): boolean {
  return data.remainingDuration < 0;
}

export function tickModifierDuration<O>(
  data: ModifierPersistancyData<O>,
  elapsedMs: number,
): ModifierPersistancyData<O> {
  if (data.remainingDuration === 0) return data;
  const next = data.remainingDuration - elapsedMs;
  const newDuration = next <= 0 ? -1 : next;
  return {
    ...data,
    remainingDuration: newDuration,
    options: {
      ...data.options,
      remainingDuration: newDuration,
    },
  };
}

export function tickAndFilterModifiers(
  modifiers: ModifierPersistancyData<any>[],
  elapsedMs: number,
): ModifierPersistancyData<any>[] {
  return modifiers
    .map((m) => tickModifierDuration(m, elapsedMs))
    .filter((m) => !isModifierExpired(m));
}

export function shouldRestoreModifier(
  data: ModifierPersistancyData<any>,
): boolean {
  return !isModifierExpired(data);
}

export function getNextModifierExpiry(
  modifiers: ModifierPersistancyData<any>[],
): number | null {
  let min: number | null = null;
  for (const m of modifiers) {
    if (m.remainingDuration <= 0) continue;
    if (min === null || m.remainingDuration < min) {
      min = m.remainingDuration;
    }
  }
  return min;
}
