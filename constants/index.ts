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
  | "hermit";

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
