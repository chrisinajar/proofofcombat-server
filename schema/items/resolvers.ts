import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  InventoryItem,
  LevelUpResponse,
  ShopItem,
  EnchantmentType,
  InventoryItemType,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { createHeroCombatant, getEnchantedAttributes } from "../../combat";
import { BaseItems } from "../items/base-items";
import { createItemInstance } from "../items/helpers";
import type { BaseItem } from "../items";

type SlotNameType =
  | "leftHand"
  | "rightHand"
  | "bodyArmor"
  | "handArmor"
  | "legArmor"
  | "headArmor"
  | "footArmor";

const resolvers: Resolvers = {
  Query: {
    async shopItems(parent, args, context: BaseContext): Promise<ShopItem[]> {
      return Object.values<BaseItem>(BaseItems)
        .sort((a, b) => a.level - b.level)
        .map((baseItem) => ({
          id: baseItem.id,
          name: baseItem.name,
          type: baseItem.type,
          cost: baseItem.cost,
        }));
    },
  },
  Mutation: {
    async enchantItem(
      parent,
      args,
      context: BaseContext
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const itemId: string = args.item;
      const item: InventoryItem | undefined = hero.inventory.find(
        (item: InventoryItem) => item.id === itemId
      );

      if (!item) {
        throw new UserInputError(`Unknown item: ${itemId}`);
      }
      const baseItem = BaseItems[item.baseItem];
      console.log(hero.name, "enchanting", baseItem.name, args.enchantment);

      if (item.enchantment) {
        throw new UserInputError("This item is already enchanted!");
      }

      if (hero.enchantingDust < item.level) {
        throw new UserInputError(
          "You need more enchanting dust to enchant that item!"
        );
      }

      const hasEnchantment = hero.enchantments.find(
        (ench: EnchantmentType) => ench === args.enchantment
      );
      if (!hasEnchantment) {
        throw new UserInputError("You do not have that enchantment!");
      }

      let didRemove = false;
      hero.enchantments = hero.enchantments.filter((ench: EnchantmentType) => {
        if (didRemove) {
          return true;
        }
        if (ench === hasEnchantment) {
          didRemove = true;
          return false;
        }
        return true;
      });

      item.enchantment = hasEnchantment;
      hero.enchantingDust -= item.level;

      await context.db.hero.put(hero);

      return { hero, account };
    },
    async disenchantItem(
      parent,
      args,
      context: BaseContext
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const itemId: string = args.item;
      const item: InventoryItem | undefined = hero.inventory.find(
        (item: InventoryItem) => item.id === itemId
      );

      if (!item) {
        throw new UserInputError(`Unknown item: ${itemId}`);
      }
      const baseItem = BaseItems[item.baseItem];
      console.log(hero.name, "disenchanting", baseItem.name);

      if (!item.enchantment) {
        throw new UserInputError("You cannot disenchant non-enchanted items!");
      }

      if (
        itemId === hero.equipment.leftHand?.id ||
        itemId === hero.equipment.rightHand?.id ||
        itemId === hero.equipment.bodyArmor?.id ||
        itemId === hero.equipment.handArmor?.id ||
        itemId === hero.equipment.legArmor?.id ||
        itemId === hero.equipment.headArmor?.id ||
        itemId === hero.equipment.footArmor?.id
      ) {
        throw new UserInputError("You cannot disenchant equipped items!");
      }

      if (hero.enchantingDust < item.level) {
        throw new UserInputError(
          "You need more enchanting dust to disenchant that item!"
        );
      }

      const enchantment = item.enchantment;

      item.enchantment = null;
      hero.enchantments.push(enchantment);
      hero.enchantingDust -= item.level;

      await context.db.hero.put(hero);

      return { hero, account };
    },
    async destroyItem(
      parent,
      args,
      context: BaseContext
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const itemId: string = args.item;
      const item: InventoryItem | undefined = hero.inventory.find(
        (item: InventoryItem) => item.id === itemId
      );

      if (!item) {
        throw new UserInputError(`Unknown item: ${itemId}`);
      }
      const baseItem = BaseItems[item.baseItem];
      console.log(hero.name, "destroying", baseItem.name);

      if (!baseItem.cost || !baseItem.canBuy) {
        throw new UserInputError("You can only destroy normal items!");
      }
      if (!item.enchantment) {
        throw new UserInputError("You cannot destroy non-enchanted items!");
      }

      if (
        itemId === hero.equipment.leftHand?.id ||
        itemId === hero.equipment.rightHand?.id ||
        itemId === hero.equipment.bodyArmor?.id ||
        itemId === hero.equipment.handArmor?.id ||
        itemId === hero.equipment.legArmor?.id ||
        itemId === hero.equipment.headArmor?.id ||
        itemId === hero.equipment.footArmor?.id
      ) {
        throw new UserInputError("You cannot destroy equipped items!");
      }

      hero.inventory = hero.inventory.filter(
        (i: InventoryItem) => i.id !== item.id
      );

      hero.enchantingDust = hero.enchantingDust + 1;

      await context.db.hero.put(hero);

      return { hero, account };
    },
    async equip(parent, args, context: BaseContext): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const slotNames: SlotNameType[] = [
        "leftHand",
        "rightHand",
        "bodyArmor",
        "handArmor",
        "legArmor",
        "headArmor",
        "footArmor",
      ];

      const slot = slotNames.find((s) => s === args.slot);

      if (!slot) {
        throw new UserInputError("Invalid slot name!");
      }

      const inventoryItem = hero.inventory.find(
        (item: InventoryItem) => item.id === args.item
      );

      if (!inventoryItem) {
        throw new UserInputError("Could not find that item in your inventory!");
      }

      console.log(hero.name, "Equipping", inventoryItem, "to slot", args.slot);

      if (inventoryItem.type === InventoryItemType.RangedWeapon) {
        hero.equipment.leftHand = inventoryItem;
        hero.equipment.rightHand = inventoryItem;
      } else {
        hero.equipment[slot] = inventoryItem;

        if (slot === "leftHand" || slot === "rightHand") {
          // it's not a bow, so make sure the other isn't
          if (
            hero.equipment.leftHand?.type === InventoryItemType.RangedWeapon
          ) {
            hero.equipment.leftHand = null;
          }
          if (
            hero.equipment.rightHand?.type === InventoryItemType.RangedWeapon
          ) {
            hero.equipment.rightHand = null;
          }
        }
      }

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
    async buy(parent, args, context: BaseContext): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const baseItemName: string = args.baseItem;

      if (!BaseItems[baseItemName]) {
        throw new UserInputError(`Unknown item: ${baseItemName}`);
      }
      const baseItem = BaseItems[baseItemName];

      if (!baseItem.cost || !baseItem.canBuy) {
        throw new UserInputError("Item cannot be bought!");
      }
      if (baseItem.cost > hero.gold) {
        throw new UserInputError("You do not have enough gold for that item!");
      }
      console.log(hero.name, "Trying to buy a", baseItem);

      hero.gold = hero.gold - baseItem.cost;

      const itemInstance = createItemInstance(baseItem, hero);

      hero.inventory.push(itemInstance);

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
    async sell(parent, args, context: BaseContext): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const itemId: string = args.item;
      const item: InventoryItem | undefined = hero.inventory.find(
        (item: InventoryItem) => item.id === itemId
      );

      if (!item) {
        throw new UserInputError(`Unknown item: ${itemId}`);
      }
      const baseItem = BaseItems[item.baseItem];
      console.log(hero.name, "selling", baseItem.name);

      if (!baseItem.cost || !baseItem.canBuy) {
        throw new UserInputError("Item cannot be sold!");
      }
      if (item.enchantment) {
        throw new UserInputError("You cannot sell enchanted items!");
      }

      if (
        itemId === hero.equipment.leftHand?.id ||
        itemId === hero.equipment.rightHand?.id ||
        itemId === hero.equipment.bodyArmor?.id ||
        itemId === hero.equipment.handArmor?.id ||
        itemId === hero.equipment.legArmor?.id ||
        itemId === hero.equipment.headArmor?.id ||
        itemId === hero.equipment.footArmor?.id
      ) {
        throw new UserInputError("You cannot sell equipped items!");
      }

      hero.gold = hero.gold + Math.round(baseItem.cost / 3);

      hero.inventory = hero.inventory.filter(
        (item: InventoryItem) => item.id !== itemId
      );

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
  },
};

export default resolvers;
