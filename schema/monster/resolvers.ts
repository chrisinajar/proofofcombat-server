import { UserInputError, ForbiddenError } from "apollo-server";

import { Resolvers, Monster, MonsterInstance, FightResult } from "types";
import type { BaseContext } from "schema/context";

import { fightMonster } from "../../combat";

const MONSTERS: Monster[] = [
  {
    id: "rat",

    level: 1,
    name: "Rat",
    combat: {
      health: 10,
      maxHealth: 10,
    },
  },
];

async function getMonster(id: string): Promise<Monster | undefined> {
  return MONSTERS.find((entry) => entry.id === id);
}

const resolvers: Resolvers = {
  Mutation: {
    async fight(parent, args, context: BaseContext): Promise<FightResult> {
      if (!context?.auth?.id) {
        throw new ForbiddenError("Missing auth");
      }
      const hero = await context.db.hero.get(context.auth.id);
      const monster = await context.db.monsterInstances.get(args.monster);

      if (hero.combat.health <= 0) {
        return {
          victory: false,
          log: [],
          hero,
          monster,
        };
      }

      console.log("Fighting a", monster.monster.name);

      const fightResult = await fightMonster(hero, monster);

      console.log(fightResult);

      if (fightResult.monsterDamage) {
        hero.combat.health = Math.max(
          0,
          hero.combat.health - fightResult.monsterDamage
        );

        if (fightResult.heroDied) {
          console.log("HERO DIED!!");
        }
      }
      if (fightResult.heroDamage) {
        monster.monster.combat.health = Math.max(
          0,
          monster.monster.combat.health - fightResult.heroDamage
        );
        if (fightResult.monsterDied) {
          console.log("MONSTER DIED!!");
          context.db.hero.addExperience(hero, monster.monster.level * 10);
          await context.db.monsterInstances.del(monster);
        } else {
          await context.db.monsterInstances.put(monster);
        }
      }

      await context.db.hero.put(hero);

      return {
        hero,
        monster,
        log: fightResult.log,
        victory: fightResult.monsterDied,
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
      console.log("Challenging a", args.monster);
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
  },
};

export default resolvers;
