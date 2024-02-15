import {
  PlayerLocationBuildingDescription,
  PlayerLocationType,
  PlayerLocation,
} from "types/graphql";

const BuildingsData = {
  [PlayerLocationType.Farm]: {
    type: PlayerLocationType.Farm,
    name: "Farm",
    description:
      "A place where cattle live and breed. Generates food, used to sustain population growth, passively so long as it remains connected to your capital.",
    cost: [
      { name: "water", value: 1000000 },
      { name: "food", value: 1000000 },
      { name: "wood", value: 100000 },
      { name: "stone", value: 100000 },
    ],
  },
  [PlayerLocationType.Apiary]: {
    type: PlayerLocationType.Apiary,
    name: "Apiary",
    description:
      "A place where bees live and breed. Generates honey, an rare and valuable resource, passively so long as it remains connected to your capital.",
    cost: [
      { name: "water", value: 1200000 },
      { name: "food", value: 1000000 },
      { name: "wood", value: 1000000 },
      { name: "stone", value: 1000000 },
    ],
  },
  [PlayerLocationType.Barracks]: {
    type: PlayerLocationType.Barracks,
    name: "Barracks",
    description:
      "Housing and training facilities for your military. Allows the purchasing of military units and passively upgrades any existing military units.",
    cost: [
      { name: "water", value: 400000 },
      { name: "food", value: 1000000 },
      { name: "wood", value: 800000 },
      { name: "stone", value: 1200000 },
    ],
  },
};

type DescribedBuildings = keyof typeof BuildingsData;

export const Buildings: {
  [x in DescribedBuildings]: PlayerLocationBuildingDescription;
} = BuildingsData;

export function validBuildingLocationType(
  type: PlayerLocationType,
): type is DescribedBuildings {
  return type in Buildings;
}

export function payForBuilding(
  location: PlayerLocation,
  type: DescribedBuildings,
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
      (resource) => resource.name == cost.name,
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
  type: DescribedBuildings,
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
        (resource) => resource.name == cost.name,
      );
      return !!valueEntry && valueEntry.value >= cost.value;
    },
    true,
  );
}

export function shouldSeeBuilding(
  location: PlayerLocation,
  type: DescribedBuildings,
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
        (resource) => resource.name == cost.name,
      );
      return (valueEntry?.maximum ?? 0) >= cost.value;
    },
    true,
  );
}
