import { InventoryItemType } from "types/graphql";

export type BaseItem = {
  id: string;
  name: string;
  type: InventoryItemType;
  level: number;
  cost?: number;
  canBuy: boolean;
};

export type BaseItemMap = { [x: string]: BaseItem };
