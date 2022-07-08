import {
  ArtifactAttribute,
  ArtifactAttributeType,
  Hero,
  BaseAccount,
  InventoryItemType,
  EnchantmentType,
  PublicHero,
  Location,
  Quest,
  HeroSkill,
} from "types/graphql";
import { startingLevelCap } from "../../schema/quests/rebirth";
import { hasQuestItem, takeQuestItem } from "../../schema/quests/helpers";
import { BaseItems } from "../../schema/items/base-items";
import { BaseContext } from "../../schema/context";
import { LocationData } from "../../constants";

import DatabaseInterface from "../interface";

const SkillDisplayNames: { [x in HeroSkill]: string } = {
  attackingAccuracy: "Attacking Accuracy",
  attackingDamage: "Attacking Damage",
  castingAccuracy: "Casting Accuracy",
  castingDamage: "Casting Damage",
  vitality: "Vitality",
  resilience: "Resilience",
  regeneration: "Regeneration",
};

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
  | "levelCap"
  | "enchantingDust"
  | "enchantments"
  | "incomingTrades"
  | "outgoingTrades"
  | "settings"
  | "skills"
  | "skillPercent"
  | "activeSkill"
>;

const inMemoryLeaderboardLength = 50;

import { countEnchantments } from "../../schema/items/helpers";
import { getClass } from "./hero/classes";

export default class HeroModel extends DatabaseInterface<Hero> {
  constructor() {
    super("hero");
  }

  countEnchantments(hero: Hero, enchantment: EnchantmentType): number {
    return countEnchantments(hero, enchantment);
  }

  publicHero(hero: Hero, local: boolean): PublicHero {
    return {
      id: hero.id,
      name: hero.name,
      level: hero.level,
      class: hero.class,
      combat: hero.combat,
      local,
    };
  }

