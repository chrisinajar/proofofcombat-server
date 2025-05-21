import { Location } from "types/graphql";
import { MAP_DIMENSIONS } from "./index";

// day/night cycle is once every 4 hours
// timezones are 1 hour apart
// so the game world is divided into 24 timezones radially
// and then the timezone in the center, so 25 total
// the center of the map is always in twilight

// the northmost vertical timezone is +-0 relative to the modulus time
// the center timezone shares that same offset, being neutral
// center twilight timezone is the innermost 1/Xth of the radius
// using a constant to control X so that we can mechanically interract and also play
// with the value unitl it gets to where we want it

// real world time for day/night cycle
export const DAY_NIGHT_CYCLE = 4 * 60 * 60 * 1000;
export const TIMEZONE_COUNT = 24;
// in-game time for day/night cycle
export const DAY_NIGHT_LENGTH = TIMEZONE_COUNT * 60 * 60 * 1000; // 24 hours
export const TIMEZONE_OFFSET = 1 * 60 * 60 * 1000; // hour

export const TWILIGHT_RADIUS = 0.1; // 10% of the radius is twilight

export type TimeZone = {
  name: string;
  offset: number;
};

export type FullTimeInfo = {
  timezone: TimeZone;
  time: number;
  daytime: number;
};

// game's internal time and day/night cycles work like a flat earth
// The sun is always halfway between the center of the map and the edge of the map,
// moving in a circle around the map, and the radial area below it is experiencing night
// which makes timezones radial
// and then near the center of the circle is the twilight with no timezones or descernable day/night cycles
// each in-game day takes ... an amount of time to ellapse... hours?
export function timestampLocationToGameTime(
  timestamp: number,
  location: Location,
): FullTimeInfo {
  const { x, y } = location;
  const timezone = getTimezoneForLocation(location);
  const { offset } = timezone;
  const time =
    ((timestamp % DAY_NIGHT_CYCLE) / DAY_NIGHT_CYCLE) * DAY_NIGHT_LENGTH; // normalized time in the cycle
  const gameTime = time + offset * TIMEZONE_OFFSET; // adjusted for timezone
  const adjustedTime = gameTime % DAY_NIGHT_LENGTH; // normalized time in the cycle

  return {
    timezone,
    time: adjustedTime,
    daytime: time / DAY_NIGHT_LENGTH,
  };
}

export function getTimezoneForLocation(location: Location): TimeZone {
  const { x, y } = location;

  if (isInTwilightZone(location, MAP_DIMENSIONS, TWILIGHT_RADIUS)) {
    return { name: "Twilight", offset: 0 };
  }
  const angle = getAngleFromCenter(location, MAP_DIMENSIONS);
  const offset = getTimezoneIndex(angle, 24); // 24 timezones
  const name = `Timezone ${offset}`;
  return { name, offset };
}

type Point = { x: number; y: number };
type Dimensions = { WIDTH: number; HEIGHT: number };

// Get normalized offset from center (-1 to 1 range)
export function getNormalizedOffsetFromCenter(
  point: Point,
  dimensions: Dimensions,
): Point {
  const centerX = dimensions.WIDTH / 2;
  const centerY = dimensions.HEIGHT / 2;
  return {
    x: (point.x - centerX) / centerX,
    y: (point.y - centerY) / centerY,
  };
}

// Get percent radius from center to edge in same direction (0 to 1)
export function getPercentRadiusTowardEdge(
  point: Point,
  dimensions: Dimensions,
): number {
  const centerX = dimensions.WIDTH / 2;
  const centerY = dimensions.HEIGHT / 2;
  const offsetX = point.x - centerX;
  const offsetY = point.y - centerY;

  const scaleX = offsetX !== 0 ? centerX / Math.abs(offsetX) : Infinity;
  const scaleY = offsetY !== 0 ? centerY / Math.abs(offsetY) : Infinity;
  const scaleToEdge = Math.min(scaleX, scaleY);

  return 1 / scaleToEdge;
}

// Determine if point is in the twilight zone
export function isInTwilightZone(
  point: Point,
  dimensions: Dimensions,
  twilightRadiusFraction: number = 0.1,
): boolean {
  const percentRadius = getPercentRadiusTowardEdge(point, dimensions);
  return percentRadius <= twilightRadiusFraction;
}

// Get angle from center to point in radians (-π to π)
export function getAngleFromCenter(
  point: Point,
  dimensions: Dimensions,
): number {
  const { x, y } = getNormalizedOffsetFromCenter(point, dimensions);
  return Math.atan2(y, x); // Angle in radians
}

export function getTimezoneIndex(
  angleRadians: number,
  totalZones: number,
): number {
  const TWO_PI = Math.PI * 2;
  const normalized = (angleRadians + TWO_PI) % TWO_PI; // [0, 2π)
  return Math.floor((normalized / TWO_PI) * totalZones); // 0 to totalZones - 1
}
