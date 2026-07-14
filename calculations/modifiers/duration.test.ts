import { ModifierPersistancyData } from "./modifier";
import {
  isModifierExpired,
  tickModifierDuration,
  tickAndFilterModifiers,
  shouldRestoreModifier,
  getNextModifierExpiry,
} from "./duration";

function makeEntry(
  remainingDuration: number,
): ModifierPersistancyData<unknown> {
  return {
    modifierId: "generic-stats",
    remainingDuration,
    options: {},
  };
}

describe("isModifierExpired", () => {
  it("returns false for permanent modifiers (duration 0)", () => {
    expect(isModifierExpired(makeEntry(0))).toBe(false);
  });

  it("returns false for modifiers with time remaining", () => {
    expect(isModifierExpired(makeEntry(5000))).toBe(false);
  });

  it("returns true when remaining duration is exactly 0 but was non-permanent", () => {
    const entry = makeEntry(1000);
    const ticked = tickModifierDuration(entry, 1000);
    expect(isModifierExpired(ticked)).toBe(true);
  });
});

describe("tickModifierDuration", () => {
  it("decrements remaining duration", () => {
    const entry = makeEntry(10000);
    const result = tickModifierDuration(entry, 3000);
    expect(result.remainingDuration).toBe(7000);
  });

  it("marks as expired (-1) when duration is exhausted", () => {
    const entry = makeEntry(2000);
    const result = tickModifierDuration(entry, 5000);
    expect(result.remainingDuration).toBe(-1);
  });

  it("marks as expired (-1) when duration is exactly consumed", () => {
    const entry = makeEntry(3000);
    const result = tickModifierDuration(entry, 3000);
    expect(result.remainingDuration).toBe(-1);
  });

  it("leaves permanent modifiers (0) unchanged", () => {
    const entry = makeEntry(0);
    const result = tickModifierDuration(entry, 6000);
    expect(result.remainingDuration).toBe(0);
    expect(result).toBe(entry);
  });

  it("does not mutate the original", () => {
    const entry = makeEntry(5000);
    const result = tickModifierDuration(entry, 2000);
    expect(entry.remainingDuration).toBe(5000);
    expect(result.remainingDuration).toBe(3000);
  });

  it("handles zero elapsed time", () => {
    const entry = makeEntry(5000);
    const result = tickModifierDuration(entry, 0);
    expect(result.remainingDuration).toBe(5000);
  });
});

describe("tickAndFilterModifiers", () => {
  it("removes expired modifiers", () => {
    const modifiers = [makeEntry(3000), makeEntry(6000)];
    const result = tickAndFilterModifiers(modifiers, 3000);
    expect(result).toHaveLength(1);
    expect(result[0].remainingDuration).toBe(3000);
  });

  it("keeps permanent modifiers", () => {
    const modifiers = [makeEntry(0), makeEntry(3000)];
    const result = tickAndFilterModifiers(modifiers, 3000);
    expect(result).toHaveLength(1);
    expect(result[0].remainingDuration).toBe(0);
  });

  it("keeps alive modifiers", () => {
    const modifiers = [makeEntry(6000), makeEntry(12000)];
    const result = tickAndFilterModifiers(modifiers, 3000);
    expect(result).toHaveLength(2);
    expect(result[0].remainingDuration).toBe(3000);
    expect(result[1].remainingDuration).toBe(9000);
  });

  it("handles empty array", () => {
    expect(tickAndFilterModifiers([], 5000)).toEqual([]);
  });

  it("removes all when all expire at once", () => {
    const modifiers = [makeEntry(3000), makeEntry(3000)];
    const result = tickAndFilterModifiers(modifiers, 3000);
    expect(result).toHaveLength(0);
  });
});

describe("shouldRestoreModifier", () => {
  it("returns true for permanent modifiers", () => {
    expect(shouldRestoreModifier(makeEntry(0))).toBe(true);
  });

  it("returns true for modifiers with time left", () => {
    expect(shouldRestoreModifier(makeEntry(5000))).toBe(true);
  });

  it("returns false for expired modifiers", () => {
    const ticked = tickModifierDuration(makeEntry(1000), 1000);
    expect(shouldRestoreModifier(ticked)).toBe(false);
  });
});

describe("getNextModifierExpiry", () => {
  it("returns null for empty array", () => {
    expect(getNextModifierExpiry([])).toBeNull();
  });

  it("returns null when all modifiers are permanent", () => {
    expect(getNextModifierExpiry([makeEntry(0), makeEntry(0)])).toBeNull();
  });

  it("returns the smallest non-zero duration", () => {
    const modifiers = [makeEntry(6000), makeEntry(3000), makeEntry(9000)];
    expect(getNextModifierExpiry(modifiers)).toBe(3000);
  });

  it("ignores permanent modifiers when finding minimum", () => {
    const modifiers = [makeEntry(0), makeEntry(5000), makeEntry(8000)];
    expect(getNextModifierExpiry(modifiers)).toBe(5000);
  });

  it("works with a single timed modifier", () => {
    expect(getNextModifierExpiry([makeEntry(1500)])).toBe(1500);
  });

  it("ignores expired modifiers with negative duration", () => {
    const modifiers = [makeEntry(-1), makeEntry(5000)];
    expect(getNextModifierExpiry(modifiers)).toBe(5000);
  });

  it("returns null when only expired modifiers remain", () => {
    expect(getNextModifierExpiry([makeEntry(-1), makeEntry(-1)])).toBeNull();
  });
});
