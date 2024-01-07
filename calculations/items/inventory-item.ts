import { InventoryItemType, EnchantmentType } from "types/graphql";

import { Item, ItemOptions } from "./item";
import { GenericArmorModifier } from "../modifiers/generic-armor-modifier";

export type InventoryItemOptions = ItemOptions & {
  type: InventoryItemType;
  baseItem: string;
  enchantment?: EnchantmentType;
};

export class InventoryItem extends Item {
  type: InventoryItemType;
  baseItem: string;
  enchantment?: EnchantmentType;

  constructor(options: InventoryItemOptions) {
    super(options);

    this.type = options.type;
    this.baseItem = options.baseItem;
    this.enchantment = options.enchantment;

    if (
      this.type === InventoryItemType.BodyArmor ||
      this.type === InventoryItemType.LegArmor ||
      this.type === InventoryItemType.FootArmor ||
      this.type === InventoryItemType.HandArmor ||
      this.type === InventoryItemType.HeadArmor ||
      this.type === InventoryItemType.Shield
    ) {
      this.registerModifier(GenericArmorModifier, {
        tier: this.level,
        shield: this.type === InventoryItemType.Shield,
      });
    }
  }
}
