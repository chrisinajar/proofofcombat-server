import {
  InventoryItemImbue,
  InventoryItemType,
  InventoryItem as InventoryItemData,
  EnchantmentType,
  ArtifactItem,
  HeroClasses,
  ArtifactAttribute,
  ArtifactAttributeType,
} from "types/graphql";

import { BaseItems } from "../../schema/items/base-items";

import { Item, ItemOptions } from "./item";
import { GenericArmorModifier } from "../modifiers/generic-armor-modifier";
import {
  modifiersForEnchantment,
  ModifierDefinition,
} from "../modifiers/enchantments";
import { Modifier } from "../modifiers/modifier";

export type InventoryItemOptions = ItemOptions & { item: InventoryItemData };

export class InventoryItem extends Item {
  item: InventoryItemData;
  victimModifiers: ModifierDefinition<Modifier<any>>[] = [];

  constructor(options: InventoryItemOptions) {
    super(options);

    this.item = options.item;

    if (
      this.item.type === InventoryItemType.BodyArmor ||
      this.item.type === InventoryItemType.LegArmor ||
      this.item.type === InventoryItemType.FootArmor ||
      this.item.type === InventoryItemType.HandArmor ||
      this.item.type === InventoryItemType.HeadArmor ||
      this.item.type === InventoryItemType.Shield
    ) {
      // extract built-ins relevant to armor
      const flatArmor = (this.item.builtIns || [])
        .filter((a) => a.type === ArtifactAttributeType.ItemFlatArmor)
        .reduce((m, a) => m + a.magnitude, 0);
      const bonusArmor = (this.item.builtIns || [])
        .filter((a) => a.type === ArtifactAttributeType.ItemBonusArmor)
        .reduce((m, a) => m + a.magnitude, 0);

      this.registerModifier(GenericArmorModifier, {
        tier: this.level,
        type: this.item.type,
        builtInFlatArmor: flatArmor,
        builtInBonusArmor: bonusArmor,
      });
    }

    if (this.item.enchantment) {
      const modifiers = modifiersForEnchantment(
        this.item.enchantment,
        this.unit.attackType,
      );
      this.victimModifiers = this.victimModifiers.concat(modifiers.victim);
      modifiers.attacker.forEach((modifier) => {
        this.registerModifier(modifier);
      });
    }

    const baseItem = BaseItems[this.item.baseItem];

    if (baseItem && baseItem.passiveEnchantments) {
      baseItem.passiveEnchantments.forEach((enchantment) => {
        const modifiers = modifiersForEnchantment(
          enchantment,
          this.unit.attackType,
        );
        this.victimModifiers = this.victimModifiers.concat(modifiers.victim);
        modifiers.attacker.forEach((modifier) => {
          this.registerModifier(modifier);
        });
      });
    }

    if (this.item.imbue) {
      this.unit.equipArtifact(
        this.item.imbue.artifact,
        this.item.imbue.affixes,
      );
    }
  }
}
