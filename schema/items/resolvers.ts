import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  InventoryItem,
  LevelUpResponse,
  ShopItem,
  EnchantmentType,
  InventoryItemType,
  TradeOfferReply,
  TradeOffer,
  ArtifactAttribute,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { getEnchantedAttributes } from "../../combat/enchantments";
import { createHeroCombatant } from "../../combat/hero";
import { BaseItems } from "../items/base-items";
import { createItemInstance, countEnchantments } from "../items/helpers";
import type { BaseItem } from "../items";
import { hasQuestItem, takeQuestItem } from "../quests/helpers";

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
        .filter((item) => item.canBuy)
        .sort((a, b) => a.level - b.level)
        .map((baseItem) => ({
          id: baseItem.id,
          name: baseItem.name,
          type: baseItem.type,
          cost: baseItem.cost,
          level: baseItem.level,
        }));
    },
  },
  Mutation: {
    async imbueItem(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);

      const item = hero.inventory.find((i) => i.id === args.item);
      if (!item) {
        throw new UserInputError("Invalid item");
      }

      if (item.imbue) {
        throw new UserInputError("Item is already imbued");
      }

      const artifact = hero.equipment.artifact;
      if (!artifact || artifact.id !== args.artifact) {
        throw new UserInputError("Invalid artifact");
      }

      const affixes = args.affixes;

      if (affixes.length > 3) {
        throw new UserInputError("Too many affixes");
      }

      // make sure we have enough dust
      const dustCost = Math.pow(32, affixes.length);
      if (hero.enchantingDust < dustCost) {
        throw new UserInputError("Not enough enchanting dust");
      }
      // make sure we have both void and pure essence
      if (
        !hasQuestItem(hero, "essence-of-void") ||
        !hasQuestItem(hero, "pure-essence")
      ) {
        throw new UserInputError("Missing required quest items");
      }

      // take dust and essences
      hero.enchantingDust -= dustCost;
      takeQuestItem(hero, "essence-of-void");
      takeQuestItem(hero, "pure-essence");

      hero.equipment.artifact = null;

      const artifactAffixes =
        context.db.artifact.modifiersForArtifact(artifact);

      const selectedAffixes = affixes
        .map((affix) => artifactAffixes.find((a) => a.type === affix))
        .filter((a): a is ArtifactAttribute => !!a);
      const goalImbueLength = Math.min(
        3,
        Math.min(selectedAffixes.length + 1, artifactAffixes.length),
      );

      for (
        let i = 0;
        selectedAffixes.length < goalImbueLength && i < 100;
        i++
      ) {
        // grab a randomized affix from the list and make sure it isn't already selected
        const affix =
          artifactAffixes[Math.floor(Math.random() * artifactAffixes.length)];
        if (!selectedAffixes.find((a) => a.type === affix.type)) {
          selectedAffixes.push(affix);
        }
      }

      item.imbue = {
        artifact,
        affixes: selectedAffixes.map((a) => a.type),
      };

      await context.db.hero.put(hero);

      const account = await context.db.account.get(context.auth.id);

      return {
        hero,
        account,
      };
    },
    async dismissTrade(parent, args, context): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const offer = await context.db.trades.get(args.offer);
      if (!offer) {
        throw new UserInputError("Invalid trade");
      }

      if (offer.fromId !== hero.id && offer.toId !== hero.id) {
        throw new UserInputError("Invalid trade");
      }

      await context.db.trades.del(offer);

      return {
        hero,
        account,
      };
    },
    async acceptTrade(parent, args, context): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const offer = await context.db.trades.get(args.offer);
      if (!offer) {
        throw new UserInputError("Invalid trade");
      }

      if (offer.toId !== hero.id) {
        throw new UserInputError("Invalid trade");
      }
      if (offer.gold > hero.gold) {
        throw new UserInputError("Invalid trade");
      }

      const offerHero = await context.db.hero.get(offer.fromId);

      const offerItem = offerHero.inventory.find(
        (item) => item.id === offer.item.id,
      );

      if (!offerItem) {
        throw new UserInputError("Invalid trade");
      }

      // delete all the offers involving this item
      await Promise.all(
        (
          await context.db.trades.offersForItem(offerItem.id)
        ).map((otherOffers) => context.db.trades.del(offer)),
      );

      offerHero.inventory = offerHero.inventory.filter(
        (item) => item.id !== offerItem.id,
      );
      offerHero.gold += Math.round(offer.gold);
      await context.db.hero.put(offerHero);

      hero.gold -= Math.round(offer.gold);
      offerItem.owner = hero.id;
      hero.inventory.push(offerItem);

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
    async offerTrade(parent, args, context): Promise<TradeOfferReply> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.id === args.offer.to) {
        throw new UserInputError("You cannot trade with yourself");
      }
      const item = hero.inventory.find((item) => item.id === args.offer.item);
      if (!item) {
        throw new UserInputError("Fail to find that item");
      }

      const toHero = await context.db.hero.get(args.offer.to);
      if (!toHero) {
        throw new UserInputError("Target hero does not exist");
      }

      const gold = args.offer.gold;

      if (
        gold < 1 ||
        gold > context.db.hero.maxGold(hero) ||
        isNaN(gold) ||
        !Number.isFinite(gold)
      ) {
        throw new UserInputError("Target hero does not exist");
      }

      const trade: TradeOffer = await context.db.trades.create(
        hero,
        toHero,
        item,
        gold,
      );

      context.io.sendPrivateMessage(toHero.id, {
        id: Math.random(),
        message: "has offered to trade an item with you",
        from: hero.name,
        to: toHero.id,
        heroId: hero.id,
        type: "private",
        time: Math.round(Date.now() / 1000),
      });

      return {
        hero,
        account,
        trade,
      };
    },
    async enchantItem(
      parent,
      args,
      context: BaseContext,
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const itemId: string = args.item;
      const item: InventoryItem | undefined = hero.inventory.find(
        (item: InventoryItem) => item.id === itemId,
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
          "You need more enchanting dust to enchant that item!",
        );
      }

      const hasEnchantment = hero.enchantments.find(
        (ench: EnchantmentType) => ench === args.enchantment,
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
      context: BaseContext,
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const itemId: string = args.item;
      const item: InventoryItem | undefined = hero.inventory.find(
        (item: InventoryItem) => item.id === itemId,
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
          "You need more enchanting dust to disenchant that item!",
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
      context: BaseContext,
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const itemId: string = args.item;
      const item: InventoryItem | undefined = hero.inventory.find(
        (item: InventoryItem) => item.id === itemId,
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
        (i: InventoryItem) => i.id !== item.id,
      );

      hero.enchantingDust =
        hero.enchantingDust +
        1 +
        countEnchantments(hero, EnchantmentType.BonusDust);

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
        (item: InventoryItem) => item.id === args.item,
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
        (item: InventoryItem) => item.id === itemId,
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
        (item: InventoryItem) => item.id !== itemId,
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
