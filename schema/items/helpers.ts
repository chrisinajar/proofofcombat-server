import {
  InventoryItemType,
  InventoryItem,
  Hero,
  EnchantmentType,
} from "types/graphql";
import { v4 as uuidv4 } from "uuid";

import { BaseItem } from "./";
import { BaseItems } from "./base-items";

export function enchantItem(
  item: InventoryItem,
  enchantment: EnchantmentType
): InventoryItem {
  item.enchantment = enchantment;
  return item;
}

export function randomEnchantment(level: number): EnchantmentType {
  const options = [
    EnchantmentType.BonusStrength,
    EnchantmentType.BonusDexterity,
    EnchantmentType.BonusConstitution,
    EnchantmentType.BonusIntelligence,
    EnchantmentType.BonusWisdom,
    EnchantmentType.BonusCharisma,
    EnchantmentType.BonusLuck,
    EnchantmentType.BonusPhysical,
    EnchantmentType.BonusMental,
    EnchantmentType.BonusAllStats,
    EnchantmentType.MinusEnemyArmor,
    EnchantmentType.BonusArmor,
    EnchantmentType.MinusEnemyStrength,
    EnchantmentType.MinusEnemyDexterity,
    EnchantmentType.MinusEnemyConstitution,
    EnchantmentType.MinusEnemyIntelligence,
    EnchantmentType.MinusEnemyWisdom,
    EnchantmentType.MinusEnemyCharisma,
    EnchantmentType.MinusEnemyPhysical,
    EnchantmentType.MinusEnemyMental,
    EnchantmentType.MinusEnemyAllStats,
  ];

  return options[Math.floor(Math.random() * options.length)];
}

export function randomBaseItem(level: number): BaseItem {
  let maxLevel = 0;

  let options = Object.values(BaseItems).filter((item) => {
    if (item.level < level) {
      maxLevel = Math.max(item.level, maxLevel);
    }
    return (
      item.canBuy &&
      item.cost &&
      item.type !== InventoryItemType.Quest &&
      item.level === level
    );
  });

  if (!options.length) {
    options = Object.values(BaseItems).filter(
      (item) =>
        item.canBuy &&
        item.cost &&
        item.type !== InventoryItemType.Quest &&
        item.level === maxLevel
    );
  }

  return options[Math.floor(Math.random() * options.length)];
}

export function createItemInstance(item: BaseItem, owner: Hero): InventoryItem {
  const id = uuidv4();
  return {
    id,
    owner: owner.id,
    baseItem: item.id,

    name: item.name,
    type: item.type,
    level: item.level,
    enchantment: null,
  };
}
