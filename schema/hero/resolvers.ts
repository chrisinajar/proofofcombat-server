import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  Hero,
  HealResponse,
  MonsterInstance,
  BaseAccount,
  LevelUpResponse,
  InventoryItem,
  EquipmentSlots,
  ShopItem,
  LeadboardEntry,
  AttackType,
  HeroClasses,
  HeroStats,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { BaseItems } from "../items/base-items";
import { createItemInstance } from "../items/helpers";
import type { BaseItem } from "../items";
import { createHeroCombatant, getEnchantedAttributes } from "../../combat";

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
          class: hero.class,
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

      if (!baseItem.cost || !baseItem.canBuy) {
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

      if (!baseItem.cost || !baseItem.canBuy) {
        throw new UserInputError("Item cannot be sold!");
      }
      if (item.enchantment) {
        throw new UserInputError("You cannot sell enchanted items!");
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

      if (args.attribute === "all") {
        hero.stats[args.attribute] = hero.stats[args.attribute] + 7;
        hero.stats.strength = hero.stats.strength + 1;
        hero.stats.dexterity = hero.stats.dexterity + 1;
        hero.stats.constitution = hero.stats.constitution + 1;
        hero.stats.intelligence = hero.stats.intelligence + 1;
        hero.stats.wisdom = hero.stats.wisdom + 1;
        hero.stats.charisma = hero.stats.charisma + 1;
        hero.stats.luck = hero.stats.luck + 1;
      } else if (!hero.stats[args.attribute]) {
        return {
          hero,
          account,
        };
      } else {
        hero.stats[args.attribute] = hero.stats[args.attribute] + 7;
      }

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
    combatStats(parent) {
      let attackType = AttackType.Melee;
      switch (parent.class) {
        case HeroClasses.Adventurer:
          attackType = AttackType.Melee;
          break;
        case HeroClasses.Gambler:
          attackType = AttackType.Melee;
          break;
        case HeroClasses.Fighter:
          attackType = AttackType.Melee;
          break;
        case HeroClasses.Ranger:
          attackType = AttackType.Ranged;
          break;
        case HeroClasses.BloodMage:
          attackType = AttackType.Blood;
          break;
        case HeroClasses.Wizard:
          attackType = AttackType.Wizard;
          break;
        case HeroClasses.Elementalist:
          attackType = AttackType.Elemental;
          break;
        case HeroClasses.Cleric:
          attackType = AttackType.Holy;
          break;
      }
      const attacker = createHeroCombatant(parent, attackType);
      const victim = {
        equipment: { armor: [], weapons: [], quests: [] },
        damageReduction: 1,
        attributes: {
          strength: 1000000,
          dexterity: 1000000,
          constitution: 1000000,
          intelligence: 1000000,
          wisdom: 1000000,
          charisma: 1000000,
          luck: 1000000,
        },
        luck: {
          smallModifier: 0.01,
          largeModifier: 0.01,
          ultraModifier: 0.01,
        },
      };
      const enchantedStats = getEnchantedAttributes(attacker, victim);

      function cleanStats(stats: HeroStats) {
        stats.strength = Math.round(stats.strength);
        stats.dexterity = Math.round(stats.dexterity);
        stats.constitution = Math.round(stats.constitution);
        stats.intelligence = Math.round(stats.intelligence);
        stats.wisdom = Math.round(stats.wisdom);
        stats.charisma = Math.round(stats.charisma);
        stats.luck = Math.round(stats.luck);
      }

      cleanStats(enchantedStats.attacker.attributes);
      cleanStats(enchantedStats.victim.attributes);

      return {
        damageAmplification: enchantedStats.attacker.percentageDamageIncrease,
        damageReduction: enchantedStats.attacker.percentageDamageReduction,
        armorReduction: enchantedStats.victim.percentageDamageReduction,
        enemyStats: enchantedStats.victim.attributes,
        stats: enchantedStats.attacker.attributes,
      };
    },
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
