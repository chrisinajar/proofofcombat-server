import { registerModifier, getModifierById } from "./registry";
import { GenericStatsModifier } from "./generic-stats-modifier";

describe("modifier registry", () => {
  it("returns GenericStatsModifier for 'generic-stats'", () => {
    expect(getModifierById("generic-stats")).toBe(GenericStatsModifier);
  });

  it("returns undefined for unknown ids", () => {
    expect(getModifierById("does-not-exist")).toBeUndefined();
  });

  it("allows registering and retrieving a custom modifier", () => {
    registerModifier("test-modifier", GenericStatsModifier);
    expect(getModifierById("test-modifier")).toBe(GenericStatsModifier);
  });
});
