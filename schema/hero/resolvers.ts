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
  TradeOffer,
  AccessRole,
  EnchantmentType,
  HeroFightResult,
  PlayerLocation,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { countEnchantments } from "../../schema/items/helpers";

import { BaseItems } from "../items/base-items";
import { createItemInstance } from "../items/helpers";
import type { BaseItem } from "../items";
import { checkHero } from "../quests/helpers";
import { createHeroCombatant } from "../../combat/hero";
import { getEnchantedAttributes } from "../../combat/enchantments";
import { fightHero } from "../../combat/fight-hero";

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
    async changeActiveSkill(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (isNaN(hero.skills[args.skill])) {
        throw new UserInputError("Unknown skill");
      }

      hero.activeSkill = args.skill;
      await context.db.hero.put(hero);

      return { hero, account };
    },
    async changeSkillPercent(parent, args, context) {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const percent = Math.min(100, Math.max(0, args.percent));

      hero.skillPercent = percent;
      await context.db.hero.put(hero);

      return { hero, account };
    },
    async attackHero(parent, args, context): Promise<HeroFightResult> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);

      if (hero.combat.health <= 0) {
        throw new UserInputError("You must heal before attacking!");
      }

      let victim = await context.db.hero.get(args.id);
      if (
        hero.location.x !== victim.location.x ||
        hero.location.y !== victim.location.y ||
        hero.location.map !== victim.location.map
      ) {
        throw new UserInputError(
          "That hero is not in the same location as you."
        );
      }
      const attackType: AttackType = args.attackType || AttackType.Melee;
      const fightResult = await fightHero(hero, victim, attackType);

      hero.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            hero.combat.maxHealth,
            hero.combat.health -
              fightResult.attackerDamage -
              fightResult.attackerEnchantmentDamage +
              fightResult.attackerHeal
          )
        )
      );

      victim.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            victim.combat.maxHealth,
            victim.combat.health -
              fightResult.victimDamage -
              fightResult.victimEnchantmentDamage +
              fightResult.victimHeal
          )
        )
      );

      let attackerDeathHeal = 0;
      let victimDeathHeal = 0;

      if (hero.combat.health === 0) {
        victimDeathHeal = Math.max(
          victim.combat.maxHealth * 0.1,
          hero.combat.maxHealth
        );
      }
      if (victim.combat.health === 0) {
        attackerDeathHeal = Math.max(
          hero.combat.maxHealth * 0.1,
          victim.combat.maxHealth
        );
      }

      victim.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            victim.combat.maxHealth,
            victim.combat.health + victimDeathHeal
          )
        )
      );
      hero.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            hero.combat.maxHealth,
            hero.combat.health + attackerDeathHeal
          )
        )
      );

      if (hero.combat.health === 0) {
        console.log(victim.name, "killed", hero.name, "while defending");
        context.io.sendLocalNotification(hero.location, {
          message: `${victim.name} has defeated ${hero.name} while defending themselves`,
          type: "quest",
        });
      }
      if (victim.combat.health === 0) {
        console.log(hero.name, "killed", victim.name);
        context.io.sendLocalNotification(hero.location, {
          message: `${hero.name} has slain ${victim.name} in single combat`,
          type: "quest",
        });
      }

      // i am undeath
      fightResult.victimDied = victim.combat.health < 1;
      fightResult.attackerDied = hero.combat.health < 1;

      await Promise.all([
        context.db.hero.put(hero),
        context.db.hero.put(victim),
      ]);

      const account = await context.db.account.get(context.auth.id);
      return {
        account,
        hero,
        otherHero: context.db.hero.publicHero(victim, true),
        log: fightResult.log,
        victory: fightResult.victimDied,
      };
    },
    async changeMinimumStat(parent, args, context): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const automationUpgrades = countEnchantments(
        hero,
        EnchantmentType.ImprovedAutomation
      );

      if (automationUpgrades < 1) {
        throw new UserInputError(
          "You do not have the quest items needed to do that."
        );
      }

      if (args.value < 1) {
        throw new UserInputError("You cannot set your minimim stats below 0.");
      }

      const attrName = args.name as keyof HeroStats;
      if (!hero.stats[attrName]) {
        throw new UserInputError("Unknown attribute name");
      }

      hero.settings.minimumStats[attrName] = Math.round(args.value);

      await context.db.hero.put(hero);

      return { hero, account };
    },
    async changeAutoDust(parent, args, context): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      let hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      const automationUpgrades = countEnchantments(
        hero,
        EnchantmentType.ImprovedAutomation
      );

      if (automationUpgrades < 1) {
        throw new UserInputError(
          "You do not have the quest items needed to do that."
        );
      }

      hero.settings.autoDust = Math.min(1000000, Math.round(args.value));

      await context.db.hero.put(hero);

      return { hero, account };
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
      if (args.attribute !== "all" && !hero.stats[args.attribute]) {
        throw new UserInputError(`Unknown stat name: ${args.attribute}`);
      }

      let amountToSpend = args.amount ?? 1;

      if (args.spendAll) {
        amountToSpend = hero.attributePoints;
      }
      amountToSpend = Math.max(
        1,
        Math.min(hero.attributePoints, amountToSpend)
      );

      for (let i = 0, l = amountToSpend; i < l; ++i) {
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

      console.log(
        hero.name,
        "increasing their",
        args.attribute,
        amountToSpend,
        "times"
      );

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
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      if (context.auth.id !== parent.id) {
        const account = await context.db.account.get(context.auth.id);
        if (account.access !== AccessRole.Admin) {
          throw new ForbiddenError(
            "You do not have permission to access that hero"
          );
        }
      }
      let hero: Hero | null = null;
      try {
        hero = await context.db.hero.get(parent.id);
      } catch (e: any) {
        if (e.type === "NotFoundError") {
          hero = await context.db.hero.create(parent);
        } else {
          throw e;
        }
      }
      if (!hero) {
        throw new Error("Failed to get or create hero");
      }
      hero = checkHero(context, hero);
      if (hero.currentQuest) {
        hero = await context.db.hero.put(hero);
      }
      return hero;
    },
  },
  EquipmentSlots: {
    id(parent): string | null {
      return parent?.id ?? null;
    },
  },
  Hero: {
    async home(parent, args, context): Promise<PlayerLocation | null> {
      return context.db.playerLocation.getHome(parent.id);
    },
    async incomingTrades(parent, args, context): Promise<TradeOffer[]> {
      return context.db.trades.offersForHero(parent.id);
    },
    async outgoingTrades(parent, args, context): Promise<TradeOffer[]> {
      return context.db.trades.offersFromHero(parent.id);
    },
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
        attackType: AttackType.Melee,
        level: 1,
        name: "System",
        equipment: { armor: [], weapons: [], quests: [] },
        damageReduction: 1,
        health: 1000000,
        maxHealth: 1000000,
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
