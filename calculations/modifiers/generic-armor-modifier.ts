import { InventoryItemType } from "types/graphql";
import { Modifier, ModifierOptions } from "./modifier";

export type GenericArmorModifierOptions = {
  // ? i dunno something like this
  tier: number;
  type?: InventoryItemType;
  isDebuff?: boolean;
  // built-in per-item adjustments
  builtInFlatArmor?: number;
  builtInBonusArmor?: number; // 0.05 for +5%, or 1.05 if provided as multiplier
};

const ArmorSlotPenalties: { [x in InventoryItemType]: number } = {
  [InventoryItemType.BodyArmor]: 1, // = 'BodyArmor',
  [InventoryItemType.FootArmor]: 3, // = 'FootArmor',
  [InventoryItemType.HandArmor]: 3, // = 'HandArmor',
  [InventoryItemType.HeadArmor]: 2, // = 'HeadArmor',
  [InventoryItemType.LegArmor]: 2, // = 'LegArmor',
  [InventoryItemType.Shield]: 1, // = 'Shield',

  [InventoryItemType.Accessory]: 0, // = 'Accessory',
  [InventoryItemType.MeleeWeapon]: 0, // = 'MeleeWeapon',
  [InventoryItemType.Quest]: 0, // = 'Quest',
  [InventoryItemType.RangedWeapon]: 0, // = 'RangedWeapon',
  [InventoryItemType.SpellFocus]: 0, // = 'SpellFocus'
};

export class GenericArmorModifier extends Modifier<GenericArmorModifierOptions> {
  tier: number;
  type?: InventoryItemType;
  builtInFlatArmor: number = 0;
  builtInBonusArmor: number = 0;

  constructor(options: ModifierOptions<GenericArmorModifierOptions>) {
    super(options);

    this.tier = options.options.tier;
    this.type = options.options.type;
    this.builtInFlatArmor = options.options.builtInFlatArmor || 0;
    this.builtInBonusArmor = options.options.builtInBonusArmor || 0;

    if (!this.tier) {
      console.log("Got bad generic armor modifier", this.tier, options.options);
      this.tier = 0;
    }
  }
  armorForTier(tier: number): number {
    if (tier < 1) {
      return 0;
    }

    return this.adjustForSlot(
      Math.round((tier / 2 + Math.log(tier)) * Math.pow(tier, 1.3)),
    );
  }

  adjustForSlot(armor: number): number {
    const armorAdjustmentValue =
      ArmorSlotPenalties[this.type || InventoryItemType.BodyArmor];
    return (armor + armorAdjustmentValue) / armorAdjustmentValue;
  }
  getBonus(prop: string): number | void {
    if (prop === "armor") {
      const baseArmor = (() => {
        if (this.type === InventoryItemType.Shield) {
          return this.armorForTier(
            this.tier +
              this.parent.stats.bonusShieldTiers +
              this.parent.stats.bonusArmorTiers,
          );
        } else {
          return this.armorForTier(
            this.tier + this.parent.stats.bonusArmorTiers,
          );
        }
      })();

      const bonusMultiplier = this.builtInBonusArmor
        ? this.builtInBonusArmor >= 1
          ? this.builtInBonusArmor
          : 1 + this.builtInBonusArmor
        : 1;

      const flat = this.builtInFlatArmor || 0;

      return baseArmor * bonusMultiplier + flat;
    }
    return;
  }
  getMultiplier(prop: string): number | void {
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}
