import {
  getAngleFromCenter,
  getPercentRadiusTowardEdge,
  isInTwilightZone,
  getTimezoneIndex,
  getTimezoneForLocation,
  TWILIGHT_RADIUS,
  timestampLocationToGameTime,
} from "./helpers";
import { MAP_DIMENSIONS } from "./index";

describe("timezones and twilight", () => {
  const center = {
    x: MAP_DIMENSIONS.WIDTH / 2,
    y: MAP_DIMENSIONS.HEIGHT / 2,
    map: "default",
  };

  it("computes 0 radius and twilight at center", () => {
    expect(getPercentRadiusTowardEdge(center, MAP_DIMENSIONS)).toBe(0);
    expect(isInTwilightZone(center, MAP_DIMENSIONS, TWILIGHT_RADIUS)).toBe(
      true,
    );
    expect(getTimezoneForLocation(center)).toEqual({
      name: "Twilight",
      offset: 0,
    });
  });

  it("computes correct angle and timezone for top edge", () => {
    const point = { x: center.x, y: 0 };
    const angle = getAngleFromCenter(point, MAP_DIMENSIONS);
    const timezone = getTimezoneIndex(angle, 24);
    expect(timezone).toBe(18);
  });

  it("computes correct angle and timezone for bottom edge", () => {
    const point = { x: center.x, y: MAP_DIMENSIONS.HEIGHT };
    const angle = getAngleFromCenter(point, MAP_DIMENSIONS);
    const timezone = getTimezoneIndex(angle, 24);
    expect(timezone).toBe(6);
  });

  it("computes correct angle and timezone for left edge", () => {
    const point = { x: 0, y: center.y };
    const angle = getAngleFromCenter(point, MAP_DIMENSIONS);
    const timezone = getTimezoneIndex(angle, 24);
    expect(timezone).toBe(12);
  });

  it("computes correct angle and timezone for right edge", () => {
    const point = { x: MAP_DIMENSIONS.WIDTH, y: center.y };
    const angle = getAngleFromCenter(point, MAP_DIMENSIONS);
    const timezone = getTimezoneIndex(angle, 24);
    expect(timezone).toBe(0);
  });

  it("confirms points outside center are not in twilight", () => {
    const point = { x: center.x, y: 0 };
    expect(isInTwilightZone(point, MAP_DIMENSIONS, TWILIGHT_RADIUS)).toBe(
      false,
    );
  });

  describe("timestampLocationToGameTime", () => {
    it("computes normalized time and fraction in twilight (offset 0)", () => {
      const ts = 0; // start of cycle
      const { timezone, time, daytime } = timestampLocationToGameTime(ts, center);
      expect(timezone).toEqual({ name: "Twilight", offset: 0 });
      expect(time).toBe(0);
      expect(daytime).toBe(0);
    });

    it("applies timezone offset without wraparound for a non-twilight zone", () => {
      // Choose a point with known timezone index 6 (bottom edge)
      const bottomEdge = { x: center.x, y: MAP_DIMENSIONS.HEIGHT, map: "default" };
      const ts = 0; // start of cycle so base time = 0
      const result = timestampLocationToGameTime(ts, bottomEdge);
      // Expect timezone 6 (from earlier angle tests)
      expect(result.timezone.offset).toBe(6);
      // With ts=0, time should equal offset hours in game time
      const hourMs = 60 * 60 * 1000;
      expect(result.time).toBe(6 * hourMs);
      expect(result.daytime).toBeCloseTo(6 / 24, 10);
    });

    it("normalizes daytime when timezone offset causes wraparound", () => {
      // Use bottom edge (timezone 6) and a timestamp that represents 19h into the game day.
      // 19h + 6h offset = 25h -> wraps to 1h; daytime should be 1/24, not > 1.
      const bottomEdge = { x: center.x, y: MAP_DIMENSIONS.HEIGHT, map: "default" };
      const hourMs = 60 * 60 * 1000;
      const ts = (19 / 24) * (4 * hourMs); // 19/24 through the 4h real-time cycle
      const result = timestampLocationToGameTime(ts, bottomEdge);
      // Sanity check timezone
      expect(result.timezone.offset).toBe(6);
      // Time should wrap to 1 hour
      expect(result.time).toBe(hourMs);
      // Daytime should be normalized to 1/24
      expect(result.daytime).toBeCloseTo(1 / 24, 10);
    });
  });
});
