import { ArtifactAttributeType, InventoryItemType } from "types/graphql";
import { BaseItems } from "../../schema/items/base-items";

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
export function getBuiltInOptionsForItem(baseItem: string): BuiltInOption[] {
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
      // percent bonus to this item's armor only (0.05 - 0.20)
      affix: ArtifactAttributeType.ItemBonusArmor,
      minValue: 0.05,
      maxValue: 0.2,
      step: 0.01,
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
      // percent bonus to this weapon's base damage only (0.05 - 0.20)
      affix: ArtifactAttributeType.ItemBonusDamage,
      minValue: 0.05,
      maxValue: 0.2,
      step: 0.01,
    });
    // flat damage added to this weapon's base damage only
    options.push({
      affix: ArtifactAttributeType.ItemFlatDamage,
      minValue: 1 * item.level,
      maxValue: 10 * item.level,
      step: 1,
    });
  }

  return options;
}
