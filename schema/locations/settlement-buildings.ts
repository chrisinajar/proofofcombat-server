import {
  PlayerLocationBuildingDescription,
  PlayerLocationType,
  PlayerLocation,
} from "types/graphql";

const BuildingsData = {
  [PlayerLocationType.Farm]: {
    type: PlayerLocationType.Farm,
    name: "Farm",
    cost: [
      { name: "water", value: 1000000 },
      { name: "food", value: 1000000 },
      { name: "wood", value: 100000 },
      { name: "stone", value: 100000 },
    ],
  },
};

type DescribedBuildings = keyof typeof BuildingsData;

export const Buildings: {
  [x in DescribedBuildings]: PlayerLocationBuildingDescription;
} = BuildingsData;

export function payForBuilding(
  location: PlayerLocation,
  type: DescribedBuildings
): boolean {
  if (!canAffordBuilding(location, type)) {
    return false;
  }
  const buildingEntry = Buildings[type];
  if (!buildingEntry) {
    return false;
  }

  buildingEntry.cost.forEach((cost) => {
    const valueEntry = location.resources.find(
      (resource) => resource.name == cost.name
    );
    // first iteration in canAffordBuildings means this is always truthy
    if (valueEntry) {
      valueEntry.value -= cost.value;
    }
  });

  return true;
}

export function canAffordBuilding(
  location: PlayerLocation,
  type: DescribedBuildings
): boolean {
  const buildingEntry = Buildings[type];
  if (!buildingEntry) {
    return false;
  }
  return buildingEntry.cost.reduce<boolean>(
    (canAfford: boolean, cost): boolean => {
      if (!canAfford) {
        return false;
      }
      const valueEntry = location.resources.find(
        (resource) => resource.name == cost.name
      );
      return !!valueEntry && valueEntry.value >= cost.value;
    },
    true
  );
}
