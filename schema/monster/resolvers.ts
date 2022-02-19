import { UserInputError, ForbiddenError } from "apollo-server";

import { Resolvers, Monster, MonsterInstance, FightResult } from "types";
import type { BaseContext } from "schema/context";

import { fightMonster } from "../../combat";

const MONSTERS: Monster[] = [
  "Monsterous rat",
  "Giant crab",
  "Rabid bear",
  "Forest imp",
  "Goblin",
  "Traveling bandit",
  "Hobgoblin",
  "Brass dragon wyrmling",
  "Orc war chief",
  "Minotaur skeleton",
  "Gelatinous cube",
  "Ankheg",
  "Duergar",
  "Umber hulk",
  "Quaggoth thonot",
  "Grell",
  "Half-red dragon veteran",
  "Air Elemental",
  "Troll",
].map((name, i) => ({
  id: name,

  level: i + 1,
  name: name,
  combat: {
    health: Math.ceil(Math.pow(1.3, i) * 10),
    maxHealth: Math.ceil(Math.pow(1.3, i) * 10),
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

      const fightResult = await fightMonster(hero, monster);
      const experienceRewards = monster.monster.level * 10;

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
        if (fightResult.monsterDied) {
          console.log(hero.name, "killed a", monster.monster.name);
          context.db.hero.addExperience(hero, experienceRewards);
          await context.db.monsterInstances.del(monster);
        } else {
          await context.db.monsterInstances.put(monster);
        }
      }

      await context.db.hero.put(hero);

      return {
        account,
        hero,
        monster,
        log: fightResult.log,
        victory: fightResult.monsterDied,
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
