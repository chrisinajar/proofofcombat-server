import {
  getAngleFromCenter,
  getPercentRadiusTowardEdge,
  isInTwilightZone,
  getTimezoneIndex,
  getTimezoneForLocation,
} from "./helpers";
import { MAP_DIMENSIONS, TWILIGHT_RADIUS } from "./index";

describe("Time Utility Functions", () => {
  const center = { x: MAP_DIMENSIONS.WIDTH / 2, y: MAP_DIMENSIONS.HEIGHT / 2 };

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
});
