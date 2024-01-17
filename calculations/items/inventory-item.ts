import { InventoryItemType, EnchantmentType } from "types/graphql";

import { BaseItems } from "../../schema/items/base-items";

import { Item, ItemOptions } from "./item";
import { GenericArmorModifier } from "../modifiers/generic-armor-modifier";
import { modifiersForEnchantment } from "../modifiers/enchantments";

export type InventoryItemOptions = ItemOptions & {
  type: InventoryItemType;
  baseItem: string;
  enchantment?: EnchantmentType | null;
};

export class InventoryItem extends Item {
  type: InventoryItemType;
  baseItem: string;
  enchantment?: EnchantmentType | null;

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

    if (this.enchantment) {
      const modifiers = modifiersForEnchantment(this.enchantment);
      modifiers.forEach((modifier) => {
        this.registerModifier(modifier);
      });
    }

    const baseItem = BaseItems[this.baseItem];

    if (baseItem && baseItem.passiveEnchantments) {
      baseItem.passiveEnchantments.forEach((enchantment) => {
        const modifiers = modifiersForEnchantment(enchantment);
        modifiers.forEach((modifier) => {
          this.registerModifier(modifier);
        });
      });
    }
  }
}
