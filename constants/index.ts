import DefaultLocations from "./maps/default-locations.json";
import DefaultTerrain from "./maps/default-terrain.json";
import VoidLocations from "./maps/void-locations.json";
import VoidTerrain from "./maps/void-terrain.json";

export type TerrainType = "land" | "water" | "forbidden" | "void";
export type MapNames = "default" | "void";
export type SpecialLocationType =
  | "dock"
  | "quest"
  | "city"
  | "bridge"
  | "tavern"
  | "hermit"
  | "altar"
  | "fortress";

export type LocationData = {
  terrain: TerrainType;
};

export type SpecialLocation = {
  x: number;
  y: number;
  name: string;
  type: SpecialLocationType;
  description?: string[];
};

export type LocationDataType = {
  [x in MapNames]: {
    locations: LocationData[][];
    specialLocations: SpecialLocation[];
  };
};

export const MAP_DIMENSIONS = {
  WIDTH: 128,
  HEIGHT: 96
} as const;

export const LocationData: LocationDataType = {
  default: {
    locations: DefaultTerrain as LocationData[][],
    specialLocations: DefaultLocations as SpecialLocation[],
  },
  void: {
    locations: VoidTerrain as LocationData[][],
    specialLocations: VoidLocations as SpecialLocation[],
  },
};
