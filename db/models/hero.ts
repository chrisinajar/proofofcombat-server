import { Hero, BaseAccount, InventoryItemType } from "types/graphql";
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
  | "inventory"
  | "equipment"
  | "questLog"
  | "class"
>;

const inMemoryLeaderboardLength = 50;

import { checkHero } from "../../schema/quests/helpers";
import { getClass } from "./hero/classes";

export default class HeroModel extends DatabaseInterface<Hero> {
  constructor() {
    super("hero");
  }

  async getTopHeros(): Promise<Hero[]> {
    const resultList: Hero[] = [];
    const iterator = this.db.iterate({});
    // ? iterator.seek(...); // You can first seek if you'd like.
    for await (const { key, value } of iterator) {
      let index = -1;
      resultList.forEach((hero, i) => {
        if (hero.level < value.level) {
          index = i;
        }
      });

      if (resultList.length < inMemoryLeaderboardLength || index > -1) {
        resultList.splice(index + 1, 0, value);
      }
    } // If the end of the iterable is reached, iterator.end() is callend.
    await iterator.end();

    return resultList
      .reverse()
      .slice(0, inMemoryLeaderboardLength)
      .map((hero) => this.upgrade(hero));
  }

  recalculateStats(hero: Hero): Hero {
    const healthPercentBefore = hero.combat.health / hero.combat.maxHealth;
    hero.combat.maxHealth = hero.stats.constitution * 10 + hero.level * 10;
    hero.combat.health = Math.round(
      Math.min(
        hero.combat.maxHealth,
        healthPercentBefore * hero.combat.maxHealth
      )
    );
    hero.needed = this.experienceNeededForLevel(hero.level);

    return hero;
  }

  // 0-1
  smallLuck(luck: number): number {
    return luck / (luck + 20);
  }
  largeLuck(luck: number): number {
    return luck / (luck + 200);
  }
  ultraLuck(luck: number): number {
    return luck / (luck + 2000);
  }

  luckRoll(luck: number, min: number, max: number): number {
    luck = Math.max(5, luck);
    return Math.max(
      min,
      Math.min(
        max,
        Math.round(Math.random() * (2 * this.smallLuck(luck)) * (max - min)) +
          min
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
    if (hero.level < 5000) {
      // we never over-level
      hero.stats.strength = hero.stats.strength + 1;
      hero.stats.dexterity = hero.stats.dexterity + 1;
      hero.stats.constitution = hero.stats.constitution + 1;
      hero.stats.intelligence = hero.stats.intelligence + 1;
      hero.stats.wisdom = hero.stats.wisdom + 1;
      hero.stats.charisma = hero.stats.charisma + 1;
      hero.stats.luck = hero.stats.luck + 1;
      hero.level = hero.level + 1;
    } else {
      hero.stats.strength = hero.stats.strength - 1;
      hero.stats.dexterity = hero.stats.dexterity - 1;
      hero.stats.constitution = hero.stats.constitution - 1;
      hero.stats.intelligence = hero.stats.intelligence - 1;
      hero.stats.wisdom = hero.stats.wisdom - 1;
      hero.stats.charisma = hero.stats.charisma - 1;
      hero.stats.luck = hero.stats.luck - 1;
    }

    hero.attributePoints = hero.attributePoints + 1;

    hero.experience = 0;

    hero = this.recalculateStats(hero);
    hero.combat.health = hero.combat.maxHealth;

    return hero;
  }

  experienceNeededForLevel(level: number): number {
    return Math.ceil((level * 60 - (1 / level) * 50) / 10) * 10;
  }

  // turn old heroes into new heroes
  // as heroes are saved/loaded they run through this
  // any time we add a new field we need to make sure to populate it here
  upgrade(data: PartialHero): Hero {
    data.location = data.location ?? {
      x: Math.floor(Math.random() * 128),
      y: Math.floor(Math.random() * 96),
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
      data.inventory = [];
      data.equipment = {
        accessories: [],
      };
      data.version = 2;
    }
    if (data.version < 3) {
      data.currentQuest = null;
      data.questLog = {
        id: data.id,
      };

      data.version = 3;
    }
    if (data.version < 4) {
      // future
    }

    // data.questLog = {
    //   id: data.id,
    // };

    if (data.inventory) {
      data.inventory = data.inventory.filter(
        (item) => !(item.type === InventoryItemType.Quest && item.enchantment)
      );
    }

    data.gold = Math.round(data.gold);
    data.experience = Math.round(data.experience);

    // recalculate stats and turn it into a real hero object
    const hero = checkHero(this.recalculateStats(data as Hero));
    // technically this could still be missing class but we set it here anyway so owell
    hero.class = getClass(hero);

    // return this.recalculateStats(data as Hero);
    return hero;
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
