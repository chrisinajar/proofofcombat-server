import { InventoryItemType } from "types/graphql";

import { BaseItem, BaseItemMap } from "./";

import { getQuestRewards } from "../quests/items";

function generateArmorItems(itemNames: string[]): BaseItemMap {
  return {
    ...generateItems(
      InventoryItemType.BodyArmor,
      itemNames.map((name) => `${name} Body Armor`)
    ),
    ...generateItems(
      InventoryItemType.HandArmor,
      itemNames.map((name) => `${name} Gauntlets`)
    ),
    ...generateItems(
      InventoryItemType.LegArmor,
      itemNames.map((name) => `${name} Leggings`)
    ),
    ...generateItems(
      InventoryItemType.HeadArmor,
      itemNames.map((name) => `${name} Helmet`)
    ),
    ...generateItems(
      InventoryItemType.FootArmor,
      itemNames.map((name) => `${name} Greaves`)
    ),
  };
}

function nameToId(name: string): string {
  return name.toLowerCase().replace(/\s+/g, "-");
}

function generateItems(
  type: InventoryItemType,
  itemNames: string[]
): BaseItemMap {
  const results: BaseItemMap = {};
  itemNames.forEach((name, i) => {
    const level = i + 1;
    const cost = Math.round(Math.pow(1.77827941004, i + 1)) * 10;
    // console.log("Level", level, "item", name, "costs", cost, id);
    const id = nameToId(name);

    results[id] = {
      id,
      name,
      level,
      cost,
      type,
      // this function is only used by base shop items
      canBuy: true,
    };
  });

  return results;
}

function getNonDropGear(): BaseItemMap {
  const itemMap: BaseItemMap = {};
  const optionMap: { [x in InventoryItemType]?: string[] } = {
    [InventoryItemType.MeleeWeapon]: ["Ascended Blade", "Transcended Saber"],
    [InventoryItemType.RangedWeapon]: [
      "Ascended Battle Bow",
      "Transcended Crossbow",
    ],
    [InventoryItemType.Shield]: ["Ascended Shield", "Transcended Shield"],
    [InventoryItemType.SpellFocus]: ["Ascended Wand", "Transcended Wand"],
  };
  const armorNames = ["Ascended", "Transcended"];
  const startLevel = 33;

  const types = [
    InventoryItemType.MeleeWeapon,
    InventoryItemType.RangedWeapon,
    InventoryItemType.Shield,
    InventoryItemType.SpellFocus,
  ];

  types.forEach((type) => {
    optionMap[type]?.forEach((name, i) => {
      const id = nameToId(name);

      itemMap[id] = {
        id,
        name,
        level: startLevel + i,
        cost: 0,
        type,
        canBuy: false,
      };
    });
  });

  armorNames.forEach((name, i) => {
    itemMap[nameToId(`${name} Body Armor`)] = {
      id: nameToId(`${name} Body Armor`),
      type: InventoryItemType.BodyArmor,
      name: `${name} Body Armor`,
      level: startLevel + i,
      cost: 0,
      canBuy: false,
    };
    itemMap[nameToId(`${name} Gauntlets`)] = {
      id: nameToId(`${name} Gauntlets`),
      type: InventoryItemType.HandArmor,
      name: `${name} Gauntlets`,
      level: startLevel + i,
      cost: 0,
      canBuy: false,
    };
    itemMap[nameToId(`${name} Leggings`)] = {
      id: nameToId(`${name} Leggings`),
      type: InventoryItemType.LegArmor,
      name: `${name} Leggings`,
      level: startLevel + i,
      cost: 0,
      canBuy: false,
    };
    itemMap[nameToId(`${name} Helmet`)] = {
      id: nameToId(`${name} Helmet`),
      type: InventoryItemType.HeadArmor,
      name: `${name} Helmet`,
      level: startLevel + i,
      cost: 0,
      canBuy: false,
    };
    itemMap[nameToId(`${name} Greaves`)] = {
      id: nameToId(`${name} Greaves`),
      type: InventoryItemType.FootArmor,
      name: `${name} Greaves`,
      level: startLevel + i,
      cost: 0,
      canBuy: false,
    };
  });

  return itemMap;
}