  async getHeroesInLocation({
    x,
    y,
    map,
  }: {
    x: number;
    y: number;
    map: string;
  }): Promise<Hero[]> {
    const resultList: Hero[] = [];
    const iterator = this.db.iterate({});
    // ? iterator.seek(...); // You can first seek if you'd like.
    for await (const { key, value } of iterator) {
      if (resultList.length >= inMemoryLeaderboardLength) {
        break;
      }
      if (
        value.location.x !== x ||
        value.location.y !== y ||
        value.location.map !== map
      ) {
        continue;
      } else {
        resultList.push(value);
      }
    } // If the end of the iterable is reached, iterator.end() is callend.
    await iterator.end();

    return resultList;
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
    let bonusHealth = Math.pow(1.08, hero.skills.vitality);

    if (hero.equipment.artifact) {
      const { artifact } = hero.equipment;

      const artifactBuffs: ArtifactAttribute[] =
        artifact.attributes.bonusAffixes;
      artifactBuffs.push(artifact.attributes.namePrefix);
      artifactBuffs.push(artifact.attributes.namePostfix);

      if (artifact.attributes.titlePrefix) {
        artifactBuffs.push(artifact.attributes.titlePrefix);
      }
      if (artifact.attributes.titlePostfix) {
        artifactBuffs.push(artifact.attributes.titlePostfix);
      }

      artifactBuffs.forEach((buff) => {
        if (buff.type === ArtifactAttributeType.BonusHealth) {
          bonusHealth *= buff.magnitude;
        }
      });
    }

    hero.combat.maxHealth = Math.round(
      (hero.stats.constitution * 20 + hero.level * 20) * bonusHealth
    );
    hero.combat.health = Math.round(
      Math.min(
        hero.combat.maxHealth,
        healthPercentBefore * hero.combat.maxHealth
      )
    );
    hero.needed =
      hero.level === hero.levelCap
        ? 1
        : this.experienceNeededForLevel(hero.level);

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

  addExperience(context: BaseContext, hero: Hero, experience: number): Hero {
    // skills: =MIN(1, (B$1/POW(1.8, $A2)))
    // happy mothers day

    experience =
      experience -
      Math.min(1, Math.max(0, hero.skillPercent / 100)) * experience;

    if (hero.skillPercent > 0) {
      // level up skills

      const currentSkillLevel = hero.skills[hero.activeSkill];
      if (currentSkillLevel < 50) {
        const odds = Math.min(
          1,
          hero.skillPercent / Math.pow(1.8, currentSkillLevel)
        );
        // odds are between 0-1, where 1 is 100%
        if (Math.random() < odds) {
          console.log(
            hero.name,
            "Skill leveled up!!",
            currentSkillLevel,
            odds * 100
          );
          hero.skills[hero.activeSkill] += 1;
          context.io.sendNotification(hero.id, {
            message: `Your skills in ${
              SkillDisplayNames[hero.activeSkill]
            } has increased to level ${hero.skills[hero.activeSkill]}`,
            type: "quest",
          });
        }
      }
    }
    experience = Math.floor(experience);
    if (experience <= 0) {
      return hero;
    }

    const { level } = hero;
    const startingExperience = hero.experience;
    let newExperience = hero.experience + experience;
    const experienceNeeded = this.experienceNeededForLevel(level);
    // LEVEL UP
    if (newExperience >= experienceNeeded || hero.level === hero.levelCap) {
      const levelingDoublers = this.countEnchantments(
        hero,
        EnchantmentType.DoubleLeveling
      );
      for (let i = 0, l = Math.pow(2, levelingDoublers); i < l; ++i) {
        hero = this.levelUp(hero);
      }
    } else {
      hero.experience = newExperience;
    }

    return hero;
  }

  levelUp(hero: Hero): Hero {
    let stats: (keyof typeof hero.stats)[] = [
      "strength",
      "dexterity",
      "constitution",
      "intelligence",
      "wisdom",
      "willpower",
      "luck",
    ];

    if (hero.level < hero.levelCap) {
      // we never over-level
      hero.stats.strength = hero.stats.strength + 1;
      hero.stats.dexterity = hero.stats.dexterity + 1;
      hero.stats.constitution = hero.stats.constitution + 1;
      hero.stats.intelligence = hero.stats.intelligence + 1;
      hero.stats.wisdom = hero.stats.wisdom + 1;
      hero.stats.willpower = hero.stats.willpower + 1;
      hero.stats.luck = hero.stats.luck + 1;
      hero.level = hero.level + 1;

      hero.attributePoints = hero.attributePoints + 1;
    } else {
      const extraStats =
        Math.max(
          0,
          hero.stats.strength - Math.max(1, hero.settings.minimumStats.strength)
        ) +
        Math.max(
          0,
          hero.stats.dexterity -
            Math.max(1, hero.settings.minimumStats.dexterity)
        ) +
        Math.max(
          0,
          hero.stats.constitution -
            Math.max(1, hero.settings.minimumStats.constitution)
        ) +
        Math.max(
          0,
          hero.stats.intelligence -
            Math.max(1, hero.settings.minimumStats.intelligence)
        ) +
        Math.max(
          0,
          hero.stats.wisdom - Math.max(1, hero.settings.minimumStats.wisdom)
        ) +
        Math.max(
          0,
          hero.stats.willpower -
            Math.max(1, hero.settings.minimumStats.willpower)
        ) +
        Math.max(
          0,
          hero.stats.luck - Math.max(1, hero.settings.minimumStats.luck)
        );

      // make sure we have 7 stats to spend
      if (extraStats >= 7) {
        const removableStats = stats
          .filter(
            (statName) =>
              hero.stats[statName] > hero.settings.minimumStats[statName]
          )
          .sort((a, b) => hero.stats[a] - hero.stats[b]);

        for (let i = 0, l = stats.length; i < l; ++i) {
          for (let j = 0, lj = stats.length; j < lj; ++j) {
            const statName = stats[(i + j) % stats.length];
            if (hero.stats[statName] > hero.settings.minimumStats[statName]) {
              hero.stats[statName] = hero.stats[statName] - 1;
              break;
            }
          }
        }
        hero.attributePoints = hero.attributePoints + 1;
      }
    }

    hero.experience = 0;

    hero = this.recalculateStats(hero);
    hero.combat.health = hero.combat.maxHealth;

    return hero;
  }

  experienceNeededForLevel(level: number): number {
    return Math.ceil((level * 60 - (1 / level) * 50) / 10) * 10;
  }

  randomStartingLocation(): Location {
    const options = LocationData.default.specialLocations.filter(
      (loc) => loc.type === "dock"
    );

    const choice = options[Math.floor(Math.random() * options.length)];
    return { map: "default", x: choice.x, y: choice.y };
  }

  maxGold(hero: Hero): number {
    // NEVER return a value larger than 9007199254740991
    // that's 9 quadrillion
    const upCount = countEnchantments(hero, EnchantmentType.IncreasedGoldCap);
    // orb + purse?
    if (upCount >= 3) {
      // 5 trillion
      return 5000000000000;
    }
    // orb
    if (upCount >= 2) {
      // 200 billion
      return 200000000000;
    }
    // hero's guidance
    if (upCount >= 1) {
      // 50 billion
      return 50000000000;
    }
    // 2 billion
    return 2000000000;
  }

  // turn old heroes into new heroes
  // as heroes are saved/loaded they run through this
  // any time we add a new field we need to make sure to populate it here
  upgrade(data: PartialHero): Hero {
    data.location = data.location ?? this.randomStartingLocation();
    data.gold = data.gold ?? 0;
    data.level = data.level ?? 1;
    data.experience = data.experience ?? 0;

    data.skillPercent = data.skillPercent ?? 0;
    data.skills = data.skills ?? {
      attackingAccuracy: 0,
      castingAccuracy: 0,
      attackingDamage: 0,
      castingDamage: 0,
      vitality: 0,
      resilience: 0,
      regeneration: 0,
    };

    data.activeSkill = data.activeSkill ?? HeroSkill.Vitality;

    // all skills all default to 0
    // can easily add more here as new skills are introduces and we good
    data.skills.attackingAccuracy = data.skills.attackingAccuracy ?? 0;
    data.skills.castingAccuracy = data.skills.castingAccuracy ?? 0;
    data.skills.attackingDamage = data.skills.attackingDamage ?? 0;
    data.skills.castingDamage = data.skills.castingDamage ?? 0;
    data.skills.vitality = data.skills.vitality ?? 0;
    data.skills.resilience = data.skills.resilience ?? 0;
    data.skills.regeneration = data.skills.regeneration ?? 0;

    data.settings = data.settings ?? {
      autoDust: -1,
      minimumStats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        willpower: 10,
        luck: 10,
      },
    };

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
        willpower: 5,

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
      if (data.questLog) {
        data.questLog.rebirth = null;
      }
      data.enchantments = [];
      data.levelCap = startingLevelCap;
      data.enchantingDust = 0;
      data.version = 4;
    }
    if (data.version < 5) {
      if (data.questLog?.rebirth?.progress === 5000) {
        data.questLog.rebirth.progress = 100;
      }
      data.version = 5;
    }
    if (data.version < 6) {
      if (
        hasQuestItem(data as Hero, "blood-stone") &&
        hasQuestItem(data as Hero, "fishermans-constitution") &&
        hasQuestItem(data as Hero, "vampire-ring")
      ) {
        data = takeQuestItem(data as Hero, "blood-stone");
        data = takeQuestItem(data as Hero, "fishermans-constitution");
      }

      data.version = 6;
    }
    if (data.version < 7) {
      if (
        hasQuestItem(data as Hero, "magic-bubble") &&
        hasQuestItem(data as Hero, "aqua-lungs")
      ) {
        data = takeQuestItem(data as Hero, "magic-bubble");
      }

      data.version = 7;
    }
    if (data.version < 8) {
      if (data?.questLog?.settlements) {
        data.questLog.settlements.id = `${Quest.Settlements}-${data.id}`;
      }

      data.version = 8;
    }

    if (data.inventory) {
      data.inventory = data.inventory.filter(
        (item) => !(item.type === InventoryItemType.Quest && item.enchantment)
      );
    }

    data.gold = data.gold ?? 0;
    data.experience = Math.round(data.experience ?? 0);

    data.incomingTrades = [];
    data.outgoingTrades = [];

    // recalculate stats and turn it into a real hero object
    let hero = this.recalculateStats(data as Hero);
    hero.gold = Math.min(this.maxGold(hero), Math.round(hero.gold));

    if (process.env.MAX_LEVEL_TESTING) {
      while (hero.level < hero.levelCap) {
        hero = this.levelUp(hero);
      }
    }

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
