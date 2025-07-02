import {
  opposedSigmoidOdds,
  calculateHitChance,
  calculateRating,
} from "./maths";

describe("opposedSigmoidOdds", () => {
  it("should return 0.5 when attackerValue equals defenderValue", () => {
    expect(opposedSigmoidOdds(100, 100)).toBeCloseTo(0.5, 5);
  });

  it("should return a value close to 1 when attackerValue is much greater than defenderValue", () => {
    expect(opposedSigmoidOdds(20000, 100)).toBeGreaterThan(0.9);
  });

  it("should return a value close to 0 when attackerValue is much less than defenderValue", () => {
    expect(opposedSigmoidOdds(100, 20000)).toBeLessThan(0.1);
  });

  it("should respect the steepness parameter", () => {
    expect(opposedSigmoidOdds(100, 50, 2)).toBeGreaterThan(
      opposedSigmoidOdds(100, 50, 1),
    );
    expect(opposedSigmoidOdds(50, 100, 2)).toBeLessThan(
      opposedSigmoidOdds(50, 100, 1),
    );
  });

  it("should respect the min and max parameters", () => {
    expect(opposedSigmoidOdds(100, 20000, 1, 0.1, 0.9)).toBeGreaterThanOrEqual(
      0.1,
    );
    expect(opposedSigmoidOdds(20000, 100, 1, 0.1, 0.9)).toBeLessThanOrEqual(
      0.9,
    );
  });
});

describe("calculateHitChance", () => {
  it("should return a value between 0 and 1", () => {
    const chance = calculateHitChance(100, 100);
    expect(chance).toBeGreaterThanOrEqual(0);
    expect(chance).toBeLessThanOrEqual(1);
  });

  it("should return higher chance for attacker with higher rating", () => {
    const chance = calculateHitChance(200, 100);
    expect(chance).toBeGreaterThan(calculateHitChance(100, 200));
  });

  it("should return lower chance for defender with higher rating", () => {
    const chance = calculateHitChance(100, 200);
    expect(chance).toBeLessThan(calculateHitChance(200, 100));
  });

  it("should always have a chance of hitting", () => {
    const chance = calculateHitChance(1, 10000);
    expect(chance).toBeGreaterThan(0);
  });
  it("should always have a chance of being missed", () => {
    const chance = calculateHitChance(10000, 1);
    expect(chance).toBeLessThan(1);
  });
});

describe("calculateRating", () => {
  it("should return a value that increases with stat", () => {
    const lowStat = calculateRating(1);
    const midStat = calculateRating(10);
    const highStat = calculateRating(100);
    expect(midStat).toBeGreaterThan(lowStat);
    expect(highStat).toBeGreaterThan(midStat);
  });

  it("should cap out around 100k", () => {
    const maxStat = calculateRating(10000000);
    expect(maxStat).toBeLessThanOrEqual(100000);
  });
});
