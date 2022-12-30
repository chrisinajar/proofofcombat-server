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

  it("should default values to 0", () => {
    const unit = new Unit();

    expect(unit.stats.someValue).toBe(0);
  });
});
