import "jest";

import { Unit } from "./unit";

describe("calculations unit base class", () => {
  it("should return values correctly", () => {
    const unit = new Unit();
    unit.baseValues.constitution = 1;
    expect(unit.stats.constitution).toBe(1);
    unit.baseValues.level = 1;
    expect(unit.stats.level).toBe(1);
  });

  it("should calculate max health", () => {
    const unitA = new Unit();
    const unitB = new Unit();

    unitA.baseValues.constitution = 1;
    expect(unitA.stats.health).toBeGreaterThan(0);

    unitB.baseValues.constitution = 10;
    expect(unitB.stats.health).toBeGreaterThan(20);

    unitB.baseValues.constitution = 2;
    expect(unitB.stats.health).toBeGreaterThan(unitA.stats.health);
  });
});
