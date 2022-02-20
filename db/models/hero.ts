import { Hero, BaseAccount } from "types/graphql";
import DatabaseInterface from "../interface";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

type PartialHero = Optional<
  Hero,
  | "version"
  | "combat"
  | "stats"
  | "level"
  | "experience"
  | "gold"
  | "location"
  | "needed"
  | "attributePoints"
>;

export default class HeroModel extends DatabaseInterface<Hero> {
  constructor() {
    super("hero");
  }

  recalculateStats(hero: Hero): Hero {
    const maxHealthBefore = hero.combat.maxHealth;
    hero.combat.maxHealth = (8 + hero.stats.constitution) * hero.level;
    hero.needed = this.experienceNeededForLevel(hero.level);

    return hero;
  }

  luckRoll(luck: number, min: number, max: number): number {
    luck = Math.max(2, luck);
    return Math.max(
      min,
      Math.min(
        max,
        Math.round(Math.random() * (1.9 - 5 / luck) * (max - min)) + min
      )
    );
  }

  addExperience(hero: Hero, experience: number): Hero {
    const { level } = hero;
    const startingExperience = hero.experience;
    let newExperience = hero.experience + experience;
    const experienceNeeded = this.experienceNeededForLevel(level);
    // LEVEL UP
    if (newExperience >= experienceNeeded) {
      newExperience = experienceNeeded;
      hero = this.levelUp(hero);
    } else {
      hero.experience = newExperience;
    }

    return hero;
  }

  levelUp(hero: Hero): Hero {
    // we never over-level
    hero.stats.strength += this.luckRoll(hero.stats.luck, 0, 1);
    hero.stats.dexterity += this.luckRoll(hero.stats.luck, 0, 1);
    hero.stats.constitution += this.luckRoll(hero.stats.luck, 0, 1);
    hero.stats.intelligence += this.luckRoll(hero.stats.luck, 0, 1);
    hero.stats.wisdom += this.luckRoll(hero.stats.luck, 0, 1);
    hero.stats.charisma += this.luckRoll(hero.stats.luck, 0, 1);
    hero.stats.luck += this.luckRoll(2, 0, 1);
    hero.level = hero.level + 1;
    hero.attributePoints = hero.attributePoints + 1;

    hero.experience = 0;

    hero = this.recalculateStats(hero);
    hero.combat.health = hero.combat.maxHealth;

    return hero;
  }

  experienceNeededForLevel(level: number): number {
    return level * 60;
  }

  // turn old heroes into new heroes
  // as heroes are saved/loaded they run through this
  // any time we add a new field we need to make sure to populate it here
  upgrade(data: PartialHero): Hero {
    data.location = data.location ?? {
      x: Math.round(Math.random() * 128),
      y: Math.round(Math.random() * 96),
      map: "default",
    };
    data.gold = data.gold ?? 0;
    data.level = data.level ?? 1;
    data.experience = data.experience ?? 0;
    if (!data.combat) {
      data.combat = {
        health: 13,
        maxHealth: 13,
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

    // numbered versions!
    if (!data.version) {
      data.version = 0;
    }
    if (data.version < 1) {
      // first version, this is right before stat allocations came out
      data.attributePoints = (data.level - 1) * 2; // could be level 1 - 1 = 0

      data.version = 1;
    }
    if (data.version < 2) {
      // future
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
