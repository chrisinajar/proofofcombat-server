import {
  PlayerLocationUpgradeDescription,
  PlayerLocationUpgrades,
  PlayerLocationType,
  PlayerLocation,
} from "types/graphql";

type ExtendedPlayerLocationUpgradeDescription =
  PlayerLocationUpgradeDescription & {
    requires?: PlayerLocationUpgrades[];
  };

export const CampUpgrades: {
  [x in PlayerLocationUpgrades]?: ExtendedPlayerLocationUpgradeDescription;
} = {
  [PlayerLocationUpgrades.ChoppingBlock]: {
    name: "Build chopping block",
    type: PlayerLocationUpgrades.ChoppingBlock,
    cost: [{ name: "wood", value: 20 }],
  },
  [PlayerLocationUpgrades.FirePit]: {
    name: "Build fire pit",
    type: PlayerLocationUpgrades.FirePit,
    cost: [
      { name: "stone", value: 20 },
      { name: "wood", value: 20 },
    ],
  },
  [PlayerLocationUpgrades.Tent]: {
    name: "Purchase tent",
    type: PlayerLocationUpgrades.Tent,
    cost: [
      { name: "wood", value: 20 },
      { name: "stone", value: 10 },
      { name: "gold", value: 1000000 },
    ],
  },
  [PlayerLocationUpgrades.RainCollectionUnit]: {
    name: "Build rain collection unit",
    type: PlayerLocationUpgrades.RainCollectionUnit,
    cost: [
      { name: "wood", value: 50 },
      { name: "stone", value: 50 },
    ],
  },
  [PlayerLocationUpgrades.WoodStorage]: {
    name: "Build wood storage",
    type: PlayerLocationUpgrades.WoodStorage,
    cost: [
      { name: "wood", value: 50 },
      { name: "stone", value: 50 },
    ],
  },
  [PlayerLocationUpgrades.StoneStorage]: {
    name: "Build stone storage",
    type: PlayerLocationUpgrades.StoneStorage,
    cost: [
      { name: "wood", value: 50 },
      { name: "stone", value: 50 },
    ],
  },
  [PlayerLocationUpgrades.ImprovedCamp]: {
    name: "Improve tent and fire pit",
    type: PlayerLocationUpgrades.ImprovedCamp,
    cost: [
      { name: "stone", value: 400 },
      { name: "wood", value: 300 },
    ],
  },
  [PlayerLocationUpgrades.Garden]: {
    name: "Build a simple garden",
    type: PlayerLocationUpgrades.Garden,
    cost: [
      { name: "wood", value: 800 },
      { name: "stone", value: 460 },
    ],
  },
  [PlayerLocationUpgrades.HiredHelp]: {
    name: "Hire a helper",
    type: PlayerLocationUpgrades.HiredHelp,
    cost: [
      { name: "food", value: 800 },
      { name: "gold", value: 2000000000 },
    ],
  },
  [PlayerLocationUpgrades.TradingPost]: {
    name: "Build a trading post",
    type: PlayerLocationUpgrades.TradingPost,
    cost: [
      { name: "wood", value: 450 },
      { name: "stone", value: 600 },
      { name: "gold", value: 1000000000 },
    ],
  },
  [PlayerLocationUpgrades.StorageCache]: {
    name: "Build a large storage cache",
    type: PlayerLocationUpgrades.StorageCache,
    cost: [
      { name: "stone", value: 6000 },
      { name: "wood", value: 9000 },
    ],
  },
  [PlayerLocationUpgrades.Settlement]: {
    name: "Upgrade camp to settlement",
    type: PlayerLocationUpgrades.Settlement,
    cost: [
      { name: "wood", value: 100000 },
      { name: "stone", value: 100000 },
      { name: "water", value: 100000 },
      { name: "food", value: 100000 },
    ],
  },

  // [PlayerLocationUpgrades.Garden]: {
  //   name: "Build a simple garden",
  //   type: PlayerLocationUpgrades.Garden,
  //   cost: [
  //     { name: "wood", value: 100 },
  //     { name: "stone", value: 150 },
  //     { name: "gold", value: 2000000000 },
  //   ],
  // },
};

export const SettlementUpgrades: {
  [x in PlayerLocationUpgrades]?: ExtendedPlayerLocationUpgradeDescription;
} = {
  [PlayerLocationUpgrades.GovernorsManor]: {
    name: "Construct Governor's Manor",
    type: PlayerLocationUpgrades.GovernorsManor,
    requires: [PlayerLocationUpgrades.HasGovernorsTitle],
    cost: [
      { name: "wood", value: 8000000 },
      { name: "stone", value: 12000000 },
      { name: "bonds", value: 1000000 },
    ],
  },
};

export function getUpgradesForLocationType(
  type: PlayerLocationType,
): ExtendedPlayerLocationUpgradeDescription[] {
  const result: ExtendedPlayerLocationUpgradeDescription[] = [];
  if (
    type === PlayerLocationType.Camp ||
    type === PlayerLocationType.Settlement
  ) {
    result.push(...Object.values(CampUpgrades));

    if (type === PlayerLocationType.Settlement) {
      result.push(...Object.values(SettlementUpgrades));
    }
  }
  return result;
}

export function getUpgradesForLocation(
  playerLocation: PlayerLocation,
): PlayerLocationUpgradeDescription[] {
  const upgradeList = getUpgradesForLocationType(playerLocation.type);

  return upgradeList.filter((upgrade) => {
    if (playerLocation.upgrades.indexOf(upgrade.type) > -1) {
      return false;
    }
    if (
      upgrade.requires &&
      !upgrade.requires.reduce((hasUpgrades, upgrade) => {
        if (!hasUpgrades || playerLocation.upgrades.indexOf(upgrade) === -1) {
          return false;
        }
        return true;
      }, true)
    ) {
      return false;
    }
    if (
      !upgrade.cost.reduce((canAfford, cost) => {
        const resource = playerLocation.resources.find(
          (res) => res.name === cost.name,
        );
        if (!resource) {
          return canAfford;
        }
        return canAfford && cost.value <= (resource.maximum ?? 0);
      }, true)
    ) {
      return false;
    }
    return true;
  });
}
