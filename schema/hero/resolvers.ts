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
  AttributeType,
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
  },
  Mutation: {
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
      if (args.attribute !== "all" && !hero.stats[args.attribute]) {
        throw new UserInputError(`Unknown stat name: ${args.attribute}`);
      }

      if (args.spendAll) {
        for (let i = 0, l = hero.attributePoints; i < l; ++i) {
          increaseHeroAttribute(hero, args.attribute);
        }
      } else {
        increaseHeroAttribute(hero, args.attribute);
      }

      function increaseHeroAttribute(hero: Hero, attribute: AttributeType) {
        if (hero.attributePoints <= 0) {
          return;
        }
        if (attribute === "all") {
          hero.stats.strength = hero.stats.strength + 1;
          hero.stats.dexterity = hero.stats.dexterity + 1;
          hero.stats.constitution = hero.stats.constitution + 1;
          hero.stats.intelligence = hero.stats.intelligence + 1;
          hero.stats.wisdom = hero.stats.wisdom + 1;
          hero.stats.willpower = hero.stats.willpower + 1;
          hero.stats.luck = hero.stats.luck + 1;
          hero.attributePoints = hero.attributePoints - 1;
        } else {
          hero.stats[attribute] = hero.stats[attribute] + 7;
          hero.attributePoints = hero.attributePoints - 1;
        }
      }

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
        case HeroClasses.Berserker:
          attackType = AttackType.Melee;
          break;
        case HeroClasses.Ranger:
          attackType = AttackType.Ranged;
          break;
        case HeroClasses.BloodMage:
          attackType = AttackType.Blood;
          break;
        case HeroClasses.Wizard:
          attackType = AttackType.Cast;
          break;
        case HeroClasses.Warlock:
          attackType = AttackType.Cast;
          break;
        case HeroClasses.Paladin:
          attackType = AttackType.Smite;
          break;
      }
      const attacker = createHeroCombatant(parent, attackType);
      const victim = {
        class: HeroClasses.Adventurer,
        level: 1,
        name: "System",
        equipment: { armor: [], weapons: [], quests: [] },
        damageReduction: 1,
        attributes: {
          strength: 1000000,
          dexterity: 1000000,
          constitution: 1000000,
          intelligence: 1000000,
          wisdom: 1000000,
          willpower: 1000000,
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
        stats.willpower = Math.round(stats.willpower);
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