export const BaseItems: BaseItemMap = {
  ...generateItems(InventoryItemType.MeleeWeapon, [
    "Broken Dagger",
    "Sharpened Knife",
    "Club",
    "Sickle",
    "Quarterstaff",
    "Handaxe",
    "Spiked Club",
    "Short Sword",
    "Mace",
    "Double Axe",
    "Spear",
    "Carved Bone Knife",
    "Battle Axe",
    "War Hammer",
    "Flail",
    "Halberd",
    "Dragontooth Sword",
    "Warlord's Longsword",
    "Glowing Metal Greatsword",
    "Ornate Poleaxe",
    "Firebrand",
    "Diamond Blade",
    "Spirit Knife",
    "Spectral Katana",
    "Hydra Sword",
    "Mithral Bardiche",
    "Destructive Longsword",
    "Livingiron Mancatcher",
    "Doombringer",
    "Demontouched Waraxe",
    "Eternal Sword",
    "Soulbound Warhammer",
  ]),
  ...generateItems(InventoryItemType.RangedWeapon, [
    "Makeshift Slingshot",
    "Ruined Bow",
    "Sling",
    "Blowdart",
    "Short Bow",
    "Boomerang",
    "Hunters Bow",
    "Small Knife Kit",
    "Yew Bow",
    "Throwing Stars",
    "Longbow",
    "Onzil",
    "Composite Bow",
    "Light Crossbow",
    "Ashen Bow",
    "Heavy Crossbow",
    "Elvenwood Bow",
    "Dwarven Crossbow",
    "Elven Compound Bow",
    "Clockwork Crossbow",
    "Hand Ballista",
    "Forest Sweeper",
    "Spirit Bow",
    "Spectral Crossbow",
    "Hydra Bow",
    "Mithral Longbow",
    "Repeating Needler",
    "Battleforged Longbow",
    "Artillery Crossbow",
    "Demontouched Bow",
    "Eternal Shortbow",
    "Soulbound Hunter's Bow",
  ]),
  ...generateItems(InventoryItemType.Shield, [
    "Makeshift Shield",
    "Tree Bark Shield",
    "Carved Wooden Shield",
    "Studded Leather Shield",
    "Round Shield",
    "Reinforced Small Shield",
    "Rough Metal Shield",
    "Buckler",
    "Spiked Shield",
    "Kite Shield",
    "Wooden Tower Shield",
    "Heater Shield",
    "Bronze Lined Pavise",
    "Embossed Rondache",
    "Studded Targe",
    "Alloy Metal Shield",
    "Dragonscale Shield",
    "Warlord's Shield",
    "Glowing Metal Shield",
    "Repelling Orb",
    "Protector's Pavise",
    "Ancient Protector",
    "Canopy Shield",
    "Spectral Shield",
    "Hydra Shield",
    "Mithral Targe",
    "Avoidance Circle",
    "Livingiron Tower Shield",
    "Holy Rondache",
    "Demontouched Shield",
    "Eternal Shield",
    "Soulbound Protector",
  ]),
  ...generateItems(InventoryItemType.SpellFocus, [
    "Feathered Stick",
    "Dirty Pendant",
    "Ceremonial Dagger",
    "Long Staff",
    "Carved Wand",
    "Blessed Locket",
    "Ornate Wooden Staff",
    "Bone Shards",
    "Dreamcatcher",
    "Shrunken Head",
    "Runed Staff",
    "Glowing Bracelet",
    "Shaman's Skullstick",
    "Mage's Staff",
    "Griffon's Feather",
    "Ancient Vice",
    "Dragon's Eye",
    "Pouch of Stardust",
    "Archmage's Spine",
    "Tamed Black Pudding",
    "Angel Wing Feather",
    "Dragontooth Charm",
    "Celestial Bracelet",
    "Spectral Dust",
    "Hydra's Blood Vial",
    "Fey Wand",
    "Soulgem",
    "Construct Heart",
    "Bottled Dragon's Breath",
    "Demon's Contract",
    "Eternal Wand",
    "Soulbound Charm",
  ]),
  ...generateArmorItems([
    "Torn Cotten",
    "Padded Cloth",
    "Loose Hide",
    "Boiled Leather",
    "Hardened Leather",
    "Studded Leather",
    "Rough Metal",
    "Scale Mail",
    "Lamellar",
    "Plated Leather",
    "Chain Mail",
    "Steel Riveted Brigandine",
    "Trollskin Leather",
    "Plate Mail",
    "Full Plate",
    "Dwarven Forged",
    "Dragonscale",
    "Warlord's Plate",
    "Glowing Metal",
    "Spellforged",
    "Heavenly Plate",
    "Dragonbone",
    "Spirit",
    "Spectral",
    "Hydrascale",
    "Mithral",
    "Fire Emboldened",
    "Livingiron",
    "Enchanted Shellcage",
    "Demontouched",
    "Eternal",
    "Soulbound",
  ]),
  ...getNonDropGear(),
  ...getQuestRewards(),
};
