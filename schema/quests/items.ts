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
    "fishermans-willpower": {
      id: "fishermans-willpower",
      passiveEnchantments: [EnchantmentType.FishermansWillpower],
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

    // rebirth quest rewards
    // first rebirth, gives the ability to rebirth at all, is taken away
    "totem-of-rebirth": {
      id: "totem-of-rebirth",
      passiveEnchantments: [EnchantmentType.CanRebirth],
      name: "Totem of Rebirth",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    // after first rebirth, you get...
    "totem-of-champion": {
      id: "totem-of-champion",
      passiveEnchantments: [
        EnchantmentType.AutoBattle,
        EnchantmentType.DoubleExperience,
      ],
      name: "Totem of the Champion",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    // 2nd level cap, champion totem turns into...
    "totem-of-champion-rebirth": {
      id: "totem-of-champion-rebirth",
      passiveEnchantments: [
        EnchantmentType.AutoBattle,
        EnchantmentType.DoubleExperience,
        EnchantmentType.CanRebirth,
      ],
      name: "Totem of Champion's Rebirth",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    // after second rebirth, you get...
    "totem-of-hero": {
      id: "totem-of-hero",
      passiveEnchantments: [
        EnchantmentType.AutoBattle,
        EnchantmentType.DoubleExperience,
        EnchantmentType.DoubleLeveling,
      ],
      name: "Totem of the Hero",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    // 2nd level cap, hero totem turns into...
    "totem-of-hero-rebirth": {
      id: "totem-of-hero-rebirth",
      passiveEnchantments: [
        EnchantmentType.AutoBattle,
        EnchantmentType.DoubleExperience,
        EnchantmentType.CanRebirth,
      ],
      name: "Totem of Heroic Rebirth",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },

    // crafting! high level because they want to be on top
    "crafting-hammer": {
      id: "crafting-hammer",
      passiveEnchantments: [EnchantmentType.CanCraft],
      name: "Crafting Hammer",
      type: InventoryItemType.Quest,
      level: 4,
      canBuy: false,
    },

    // class quests, step 1 --
    "warrior-plate": {
      id: "warrior-plate",
      name: "Warrior's Plate",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    "secret-codex": {
      id: "secret-codex",
      name: "Secret Codex",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    "fletching-leather": {
      id: "fletching-leather",
      name: "Fletching Leather",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    "blood-stone": {
      id: "blood-stone",
      name: "Blood Stone",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    "loaded-dice": {
      id: "loaded-dice",
      name: "Loaded Dice",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    "patrons-mark": {
      id: "patrons-mark",
      name: "Patron's Mark",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    "righteous-incense": {
      id: "righteous-incense",
      name: "Righteous Incense",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },

    // class quests step 2 ---
    "warriors-armlette": {
      id: "warriors-armlette",
      name: "Warrior's Armlette",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.FishermansStrength,
        EnchantmentType.MeleeUpgrade,
      ],
    },
    "tome-of-knowledge": {
      id: "tome-of-knowledge",
      name: "Tome of Knowledge",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.FishermansIntelligence,
        EnchantmentType.CasterUpgrade,
      ],
    },
    "quiver-of-speed": {
      id: "quiver-of-speed",
      name: "Quiver of Speed",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.FishermansDexterity,
        EnchantmentType.ArcherUpgrade,
      ],
    },
    "vampire-ring": {
      id: "vampire-ring",
      name: "Vampire Ring",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.FishermansConstitution,
        EnchantmentType.VampireUpgrade,
      ],
    },
    "gambling-kit": {
      id: "gambling-kit",
      name: "Gambling Kit",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.FishermansLuck,
        EnchantmentType.GamblerUpgrade,
      ],
    },
    "patrons-wisdom": {
      id: "patrons-wisdom",
      name: "Patron's Wisdom",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.FishermansWillpower,
        EnchantmentType.BattleMageUpgrade,
      ],
    },
    "liturgical-censer": {
      id: "liturgical-censer",
      name: "Liturgical Censer",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.FishermansWisdom,
        EnchantmentType.SmiterUpgrade,
      ],
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
