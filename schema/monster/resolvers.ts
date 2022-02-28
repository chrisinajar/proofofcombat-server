import { UserInputError, ForbiddenError } from "apollo-server";

import {
  Resolvers,
  Monster,
  MonsterInstance,
  FightResult,
  AttackType,
  InventoryItem,
  HeroClasses,
  MonsterEquipment,
  EnchantmentType,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import {
  randomBaseItem,
  randomEnchantment,
  createItemInstance,
  enchantItem,
} from "../items/helpers";
import { fightMonster, createMonsterEquipment } from "../../combat";
import { MapNames } from "../../constants";
import { specialLocations, distance2d } from "../../helpers";

const MONSTERS: Monster[] = [
  { name: "Giant crab", attackType: AttackType.Melee },
  { name: "Forest imp", attackType: AttackType.Cast },
  { name: "Traveling bandit", attackType: AttackType.Ranged },
  { name: "Hobgoblin", attackType: AttackType.Ranged },
  { name: "Brass dragon wyrmling", attackType: AttackType.Melee },
  { name: "Orc war chief", attackType: AttackType.Melee },
  { name: "Minotaur skeleton", attackType: AttackType.Blood },
  { name: "Gelatinous cube", attackType: AttackType.Melee },
  { name: "Duergar", attackType: AttackType.Ranged },
  { name: "Umber hulk", attackType: AttackType.Melee },
  { name: "Half-red dragon veteran", attackType: AttackType.Melee },
  { name: "Air Elemental", attackType: AttackType.Cast },
  { name: "Troll", attackType: AttackType.Melee },
  { name: "Ogre zombie", attackType: AttackType.Smite },
  { name: "Griffon", attackType: AttackType.Melee },
  { name: "Grick alpha", attackType: AttackType.Melee },
  { name: "Young black dragon", attackType: AttackType.Melee },
  { name: "Drow mage", attackType: AttackType.Cast },
  { name: "Flesh Golem", attackType: AttackType.Blood },
  { name: "Werebear", attackType: AttackType.Melee },
  { name: "Mezzoloth", attackType: AttackType.Blood },
  { name: "Green slaad", attackType: AttackType.Cast },
  { name: "Spirit naga", attackType: AttackType.Cast },
  { name: "Chain devil", attackType: AttackType.Blood },
  { name: "Hydra", attackType: AttackType.Cast },
  { name: "Marilith", attackType: AttackType.Ranged },
  { name: "Githyanki knight", attackType: AttackType.Melee },
  { name: "Iron golem", attackType: AttackType.Melee },
  { name: "Adult blue dragon", attackType: AttackType.Smite },
  { name: "Goristro", attackType: AttackType.Melee },
  { name: "Fire Giant", attackType: AttackType.Melee },
  { name: "Nycaloth", attackType: AttackType.Melee },
  { name: "Yochlol", attackType: AttackType.Melee },
  { name: "Goliath Flesheater", attackType: AttackType.Cast },
  { name: "Archmage", attackType: AttackType.Cast },
  { name: "Fey Demon", attackType: AttackType.Blood },
  { name: "Ancient Treant", attackType: AttackType.Smite },
  { name: "Undead Frost Giant", attackType: AttackType.Ranged },
  { name: "Demilich", attackType: AttackType.Blood },
].map(({ name, attackType }, i) => ({
  id: name,

  level: i + 1,
  name,
  attackType,
  combat: {
    health: Math.ceil(Math.pow(1.4, i) * 8),
    maxHealth: Math.ceil(Math.pow(1.4, i) * 8),
  },
}));

async function getMonster(id: string): Promise<Monster | undefined> {
  return MONSTERS.find((entry) => entry.id === id);
}

const resolvers: Resolvers = {
  Mutation: {
    async fight(parent, args, context: BaseContext): Promise<FightResult> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const account = await context.db.account.get(context.auth.id);
      const hero = await context.db.hero.get(context.auth.id);
      const monster = await context.db.monsterInstances.get(args.monster);

      if (hero.combat.health <= 0) {
        return {
          account,
          victory: false,
          log: [],
          hero,
          monster,
        };
      }

      const startLevel = hero.level;
      const attackType: AttackType = args.attackType || AttackType.Melee;
      let goldReward = monster.monster.combat.maxHealth;

      const fightResult = await fightMonster(hero, monster, attackType);
      let experienceRewards =
        (monster.monster.level + Math.pow(1.5, monster.monster.level)) * 10;

      const xpDoublers = context.db.hero.countEnchantments(
        hero,
        EnchantmentType.DoubleExperience
      );
      if (hero.class === HeroClasses.Adventurer) {
        experienceRewards *= 3;
      }

      experienceRewards *= Math.pow(2, xpDoublers);

      experienceRewards = Math.round(
        Math.min(hero.needed / 3, experienceRewards)
      );

      if (fightResult.monsterDamage) {
        hero.combat.health = Math.max(
          0,
          hero.combat.health - fightResult.monsterDamage
        );

        if (fightResult.heroDied) {
          console.log(monster.monster.name, "killed", hero.name);
        }
      }

      if (fightResult.heroDamage) {
        monster.monster.combat.health = Math.max(
          0,
          monster.monster.combat.health - fightResult.heroDamage
        );
      }

      let droppedItem: null | InventoryItem = null;

      // victory
      if (fightResult.monsterDied) {
        const currentTavern = specialLocations(
          hero.location.x,
          hero.location.y,
          hero.location.map as MapNames
        ).find((location) => location.type === "tavern");

        let equipment: MonsterEquipment | undefined = undefined;
        let bonusDropRate = 1;

        if (currentTavern && currentTavern.name === "The Hidden Stump Inn") {
          goldReward *= 1.5;
        } else if (
          currentTavern &&
          currentTavern.name === "The Hellhound's Fur"
        ) {
          bonusDropRate = 1.2;
          // other things?
        }

        console.log(hero.name, "killed a", monster.monster.name, goldReward, {
          xpDoublers,
        });
        context.db.hero.addExperience(hero, experienceRewards);
        hero.gold = Math.round(hero.gold + goldReward);

        // drop chances!!
        const luck = hero.stats.luck;
        const monsterAntiLuck = goldReward;
        const dropOdds =
          ((0.005 + luck / (luck + monsterAntiLuck + 5)) * bonusDropRate) / 50;
        if (Math.random() < dropOdds) {
          console.log(" DROP!! Odds:", {
            luck,
            monsterAntiLuck,
            dropOdds: Math.round(dropOdds * 1000) / 1000,
          });

          const monsterLevel = monster.monster.level;

          const baseItem = randomBaseItem(monsterLevel);
          // max mob tier enchantments is 3
          // max normal overworld mobs is 32
          // lets give just a 10% chance of tier 3 enchantments (they fat)
          // so max value should be 3.33.. at 32, so that there's a 10% chance it remains above 3.0
          // (32 / (3 / 0.9)) = 9.6!
          const enchantment = randomEnchantment(
            Math.floor(Math.random() * (monsterLevel / 9.6))
          );
          const itemInstance = enchantItem(
            createItemInstance(baseItem, hero),
            enchantment
          );

          console.log(itemInstance);
          droppedItem = itemInstance;
          hero.inventory.push(itemInstance);
        }

        await context.db.monsterInstances.del(monster);
      } else {
        await context.db.monsterInstances.put(monster);
      }

      await context.db.hero.put(hero);

      if (droppedItem) {
        context.io.sendNotification(hero.id, {
          type: "drop",
          message: `You found {{item}} while fighting ${monster.monster.name}`,
          item: droppedItem,
        });
      }

      return {
        account,
        hero,
        monster,
        log: fightResult.log,
        victory: fightResult.monsterDied,
        drop: droppedItem ?? undefined,
        gold: fightResult.monsterDied ? goldReward : undefined,
        experience: fightResult.monsterDied ? experienceRewards : undefined,
        didLevel: hero.level !== startLevel,
      };
    },

    async challenge(
      parent,
      args,
      context: BaseContext
    ): Promise<MonsterInstance> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      let monster = await getMonster(args.monster);

      if (!monster) {
        throw new UserInputError("Unknown monster");
      }

      const currentTavern = specialLocations(
        hero.location.x,
        hero.location.y,
        hero.location.map as MapNames
      ).find((location) => location.type === "tavern");

      let equipment: MonsterEquipment | undefined = undefined;

      if (currentTavern && currentTavern.name === "The Hidden Stump Inn") {
        monster = { ...monster, level: monster.level * 1.2 };
      } else if (
        currentTavern &&
        currentTavern.name === "The Hellhound's Fur"
      ) {
        equipment = {
          leftHand: { level: monster.level, enchantment: randomEnchantment(0) },
          rightHand: {
            level: monster.level,
            enchantment: randomEnchantment(0),
          },

          bodyArmor: {
            level: monster.level,
            enchantment: randomEnchantment(0),
          },
          handArmor: {
            level: monster.level,
            enchantment: randomEnchantment(0),
          },
          legArmor: { level: monster.level, enchantment: randomEnchantment(0) },
          headArmor: {
            level: monster.level,
            enchantment: randomEnchantment(0),
          },
          footArmor: {
            level: monster.level,
            enchantment: randomEnchantment(0),
          },
        };
      }

      const instance = context.db.monsterInstances.create({
        monster,
        location: hero.location,
        equipment,
      });
      return instance;
    },
  },
  Query: {
    async monster(parent, args, context: BaseContext): Promise<Monster> {
      const monster = await getMonster(args.id);
      if (!monster) {
        throw new UserInputError("No monster known by that id");
      }
      return monster;
    },
    async monsters(
      parent,
      args,
      context: BaseContext
    ): Promise<MonsterInstance[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      return context.db.monsterInstances.getInLocation(hero.location);
    },
    async challenges(parent, args, context: BaseContext): Promise<Monster[]> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      // take location into account?
      // oh well!

      return MONSTERS;
    },
  },
};

export default resolvers;
