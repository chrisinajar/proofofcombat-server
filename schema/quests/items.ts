import { BaseItem } from "../items";
import { InventoryItemType, EnchantmentType } from "types/graphql";

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
      passiveEnchantments: [EnchantmentType.FishermansStrength],
      name: "Hero's Bracelet",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-dexterity": {
      id: "fishermans-dexterity",
      passiveEnchantments: [EnchantmentType.FishermansDexterity],
      name: "Rod of Speed",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-constitution": {
      id: "fishermans-constitution",
      passiveEnchantments: [EnchantmentType.FishermansConstitution],
      name: "Fortitude Ring",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-intelligence": {
      id: "fishermans-intelligence",
      passiveEnchantments: [EnchantmentType.FishermansIntelligence],
      name: "Occult Tome",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-wisdom": {
      id: "fishermans-wisdom",
      passiveEnchantments: [EnchantmentType.FishermansWisdom],
      name: "Wisdom Statue",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-charisma": {
      id: "fishermans-charisma",
      passiveEnchantments: [EnchantmentType.FishermansCharisma],
      name: "Worship Disc",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fishermans-luck": {
      id: "fishermans-luck",
      passiveEnchantments: [EnchantmentType.FishermansLuck],
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
