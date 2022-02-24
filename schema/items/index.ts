import { InventoryItemType, EnchantmentType } from "types/graphql";

export type BaseItem = {
  id: string;
  name: string;
  type: InventoryItemType;
  level: number;
  cost?: number;
  canBuy: boolean;
  passiveEnchantments?: EnchantmentType[];
};

export type BaseItemMap = { [x: string]: BaseItem };
