import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  Hero,
  HealResponse,
  MonsterInstance,
  MoveResponse,
  MoveDirection,
  BaseAccount,
  LevelUpResponse,
  InventoryItem,
  EquipmentSlots,
  ShopItem,
  LeadboardEntry,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { LocationData, MapNames } from "../../constants";

import { BaseItems, createItemInstance } from "./items";
import type { BaseItem } from "./items";

const resolvers: Resolvers = {
  Query: {
    async leaderboard(
      parent,
      args,
      context: BaseContext
    ): Promise<LeadboardEntry[]> {
      return (await context.db.hero.getTopHeros()).map<LeadboardEntry>(
        (hero: Hero) => ({
          name: hero.name,
          gold: hero.gold,
          level: hero.level,
          id: hero.id,
        })
      );
    },
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
    async equip(parent, args, context: BaseContext): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const slotNames = [
        "leftHand",
        "rightHand",
        "bodyArmor",
        "handArmor",
        "legArmor",
        "headArmor",
        "footArmor",
      ];

      if (slotNames.indexOf(args.slot) < 0) {
        throw new UserInputError("Invalid slot name!");
      }

      const inventoryItem = hero.inventory.find(
        (item: InventoryItem) => item.id === args.item
      );

      if (!inventoryItem) {
        throw new UserInputError("Could not find that item in your inventory!");
      }

      console.log("Equipping", inventoryItem, "to slot", args.slot);

      hero.equipment[args.slot] = inventoryItem;

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

      if (!baseItem.cost) {
        throw new UserInputError("Item cannot be bought!");
      }
      if (baseItem.cost > hero.gold) {
        throw new UserInputError("You do not have enough gold for that item!");
      }
      console.log("Trying to buy a", baseItem);

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

      console.log(item);

      if (!item) {
        throw new UserInputError(`Unknown item: ${itemId}`);
      }
      const baseItem = BaseItems[item.baseItem];

      if (!baseItem.cost) {
        throw new UserInputError("Item cannot be sold!");
      }
      if (baseItem.cost > hero.gold) {
        throw new UserInputError("You do not have enough gold for that item!");
      }
      console.log("Trying to sell a", item.baseItem);

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

    async increaseAttribute(
      parent,
      args,
      context: BaseContext
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.attributePoints <= 0) {
        return {
          hero,
          account,
        };
      }

      if (!hero.stats[args.attribute]) {
        return {
          hero,
          account,
        };
      }

      hero.stats[args.attribute] = hero.stats[args.attribute] + 1;
      hero.attributePoints = hero.attributePoints - 1;
      hero = context.db.hero.recalculateStats(hero);

      console.log(hero.name, "increasing their", args.attribute);

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
    async heal(parent, args, context: BaseContext): Promise<HealResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const account = await context.db.account.get(context.auth.id);
      const hero = await context.db.hero.get(context.auth.id);
      console.log("Healing", hero.name);
      hero.combat.health = hero.combat.maxHealth;
      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
    async move(parent, args, context: BaseContext): Promise<MoveResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (hero.combat.health <= 0) {
        throw new UserInputError("You cannot move while dead!");
      }

      const location =
        LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
          hero.location.y
        ];

      switch (args.direction) {
        case MoveDirection.North:
          hero.location.y = hero.location.y - 1;
          console.log(hero.name, "moving", args.direction);
          break;
        case MoveDirection.South:
          hero.location.y = hero.location.y + 1;
          console.log(hero.name, "moving", args.direction);
          break;
        case MoveDirection.East:
          hero.location.x = hero.location.x + 1;
          console.log(hero.name, "moving", args.direction);
          break;
        case MoveDirection.West:
          hero.location.x = hero.location.x - 1;
          console.log(hero.name, "moving", args.direction);
          break;
      }

      hero.location.y = Math.min(95, Math.max(0, hero.location.y));
      hero.location.x = Math.min(127, Math.max(0, hero.location.x));

      const destination =
        LocationData[hero.location.map as MapNames]?.locations[hero.location.x][
          hero.location.y
        ];
      console.log({ location, destination });

      await context.db.hero.put(hero);

      return {
        hero,
        account,
        monsters: [],
      };
    },
  },
  MoveResponse: {
    async monsters(
      parent,
      args,
      context: BaseContext
    ): Promise<MonsterInstance[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      return context.db.monsterInstances.getInLocation(parent.hero.location);
    },
  },
  BaseAccount: {
    async hero(parent, args, context: BaseContext): Promise<Hero> {
      if (context?.auth?.id !== parent.id) {
        throw new ForbiddenError(
          "You do not have permission to access that hero"
        );
      }
      try {
        return await context.db.hero.get(parent.id);
      } catch (e: any) {
        if (e.type === "NotFoundError") {
          return context.db.hero.create(parent);
        }
        throw e;
      }
    },
  },
  EquipmentSlots: {
    id(parent): string | null {
      return parent?.id ?? null;
    },
  },
  Hero: {
    async equipment(
      parent,
      args,
      context: BaseContext
    ): Promise<EquipmentSlots> {
      const hero = parent;
      function findItem(
        hero: Hero,
        item: string | InventoryItem | undefined | null
      ): InventoryItem | undefined {
        if (!item) {
          return;
        }
        const itemId: string = typeof item === "string" ? item : item.id;

        const inventoryItem = hero.inventory.find((item) => item.id === itemId);
        if (!inventoryItem) {
          return;
        }
        if (inventoryItem.owner !== parent.id) {
          console.log(
            "Stray item left in inventory! I think I belong to",
            inventoryItem.owner,
            "but im in",
            parent.id,
            parent.name,
            "inventory instead"
          );
          return;
        }

        return inventoryItem;
      }

      return {
        leftHand: findItem(hero, hero.equipment.leftHand),
        rightHand: findItem(hero, hero.equipment.rightHand),
        bodyArmor: findItem(hero, hero.equipment.bodyArmor),
        handArmor: findItem(hero, hero.equipment.handArmor),
        legArmor: findItem(hero, hero.equipment.legArmor),
        headArmor: findItem(hero, hero.equipment.headArmor),
        footArmor: findItem(hero, hero.equipment.footArmor),
        accessories: hero.equipment.accessories
          .filter((item) => !!findItem(hero, item))
          .map((item) => findItem(hero, item) as InventoryItem),
      };
    },
  },
};

export default resolvers;
