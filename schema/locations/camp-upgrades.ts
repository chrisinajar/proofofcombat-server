import {
  PlayerLocationUpgradeDescription,
  PlayerLocationUpgrades,
} from "types/graphql";

export const CampUpgrades: {
  [x in PlayerLocationUpgrades]: PlayerLocationUpgradeDescription;
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
    name: "Build a large storage cach",
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
