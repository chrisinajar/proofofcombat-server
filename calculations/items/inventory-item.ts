import {
  InventoryItemImbue,
  InventoryItemType,
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

export type InventoryItemOptions = ItemOptions & {
  type: InventoryItemType;
  baseItem: string;
  enchantment?: EnchantmentType | null;
  imbue?: InventoryItemImbue | null;
  builtIns?: ArtifactAttribute[] | null;
};

export class InventoryItem extends Item {
  baseItem: string;
  enchantment?: EnchantmentType | null;
  victimModifiers: ModifierDefinition<Modifier<any>>[] = [];
  builtIns?: ArtifactAttribute[] | null;

  constructor(options: InventoryItemOptions) {
    super(options);

    this.baseItem = options.baseItem;
    this.enchantment = options.enchantment;
    this.builtIns = options.builtIns || null;

    if (
      this.type === InventoryItemType.BodyArmor ||
      this.type === InventoryItemType.LegArmor ||
      this.type === InventoryItemType.FootArmor ||
      this.type === InventoryItemType.HandArmor ||
      this.type === InventoryItemType.HeadArmor ||
      this.type === InventoryItemType.Shield
    ) {
      // extract built-ins relevant to armor
      const flatArmor = (this.builtIns || [])
        .filter((a) => a.type === ArtifactAttributeType.ItemFlatArmor)
        .reduce((m, a) => m + a.magnitude, 0);
      const bonusArmor = (this.builtIns || [])
        .filter((a) => a.type === ArtifactAttributeType.ItemBonusArmor)
        .reduce((m, a) => m + a.magnitude, 0);

      this.registerModifier(GenericArmorModifier, {
        tier: this.level,
        type: this.type,
        builtInFlatArmor: flatArmor,
        builtInBonusArmor: bonusArmor,
      });
    }

    if (this.enchantment) {
      const modifiers = modifiersForEnchantment(
        this.enchantment,
        this.unit.attackType,
      );
      this.victimModifiers = this.victimModifiers.concat(modifiers.victim);
      modifiers.attacker.forEach((modifier) => {
        this.registerModifier(modifier);
      });
    }

    const baseItem = BaseItems[this.baseItem];

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

    if (options.imbue) {
      this.unit.equipArtifact(options.imbue.artifact, options.imbue.affixes);
    }
  }

  getWeaponFlatDamageBonus(): number {
    const flat = (this.builtIns || [])
      .filter((a) => a.type === ArtifactAttributeType.ItemFlatDamage)
      .reduce((m, a) => m + a.magnitude, 0);
    return flat;
  }

  getWeaponBonusDamageMultiplier(): number {
    const bonus = (this.builtIns || [])
      .filter((a) => a.type === ArtifactAttributeType.ItemBonusDamage)
      .reduce((m, a) => m + a.magnitude, 0);
    if (!bonus) {
      return 1;
    }
    return bonus >= 1 ? bonus : 1 + bonus;
  }
}
