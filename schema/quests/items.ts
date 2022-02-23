import { BaseItem } from "../items";
import { InventoryItemType } from "types/graphql";

export function getQuestRewards() {
  return {
    "old-boot": {
      id: "old-boot",
      name: "Old Boot",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "old-pocket-watch": {
      id: "old-pocket-watch",
      name: "Old Pocket Watch",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "old-fishing-rod": {
      id: "old-fishing-rod",
      name: "Old Fishing Rod",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "old-fishing-book": {
      id: "old-fishing-book",
      name: "Old Fishing Book",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "old-walking-stick": {
      id: "old-walking-stick",
      name: "Old Walking Stick",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "old-coin": {
      id: "old-coin",
      name: "Old Coin",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
  };
}

/*
  id: string;
  name: string;
  type: InventoryItemType;
  level: number;
  cost?: number;
  canBuy: boolean;

*/
