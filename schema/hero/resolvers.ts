import { ForbiddenError, UserInputError } from "apollo-server";

import {
  Resolvers,
  Hero,
  HealResponse,
  MonsterInstance,
  BaseAccount,
  LevelUpResponse,
  InventoryItem,
  InventoryItemType,
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
  HeroStance,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import { countEnchantments } from "../../schema/items/helpers";

import { BaseItems } from "../items/base-items";
import { createItemInstance } from "../items/helpers";
import type { BaseItem } from "../items";
import { checkHero } from "../quests/helpers";
import { rebirth } from "../quests/rebirth";
import { createHeroCombatant } from "../../combat/hero";
import { getEnchantedAttributes } from "../../combat/enchantments";
import { fightHero } from "../../combat/fight-hero";
import { Mob } from "../../calculations/units/mob";

const resolvers: Resolvers = {
  Query: {
    async leaderboard(
      parent,
      args,
      context: BaseContext,
    ): Promise<LeadboardEntry[]> {
      return (await context.db.hero.getTopHeros()).map<LeadboardEntry>(
        (hero: Hero) => ({
          name: hero.name,
          gold: hero.gold,
          level: hero.level,
          id: hero.id,
          class: hero.class,
        }),
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
          "That hero is not in the same location as you.",
        );
      }
      const attackType: AttackType = args.attackType || AttackType.Melee;
      const stance: HeroStance = args.stance || hero.activeStance;
      // hero.activeStance = stance;
      const fightResult = await fightHero(hero, victim, attackType);

      hero.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            hero.combat.maxHealth,
            hero.combat.health -
              fightResult.attackerDamage -
              fightResult.attackerEnchantmentDamage +
              fightResult.attackerHeal,
          ),
        ),
      );

      victim.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            victim.combat.maxHealth,
            victim.combat.health -
              fightResult.victimDamage -
              fightResult.victimEnchantmentDamage +
              fightResult.victimHeal,
          ),
        ),
      );

      let attackerDeathHeal = 0;
      let victimDeathHeal = 0;

      if (hero.combat.health === 0) {
        victimDeathHeal = Math.max(
          victim.combat.maxHealth * 0.1,
          hero.combat.maxHealth,
        );
      }
      if (victim.combat.health === 0) {
        attackerDeathHeal = Math.max(
          hero.combat.maxHealth * 0.1,
          victim.combat.maxHealth,
        );
      }

      victim.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            victim.combat.maxHealth,
            victim.combat.health + victimDeathHeal,
          ),
        ),
      );
      hero.combat.health = Math.round(
        Math.max(
          0,
          Math.min(
            hero.combat.maxHealth,
            hero.combat.health + attackerDeathHeal,
          ),
        ),
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
        EnchantmentType.ImprovedAutomation,
      );

      if (automationUpgrades < 1) {
        throw new UserInputError(
          "You do not have the quest items needed to do that.",
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
        EnchantmentType.ImprovedAutomation,
      );

      if (automationUpgrades < 1) {
        throw new UserInputError(
          "You do not have the quest items needed to do that.",
        );
      }

      hero.settings.autoDust = Math.min(1000000, Math.round(args.value));

      await context.db.hero.put(hero);

      return { hero, account };
    },
    async increaseAttribute(
      parent,
      args,
      context: BaseContext,
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
        Math.min(hero.attributePoints, amountToSpend),
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
        "times",
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
      let hero = await context.db.hero.get(context.auth.id);

      hero.combat.health = hero.combat.maxHealth;

      const isVoid = hero.location.map === "void";

      if (isVoid) {
        // send them back to the mortal plane
        hero.location = { x: 64, y: 44, map: "default" };
        hero = rebirth(context, hero, true);
      }

      hero = context.db.hero.rollSkillsForAction(context, hero, "heal");

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
    async acceptArtifact(
      parent: unknown,
      args: Record<string, never>,
      context: BaseContext,
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (!hero.pendingArtifact) {
        throw new UserInputError("No pending artifact to accept");
      }

      // Store the old artifact if it exists
      const oldArtifact = hero.equipment.artifact;

      // Equip the new artifact
      hero.equipment.artifact = hero.pendingArtifact;
      hero.pendingArtifact = null;

      // If there was an old artifact, send a notification about it being replaced
      if (oldArtifact) {
        context.io.sendNotification(hero.id, {
          type: "artifact",
          artifactItem: oldArtifact,
          message: `Your ${oldArtifact.name} was replaced.`,
        });
      }

      await context.db.hero.put(hero);

      return {
        hero,
        account,
      };
    },
    async rejectArtifact(
      parent: unknown,
      args: Record<string, never>,
      context: BaseContext,
    ): Promise<LevelUpResponse> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }

      const hero = await context.db.hero.get(context.auth.id);
      const account = await context.db.account.get(context.auth.id);

      if (!hero.pendingArtifact) {
        throw new UserInputError("No pending artifact to reject");
      }

      const rejectedArtifact = hero.pendingArtifact;
      hero.pendingArtifact = null;

      // Send a notification about rejecting the artifact
      context.io.sendNotification(hero.id, {
        type: "artifact",
        artifactItem: rejectedArtifact,
        message: `You rejected the ${rejectedArtifact.name}.`,
      });

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
            "You do not have permission to access that hero",
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
    async availableAttacks(parent, args, context: BaseContext) {
      // Determine valid attacks based on equipped weapons
      // Reuse combat helper rules to avoid duplicating logic
      const attacks: AttackType[] = [];

      // Load a fresh, canonical hero from DB to ensure inventory/equipment consistency
      const fullHero = await context.db.hero.get(parent.id);

      // Gather equipped hand items (by object if present)
      const equipped: (InventoryItem | undefined)[] = [];
      function findEquippedItem(
        hero: Hero,
        item: string | InventoryItem | undefined | null,
      ): InventoryItem | undefined {
        if (!item) return undefined;
        const itemId: string = typeof item === "string" ? item : item.id;
        const inventoryItem = hero.inventory.find((i) => i.id === itemId);
        if (!inventoryItem || inventoryItem.owner !== hero.id) return undefined;
        return inventoryItem;
      }
      const left = findEquippedItem(fullHero as Hero, fullHero.equipment.leftHand);
      const right = findEquippedItem(fullHero as Hero, fullHero.equipment.rightHand);
      if (left) equipped.push(left);
      if (right) equipped.push(right);

      // If no weapons equipped at all, all attack types are available
      if (equipped.length === 0) {
        return [
          AttackType.Melee,
          AttackType.Ranged,
          AttackType.Cast,
          AttackType.Smite,
          AttackType.Blood,
        ];
      }

      const hasType = (t: InventoryItemType) =>
        equipped.some((i) => i?.type === t);

      const hasRanged = hasType(InventoryItemType.RangedWeapon);
      const hasMelee = hasType(InventoryItemType.MeleeWeapon);
      const hasFocus = hasType(InventoryItemType.SpellFocus);
      const hasShield = hasType(InventoryItemType.Shield);

      // If a ranged weapon is equipped, only Ranged is valid (two-handed)
      if (hasRanged) {
        return [AttackType.Ranged];
      }

      // Smite is always valid when not using a ranged weapon
      attacks.push(AttackType.Smite);

      // Melee valid if a melee weapon (or a shield for bashing) is present
      if (hasMelee || hasShield) {
        attacks.push(AttackType.Melee);
      }

      // Cast valid if a spell focus is present
      if (hasFocus) {
        attacks.push(AttackType.Cast);
      }

      // Blood is valid only when not holding melee or ranged weapons
      if (!hasMelee && !hasRanged) {
        attacks.push(AttackType.Blood);
      }

      // unique and ordered
      const unique: AttackType[] = [];
      for (const a of [
        AttackType.Melee,
        AttackType.Ranged,
        AttackType.Cast,
        AttackType.Smite,
        AttackType.Blood,
      ]) {
        if (attacks.includes(a)) unique.push(a);
      }
      return unique;
    },
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
        case HeroClasses.Gambler:
        case HeroClasses.Daredevil:
        case HeroClasses.Fighter:
        case HeroClasses.Gladiator:
        case HeroClasses.Berserker:
        case HeroClasses.EnragedBerserker:
          attackType = AttackType.Melee;
          break;
        case HeroClasses.Ranger:
        case HeroClasses.Archer:
          attackType = AttackType.Ranged;
          break;
        case HeroClasses.BloodMage:
        case HeroClasses.Vampire:
          attackType = AttackType.Blood;
          break;
        case HeroClasses.Wizard:
        case HeroClasses.MasterWizard:
        case HeroClasses.Warlock:
        case HeroClasses.MasterWarlock:
          attackType = AttackType.Cast;
          break;
        case HeroClasses.Paladin:
        case HeroClasses.Zealot:
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

      const enchantedStats = getEnchantedAttributes(attacker, {
        ...victim,
        unit: new Mob(victim),
        attackSpeed: 1000,
        attackSpeedRemainder: 0,
      });

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

      const physicalEvasionRating =
        enchantedStats.attacker.unit.stats.evasionRating;

      enchantedStats.victim.unit.attackType = AttackType.Cast;

      const magicEvasionRating =
        enchantedStats.attacker.unit.stats.evasionRating;

      return {
        damageAmplification: enchantedStats.attacker.percentageDamageIncrease,
        armor: enchantedStats.attacker.unit.stats.armor,
        armorReduction: enchantedStats.victim.percentageDamageReduction,
        enemyStats: enchantedStats.victim.attributes,
        stats: enchantedStats.attacker.attributes,

        attackRating: enchantedStats.attacker.unit.stats.attackRating,
        physicalEvasionRating,
        magicEvasionRating,

        baseDamage: Math.floor(
          enchantedStats.attacker.unit.getBaseDamage(false),
        ),
        secondAttackBaseDamage: Math.floor(
          enchantedStats.attacker.unit.getBaseDamage(true),
        ),

        physicalResistance:
          enchantedStats.attacker.unit.stats.physicalResistance,
        magicalResistance: enchantedStats.attacker.unit.stats.magicalResistance,
        fireResistance: enchantedStats.attacker.unit.stats.fireResistance,
        iceResistance: enchantedStats.attacker.unit.stats.iceResistance,
        lightningResistance:
          enchantedStats.attacker.unit.stats.lightningResistance,
        holyResistance: enchantedStats.attacker.unit.stats.holyResistance,
        blightResistance: enchantedStats.attacker.unit.stats.blightResistance,
      };
    },
    async equipment(
      parent,
      args,
      context: BaseContext,
    ): Promise<EquipmentSlots> {
      const hero = parent;
      function findItem(
        hero: Hero,
        item: string | InventoryItem | undefined | null,
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
            "inventory instead",
          );
          return;
        }

        return inventoryItem;
      }

      return {
        id: parent.id,
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
        artifact: hero.equipment.artifact,
      };
    },
    async availableStances(parent, args, context): Promise<HeroStance[]> {
      return context.db.hero.getAvailableStances(parent);
    },
  },
};

export default resolvers;
