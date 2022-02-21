import { UserInputError, ForbiddenError } from "apollo-server";

import {
  Resolvers,
  Monster,
  MonsterInstance,
  FightResult,
  AttackType,
} from "types/graphql";
import type { BaseContext } from "schema/context";

import {
  randomBaseItem,
  randomEnchantment,
  createItemInstance,
  enchantItem,
} from "../hero/items";
import { fightMonster } from "../../combat";

const MONSTERS: Monster[] = [
  { name: "Giant crab", attackType: AttackType.Melee },
  { name: "Forest imp", attackType: AttackType.Elemental },
  { name: "Traveling bandit", attackType: AttackType.Ranged },
  { name: "Hobgoblin", attackType: AttackType.Ranged },
  { name: "Brass dragon wyrmling", attackType: AttackType.Melee },
  { name: "Orc war chief", attackType: AttackType.Melee },
  { name: "Minotaur skeleton", attackType: AttackType.Blood },
  { name: "Gelatinous cube", attackType: AttackType.Melee },
  { name: "Duergar", attackType: AttackType.Ranged },
  { name: "Umber hulk", attackType: AttackType.Melee },
  { name: "Half-red dragon veteran", attackType: AttackType.Melee },
  { name: "Air Elemental", attackType: AttackType.Elemental },
  { name: "Troll", attackType: AttackType.Melee },
  { name: "Ogre zombie", attackType: AttackType.Holy },
  { name: "Griffon", attackType: AttackType.Melee },
  { name: "Grick alpha", attackType: AttackType.Melee },
  { name: "Young black dragon", attackType: AttackType.Melee },
  { name: "Drow mage", attackType: AttackType.Wizard },
  { name: "Flesh Golem", attackType: AttackType.Blood },
  { name: "Werebear", attackType: AttackType.Melee },
  { name: "Mezzoloth", attackType: AttackType.Blood },
  { name: "Green slaad", attackType: AttackType.Wizard },
  { name: "Spirit naga", attackType: AttackType.Elemental },
  { name: "Chain devil", attackType: AttackType.Blood },
  { name: "Hydra", attackType: AttackType.Elemental },
  { name: "Marilith", attackType: AttackType.Ranged },
  { name: "Githyanki knight", attackType: AttackType.Melee },
  { name: "Iron golem", attackType: AttackType.Melee },
  { name: "Adult blue dragon", attackType: AttackType.Holy },
  { name: "Goristro", attackType: AttackType.Melee },
  { name: "Fire Giant", attackType: AttackType.Melee },
  { name: "Nycaloth", attackType: AttackType.Melee },
  { name: "Yochlol", attackType: AttackType.Melee },
  { name: "Goliath Flesheater", attackType: AttackType.Wizard },
  { name: "Archmage", attackType: AttackType.Wizard },
  { name: "Fey Demon", attackType: AttackType.Blood },
  { name: "Ancient Treant", attackType: AttackType.Holy },
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
      const goldReward = monster.monster.combat.maxHealth;

      const fightResult = await fightMonster(hero, monster, attackType);
      const experienceRewards = Math.round(
        Math.min(
          hero.needed / 3,
          (monster.monster.level + Math.pow(1.5, monster.monster.level)) * 10
        )
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

      // victory
      if (fightResult.monsterDied) {
        console.log(hero.name, "killed a", monster.monster.name);
        context.db.hero.addExperience(hero, experienceRewards);
        hero.gold = hero.gold + goldReward;

        // drop chances!!
        // 5% chance of drops
        const dropOdds = 0.01 + context.db.hero.ultraLuck(hero.stats.luck) / 10;
        if (Math.random() < dropOdds) {
          console.log(" DROP!! Odds:", {
            luck: hero.stats.luck,
            dropOdds: Math.round(dropOdds * 100) / 100,
          });

          const monsterLevel = monster.monster.level;

          const baseItem = randomBaseItem(monsterLevel);
          const enchantment = randomEnchantment(monsterLevel);
          const itemInstance = enchantItem(
            createItemInstance(baseItem, hero),
            enchantment
          );

          console.log(itemInstance);
          hero.inventory.push(itemInstance);
        }

        await context.db.monsterInstances.del(monster);
      } else {
        await context.db.monsterInstances.put(monster);
      }

      await context.db.hero.put(hero);

      return {
        account,
        hero,
        monster,
        log: fightResult.log,
        victory: fightResult.monsterDied,
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
      const monster = await getMonster(args.monster);

      const instance = context.db.monsterInstances.create({
        monster,
        location: hero.location,
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
