import { ArtifactAttributeType, InventoryItemType } from "types/graphql";
import { BaseItems } from "schema/items/base-items";

type BuiltInOption = {
  affix: ArtifactAttributeType;
  minValue: number;
  maxValue: number;
  step: number;
};
/*

export type BaseItem = {
  id: string;
  name: string;
  type: InventoryItemType;
  level: number;
  cost?: number;
  canBuy: boolean;
  passiveEnchantments?: EnchantmentType[];
};



  Accessory = 'Accessory',
  BodyArmor = 'BodyArmor',
  FootArmor = 'FootArmor',
  HandArmor = 'HandArmor',
  HeadArmor = 'HeadArmor',
  LegArmor = 'LegArmor',
  MeleeWeapon = 'MeleeWeapon',
  Quest = 'Quest',
  RangedWeapon = 'RangedWeapon',
  Shield = 'Shield',
  SpellFocus = 'SpellFocus'

*/
export function getBuiltInOptiobsForItem(baseItem: string): BuiltInOption[] {
  const options: BuiltInOption[] = [];
  const item = BaseItems[baseItem];
  if (!item) {
    return options;
  }
  if (
    item.type === InventoryItemType.BodyArmor ||
    item.type === InventoryItemType.FootArmor ||
    item.type === InventoryItemType.HandArmor ||
    item.type === InventoryItemType.HeadArmor ||
    item.type === InventoryItemType.Shield ||
    item.type === InventoryItemType.LegArmor
  ) {
    // any armor
    options.push({
      affix: ArtifactAttributeType.ItemBonusArmor,
      minValue: 1,
      maxValue: 20,
      step: 1,
    });
  }
  if (item.type === InventoryItemType.BodyArmor) {
    // just body armor
    options.push({
      affix: ArtifactAttributeType.ItemFlatArmor,
      minValue: 1 * item.level,
      maxValue: 10 * item.level,
      step: 1,
    });
  }
  if (
    item.type === InventoryItemType.MeleeWeapon ||
    item.type === InventoryItemType.RangedWeapon ||
    item.type === InventoryItemType.SpellFocus
  ) {
    // any weapon
    options.push({
      affix: ArtifactAttributeType.ItemBonusDamage,
      minValue: 1,
      maxValue: 20,
      step: 1,
    });
  }

  return options;
}
