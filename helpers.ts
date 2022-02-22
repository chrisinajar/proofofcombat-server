import { TerrainType, LocationData, SpecialLocation } from "./constants";

export function specialLocations(x: number, y: number): SpecialLocation[] {
  return LocationData.default.specialLocations.filter(
    (location) => location.x === x && location.y === y
  );
}

export function findTerrainType(
  x: number,
  y: number,
  terrain: TerrainType,
  direction: number = 1,
  maxMagnitude: number = 1,
  magnitude: number = 1
): [number, number] {
  const checkLocation = LocationData.default.locations[x][y];
  if (checkLocation.terrain === terrain) {
    return [x, y];
  }
  switch (direction) {
    case 0:
      x = x + 1;
      break;
    case 1:
      y = y - 1;
      break;
    case 2:
      x = x - 1;
      break;
    case 3:
      y = y + 1;
      break;
  }

  magnitude = magnitude - 1;
  if (magnitude === 0) {
    direction = (direction + 1) % 4;
    magnitude = maxMagnitude;
  }
  if (direction === 0) {
    magnitude++;
  }
  if (direction === 2) {
    magnitude++;
  }
  return findTerrainType(x, y, terrain, direction, maxMagnitude, magnitude);
}
