import { Hero, BaseAccount } from "types";
import DatabaseInterface from "../interface";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

type PartialHero = Optional<
  Hero,
  "combat" | "stats" | "level" | "experience" | "gold" | "location"
>;

export default class HeroModel extends DatabaseInterface<Hero> {
  constructor() {
    super("hero");
  }

  recalculateStats(hero: Hero): Hero {
    hero.combat.maxHealth = (8 + hero.stats.constitution) * hero.level;

    return hero;
  }

  // turn old heroes into new heroes
  // as heroes are saved/loaded they run through this
  // any time we add a new field we need to make sure to populate it here
  upgrade(data: PartialHero): Hero {
    data.location = data.location ?? { x: 0, y: 0, map: "default" };
    data.gold = data.gold ?? 0;
    data.level = data.level ?? 1;
    data.experience = data.experience ?? 0;
    if (!data.combat) {
      data.combat = {
        health: 10,
        maxHealth: 10,
      };
    }
    if (!data.stats) {
      data.stats = {
        strength: 5,
        dexterity: 5,
        constitution: 5,

        intelligence: 5,
        wisdom: 5,
        charisma: 5,

        luck: 5,
      };
    }
    return this.recalculateStats(data as Hero);
  }

  async create(account: BaseAccount): Promise<Hero> {
    if (account.hero) {
      return account.hero;
    }
    // get first
    try {
      return await this.get(account.id);
    } catch (e) {}
    // create as a fallback
    return this.put(
      this.upgrade({
        id: account.id,
        name: account.name,

        level: 1,
        experience: 0,
      })
    );
  }
}
