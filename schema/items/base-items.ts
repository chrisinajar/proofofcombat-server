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

function generateItems(
  type: InventoryItemType,
  itemNames: string[]
): BaseItemMap {
  const results: BaseItemMap = {};
  itemNames.forEach((name, i) => {
    const level = i + 1;
    const cost = Math.round(Math.pow(2.3, i) * 10);
    const id = name.toLowerCase().replace(/\s+/g, "-");
    // console.log("Level", level, "item", name, "costs", cost, id);

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
    "Clockwork Crossbow",
    "Hydra Bow",
    "Hand Ballista",
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
    "Breast Plate",
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
  ]),
  ...getQuestRewards(),
};
