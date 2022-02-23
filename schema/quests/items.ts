import { BaseItem } from "../items";
import { InventoryItemType } from "types/graphql";

export function getQuestRewards() {
  return {
    // "washed up" quest line mundane items
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

    // "washed up" quest line reward items
    "fishermans-strength": {
      id: "fishermans-strength",
      name: "Hero's Bracelet",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-dexterity": {
      id: "fishermans-dexterity",
      name: "Rod of Speed",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-constitution": {
      id: "fishermans-constitution",
      name: "Fortitude Ring",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-intelligence": {
      id: "fishermans-intelligence",
      name: "Occult Tome",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-wisdom": {
      id: "fishermans-wisdom",
      name: "Wisdom Statue",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-charisma": {
      id: "fishermans-charisma",
      name: "Worship Disc",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-luck": {
      id: "fishermans-luck",
      name: "Lucky Coin",
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
