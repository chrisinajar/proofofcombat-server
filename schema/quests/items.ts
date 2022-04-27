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
      level: 3,
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
      level: 3,
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
      level: 1,
      canBuy: false,
    },
    "secret-codex": {
      id: "secret-codex",
      name: "Secret Codex",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "fletching-leather": {
      id: "fletching-leather",
      name: "Fletching Leather",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "blood-stone": {
      id: "blood-stone",
      name: "Blood Stone",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "loaded-dice": {
      id: "loaded-dice",
      name: "Loaded Dice",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "patrons-mark": {
      id: "patrons-mark",
      name: "Patron's Mark",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "righteous-incense": {
      id: "righteous-incense",
      name: "Righteous Incense",
      type: InventoryItemType.Quest,
      level: 1,
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

    "magic-bubble": {
      id: "magic-bubble",
      name: "Magic Bubble",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "aqua-lungs": {
      id: "aqua-lungs",
      name: "Aqua Lungs",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.CanTravelOnWater],
    },
    // brewconia bribes you to release droop
    "dont-get-hit": {
      id: "dont-get-hit",
      name: "Alvarado's Cloak",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.DoubleAccuracy,
        EnchantmentType.DoubleDodge,
      ],
    },

    "mound-of-flesh": {
      id: "mound-of-flesh",
      name: "Mound of Flesh",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "chimera-hook": {
      id: "chimera-hook",
      name: "Chimera Hook",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "lamp-oil": {
      id: "lamp-oil",
      name: "Lamp Oil",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "bird-figurine": {
      id: "bird-figurine",
      name: "Bird Figurine",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "precious-flaying-knife": {
      id: "precious-flaying-knife",
      name: "Precious Flaying Knife",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.BonusWeaponTier],
    },

    "naga-scale": {
      id: "naga-scale",
      name: "Naga Scale",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.CounterSpell,
        EnchantmentType.BonusWeaponTier,
      ],
    },

    "broken-scepter": {
      id: "broken-scepter",
      name: "Broken Scepter",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "scepter-of-travel": {
      id: "scepter-of-travel",
      name: "Scepter of Travel",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.ReduceTeleportCost],
    },

    "inconclusive-clockwork": {
      id: "inconclusive-clockwork",
      name: "Inconclusive Clockwork",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
    },
    "unimaginable-gearbox": {
      id: "unimaginable-gearbox",
      name: "Unimaginable Gearbox",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.ImprovedAutomation],
    },
    "otherworldly-gearbox": {
      id: "otherworldly-gearbox",
      name: "Otherworldly Gearbox",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.ImprovedAutomation],
    },

    // tavern trophies
    "trophy-hellhound": {
      id: "trophy-hellhound",
      name: "Engraved Lich Rib",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.DoubleAllStats,
        EnchantmentType.BonusWeaponTier,
      ],
    },
    "trophy-hiddenstump": {
      id: "trophy-hiddenstump",
      name: "Hidden Stump Trophy",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.DoubleAllStats,
        EnchantmentType.DoubleDodge,
      ],
    },
    "trophy-steamgear": {
      id: "trophy-steamgear",
      name: "Interesting Mechanical Trophy",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.DoubleAllStats,
        EnchantmentType.ImprovedAutomation,
      ],
    },
    "trophy-drowning": {
      id: "trophy-drowning",
      name: "Kraken Shell Medallion",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.DoubleAllStats,
        EnchantmentType.BonusArmorTier,
      ],
    },

    "essence-of-ash": {
      id: "essence-of-ash",
      name: "Essence of Ash",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    "essence-of-thorns": {
      id: "essence-of-thorns",
      name: "Essence of Thorns",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },
    "essence-of-darkness": {
      id: "essence-of-darkness",
      name: "Essence of Darkness",
      type: InventoryItemType.Quest,
      level: 2,
      canBuy: false,
    },

    // minor class upgrades...
    "archers-impatience": {
      id: "archers-impatience",
      name: "Archer's Impatience",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.RangedSecondAttackChance],
    },
    "archers-determination": {
      id: "archers-determination",
      name: "Archer's Determination",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.RangedSecondAttackChance,
        EnchantmentType.RangedArmorPiercing,
      ],
    },
    "archers-balance": {
      id: "archers-balance",
      name: "Archer's Balance",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.RangedSecondAttackChance,
        EnchantmentType.RangedArmorPiercing,
        EnchantmentType.BonusRangedWeaponTier,
      ],
    },

    "attackers-precision": {
      id: "attackers-precision",
      name: "Attacker's Precision",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.BonusDexterity],
    },
    "attackers-honor": {
      id: "attackers-honor",
      name: "Attacker's Honor",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.BonusDexterity,
        EnchantmentType.MeleeArmorPiercing,
      ],
    },
    "attackers-warbanner": {
      id: "attackers-warbanner",
      name: "Attacker's War Banner",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.BonusDexterity,
        EnchantmentType.MeleeArmorPiercing,
        EnchantmentType.BonusMeleeWeaponTier,
      ],
    },

    "casters-book": {
      id: "casters-book",
      name: "Caster's Book",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.BonusWisdom],
    },
    "casters-wisdom": {
      id: "casters-wisdom",
      name: "Caster's Wisdom",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.BonusWisdom,
        EnchantmentType.CasterArmorPiercing,
      ],
    },
    "casters-destiny": {
      id: "casters-destiny",
      name: "Caster's Destiny",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.BonusWisdom,
        EnchantmentType.CasterArmorPiercing,
        EnchantmentType.BonusCasterWeaponTier,
      ],
    },

    "smiters-inspiration": {
      id: "smiters-inspiration",
      name: "Smiter's Inspiration",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.BonusWillpower],
    },
    "smiters-calling": {
      id: "smiters-calling",
      name: "Smiter's Calling",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.BonusWillpower,
        EnchantmentType.SmiteArmorPiercing,
      ],
    },
    "smiters-light": {
      id: "smiters-light",
      name: "Smiter's Light",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.BonusWillpower,
        EnchantmentType.SmiteArmorPiercing,
        EnchantmentType.BonusSmiteWeaponTier,
      ],
    },

    "vampires-blood": {
      id: "vampires-blood",
      name: "Vampire's Blood",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.BonusConstitution],
    },
    "vampires-gaze": {
      id: "vampires-gaze",
      name: "Vampire's Gaze",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.BonusConstitution,
        EnchantmentType.VampireArmorPiercing,
      ],
    },
    "vampires-darkness": {
      id: "vampires-darkness",
      name: "Vampire's Darkness",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.BonusConstitution,
        EnchantmentType.VampireArmorPiercing,
        EnchantmentType.VampireArmorPiercing,
      ],
    },
    // combine now or later?
    "heros-guidance": {
      id: "heros-guidance",
      name: "Hero's Guidance",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        EnchantmentType.BonusAllStats,
        EnchantmentType.BonusAllStats,
        EnchantmentType.VampireArmorPiercing,
        EnchantmentType.VampireArmorPiercing,
        EnchantmentType.MinusEnemyArmor,
        EnchantmentType.BonusWeaponTier,
        EnchantmentType.RangedSecondAttackChance,
        EnchantmentType.IncreasedGoldCap,
      ],
    },
    "orb-of-forbidden-power": {
      id: "orb-of-forbidden-power",
      name: "Orb of Forbidden Power",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        // Orb specific
        EnchantmentType.CanTravelOnForbidden,
        EnchantmentType.BonusDust,
        EnchantmentType.IncreasedGoldCap, // 2 of these total
        // Kraken Shell Medallion
        EnchantmentType.DoubleAllStats,
        EnchantmentType.BonusArmorTier,
        // Interesting Mechanical Trophy
        EnchantmentType.DoubleAllStats,
        EnchantmentType.ImprovedAutomation,
        // Hidden Stump Trophy
        EnchantmentType.DoubleAllStats,
        EnchantmentType.DoubleDodge,
        // Engraved Lich Rib
        EnchantmentType.DoubleAllStats,
        EnchantmentType.BonusWeaponTier,
        // Totem of Heroic Rebirth
        EnchantmentType.AutoBattle,
        EnchantmentType.DoubleExperience,
        EnchantmentType.CanRebirth,
        // Aqua Lungs
        EnchantmentType.CanTravelOnWater,
        // Naga Scale
        EnchantmentType.CounterSpell,
        EnchantmentType.BonusWeaponTier,
        // Alvarado’s Cloak
        EnchantmentType.DoubleAccuracy,
        EnchantmentType.DoubleDodge,
        // Hero's Guidance
        EnchantmentType.BonusAllStats,
        EnchantmentType.BonusAllStats,
        EnchantmentType.VampireArmorPiercing,
        EnchantmentType.VampireArmorPiercing,
        EnchantmentType.MinusEnemyArmor,
        EnchantmentType.BonusWeaponTier,
        EnchantmentType.RangedSecondAttackChance,
        EnchantmentType.IncreasedGoldCap, // 2 of these total
      ],
    },
    "cracked-orb-of-forbidden-power": {
      id: "cracked-orb-of-forbidden-power",
      name: "Cracked Orb of Forbidden Power",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [
        // Orb specific
        EnchantmentType.CanTravelOnForbidden,
        EnchantmentType.BonusDust,
        EnchantmentType.IncreasedGoldCap, // 2 of these total
        // Kraken Shell Medallion
        EnchantmentType.DoubleAllStats,
        EnchantmentType.BonusArmorTier,
        // Interesting Mechanical Trophy
        EnchantmentType.DoubleAllStats,
        EnchantmentType.ImprovedAutomation,
        // Hidden Stump Trophy
        EnchantmentType.DoubleAllStats,
        EnchantmentType.DoubleDodge,
        // Engraved Lich Rib
        EnchantmentType.DoubleAllStats,
        EnchantmentType.BonusWeaponTier,
        // Totem of Heroic Rebirth
        EnchantmentType.AutoBattle,
        EnchantmentType.DoubleExperience,
        EnchantmentType.CanRebirth,
        // Aqua Lungs
        EnchantmentType.CanTravelOnWater,
        // Naga Scale
        EnchantmentType.CounterSpell,
        EnchantmentType.BonusWeaponTier,
        // Alvarado’s Cloak
        EnchantmentType.DoubleAccuracy,
        EnchantmentType.DoubleDodge,
        // Hero's Guidance
        EnchantmentType.BonusAllStats,
        EnchantmentType.BonusAllStats,
        EnchantmentType.VampireArmorPiercing,
        EnchantmentType.VampireArmorPiercing,
        EnchantmentType.MinusEnemyArmor,
        EnchantmentType.BonusWeaponTier,
        EnchantmentType.RangedSecondAttackChance,
        EnchantmentType.IncreasedGoldCap, // 2 of these total
      ],
    },

    // settlement management upgrades
    "governors-title": {
      id: "governors-title",
      name: "Governor's Title",
      type: InventoryItemType.Quest,
      level: 1,
      canBuy: false,
      passiveEnchantments: [EnchantmentType.UpgradedSettlement],
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
