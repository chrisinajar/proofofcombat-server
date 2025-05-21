import {
  ArtifactAttribute,
  ArtifactAttributeType,
  AttackType,
  Hero,
  BaseAccount,
  InventoryItemType,
  EnchantmentType,
  PublicHero,
  Location,
  Quest,
  HeroSkill,
  HeroStance,
  HeroClasses,
} from "types/graphql";
import { startingLevelCap } from "../../schema/quests/rebirth";
import {
  hasQuestItem,
  heroLocationName,
  takeQuestItem,
} from "../../schema/quests/helpers";
import { BaseItems } from "../../schema/items/base-items";
import { BaseContext } from "../../schema/context";
import { LocationData } from "../../constants";
import { Hero as HeroUnit } from "../../calculations/units/hero";
import { ModifierPersistancyData } from "../../calculations/modifiers/modifier";
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

type HeroData = Hero & { persistedModifiers: ModifierPersistancyData<any>[] };

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
  | "activeStance"
  | "availableStances"
  | "buffs"
  | "attackSpeedRemainder"
>;

// actions as strings or enums to represent any given action that might increase a skill
export type SkillActions = AttackType | "heal";

const inMemoryLeaderboardLength = 50;

import { countEnchantments } from "../../schema/items/helpers";
import { getClass } from "./hero/classes";

export default class HeroModel extends DatabaseInterface<Hero> {
  heroUnitMap: WeakMap<Hero, HeroUnit> = new WeakMap();
  lastLeaderCalculation: number = 0;
  cachedLeaderboard: Hero[] = [];

  constructor() {
    super("hero");
  }

  getUnit(hero: Hero) {
    if (this.heroUnitMap.has(hero)) {
      this.heroUnitMap.get(hero);
    }
    const heroUnit = new HeroUnit(hero);
    // console.log(heroUnit.baseValues);
    // console.log(heroUnit.stats.health);
    this.heroUnitMap.set(hero, heroUnit);

    return heroUnit;
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

  getStoryTier(hero: Hero): number {
    if (!hero.questLog.rebirth || hero.questLog.rebirth.progress < 100) {
      return 0;
    }

    const questItems = hero.inventory.filter(
      (item) => item.type === InventoryItemType.Quest,
    );

    if (questItems.length < 4) {
      return 0;
    }
    let questItemLevel = 0;
    if (hero.questLog.minorClassUpgrades?.finished) {
      questItemLevel++;
    }
    if (hero.questLog.nagaScale?.finished) {
      questItemLevel++;
    }
    if (hero.questLog.tavernChampion?.finished) {
      questItemLevel += 2;
    }
    if (hero.questLog.washedUp?.finished) {
      questItemLevel += 3;
    }
    if (questItems.find((item) => item.baseItem === "orb-of-forbidden-power")) {
      questItemLevel += 10;
      if (hasQuestItem(hero, "void-vessel")) {
        questItemLevel += 20;
      }
    } else if (
      questItems.find(
        (item) => item.baseItem === "cracked-orb-of-forbidden-power",
      )
    ) {
      questItemLevel += 20;
    }

    return questItemLevel;
  }

  async getTopHeros(): Promise<Hero[]> {
    if (this.lastLeaderCalculation > Date.now()) {
      return this.cachedLeaderboard;
    }
    this.lastLeaderCalculation = Date.now() + 1000 * 600;
    const resultList: Hero[] = [];
    const iterator = this.db.iterate({});
    // ? iterator.seek(...); // You can first seek if you'd like.
    for await (const { key, value } of iterator) {
      const valueStoryTier = this.getStoryTier(value);
      if (valueStoryTier === 0) {
        continue;
      }
      let index = -1;
      resultList.forEach((hero, i) => {
        const heroStoryTier = this.getStoryTier(hero);
        if (valueStoryTier < heroStoryTier) {
          return;
        }
        if (valueStoryTier > heroStoryTier) {
          index = i;
          return;
        }
        if (value.level < hero.level) {
          return;
        }
        if (value.level > hero.level) {
          index = i;
          return;
        }
        if (value.enchantingDust < hero.enchantingDust) {
          return;
        }
        // >= because it's the last one
        // in the case of a perfect tie, add them to the list
        if (value.enchantingDust >= hero.enchantingDust) {
          index = i;
          return;
        }
      });

      if (resultList.length < inMemoryLeaderboardLength || index > -1) {
        resultList.splice(index + 1, 0, value);
      }
    } // If the end of the iterable is reached, iterator.end() is callend.
    await iterator.end();

    this.cachedLeaderboard = resultList
      .reverse()
      .slice(0, inMemoryLeaderboardLength)
      .map((hero) => this.upgrade(hero));

    return this.cachedLeaderboard;
  }

  recalculateStats(hero: Hero): Hero {
    const healthPercentBefore = hero.combat.health / hero.combat.maxHealth;

    ///@TODO redo with modifiers
    // if (hero.equipment.artifact) {
    //   const { artifact } = hero.equipment;

    //   const artifactBuffs: ArtifactAttribute[] = [
    //     artifact.attributes.namePrefix,
    //     artifact.attributes.namePostfix,
    //     ...artifact.attributes.bonusAffixes,
    //   ];

    //   if (artifact.attributes.titlePrefix) {
    //     artifactBuffs.push(artifact.attributes.titlePrefix);
    //   }
    //   if (artifact.attributes.titlePostfix) {
    //     artifactBuffs.push(artifact.attributes.titlePostfix);
    //   }

    //   artifactBuffs.forEach((buff) => {
    //     if (buff.type === ArtifactAttributeType.BonusHealth) {
    //       bonusHealth *= buff.magnitude;
    //     }
    //   });
    // }

    const heroUnit = this.getUnit(hero);

    hero.combat.maxHealth = heroUnit.stats.health;
    hero.combat.health = Math.round(
      Math.min(
        hero.combat.maxHealth,
        healthPercentBefore * hero.combat.maxHealth,
      ),
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
          min,
      ),
    );
  }

  rollSkillsForAction(
    context: BaseContext,
    hero: Hero,
    action: SkillActions,
  ): Hero {
    const skills = this.getSkillsForAction(hero, action);
    if (skills.length === 0) {
      return hero;
    }
    const skillToRoll = skills[Math.floor(Math.random() * skills.length)];
    return this.rollSkill(context, hero, skillToRoll, 0.01);
  }

  getSkillsForAction(hero: Hero, action: SkillActions): HeroSkill[] {
    switch (action) {
      case AttackType.Melee:
        return [HeroSkill.AttackingAccuracy, HeroSkill.AttackingDamage];
      case AttackType.Ranged:
        return [HeroSkill.AttackingAccuracy, HeroSkill.AttackingDamage];
      case AttackType.Cast:
        return [HeroSkill.CastingAccuracy, HeroSkill.CastingDamage];
      case AttackType.Blood:
        return [
          HeroSkill.CastingAccuracy,
          HeroSkill.CastingDamage,
          HeroSkill.Vitality,
          HeroSkill.Regeneration,
        ];
      case AttackType.Smite:
        return [HeroSkill.Resilience];
      case "heal":
        return [
          HeroSkill.Regeneration,
          HeroSkill.Resilience,
          HeroSkill.Vitality,
        ];
    }
  }

  rollSkill(
    context: BaseContext,
    hero: Hero,
    skillName: HeroSkill,
    percent: number = 1,
  ): Hero {
    const heroUnit = this.getUnit(hero);

    const currentSkillLevel = hero.skills[skillName];
    let odds = Math.min(
      1,
      percent / Math.pow(1.8, (currentSkillLevel + 1) / 2),
    );
    const bonusSkillChance = heroUnit.stats.bonusSkillChance;

    if (bonusSkillChance > 1) {
      odds *= bonusSkillChance;
    }
    // this happens kind of a lot
    // console.log("rolling skill", skillName, odds);
    // odds are between 0-1, where 1 is 100%
    if (Math.random() < odds) {
      hero = this.levelUpSkill(context, hero, skillName);
    }

    return hero;
  }
  levelUpSkill(context: BaseContext, hero: Hero, skillName: HeroSkill): Hero {
    const currentSkillLevel = hero.skills[skillName];
    if (currentSkillLevel >= 99) {
      return hero;
    }

    console.log(hero.name, "Skill leveled up!!", currentSkillLevel);

    hero.skills[skillName] += 1;
    if (hero.skillPercent === 69) {
      if (hero.skills[skillName] === 69) {
        context.io.sendNotification(hero.id, {
          message: `Your skills in ${
            SkillDisplayNames[skillName]
          } has increased to level ${hero.skills[skillName]}. NOICE.`,
          type: "quest",
        });
      } else {
        context.io.sendNotification(hero.id, {
          message: `Your skills in ${
            SkillDisplayNames[skillName]
          } has increased to level ${hero.skills[skillName]}. Nice.`,
          type: "quest",
        });
      }
    } else {
      if (hero.skills[skillName] === 69) {
        context.io.sendNotification(hero.id, {
          message: `Your skills in ${
            SkillDisplayNames[skillName]
          } has increased to level ${hero.skills[skillName]}. Nice.`,
          type: "quest",
        });
      } else {
        context.io.sendNotification(hero.id, {
          message: `Your skills in ${
            SkillDisplayNames[skillName]
          } has increased to level ${hero.skills[skillName]}`,
          type: "quest",
        });
      }
    }
    return hero;
  }

  addExperience(context: BaseContext, hero: Hero, experience: number): Hero {
    const heroUnit = this.getUnit(hero);
    const bonusExperience = heroUnit.stats.bonusExperience;
    if (bonusExperience > 1) {
      experience *= bonusExperience;
    }

    experience =
      experience -
      Math.min(1, Math.max(0, hero.skillPercent / 100)) * experience;

    if (hero.skillPercent > 0) {
      // level up skills
      hero = this.rollSkill(
        context,
        hero,
        hero.activeSkill,
        hero.skillPercent / 100,
      );
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
        EnchantmentType.DoubleLeveling,
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
          hero.stats.strength -
            Math.max(1, hero.settings.minimumStats.strength),
        ) +
        Math.max(
          0,
          hero.stats.dexterity -
            Math.max(1, hero.settings.minimumStats.dexterity),
        ) +
        Math.max(
          0,
          hero.stats.constitution -
            Math.max(1, hero.settings.minimumStats.constitution),
        ) +
        Math.max(
          0,
          hero.stats.intelligence -
            Math.max(1, hero.settings.minimumStats.intelligence),
        ) +
        Math.max(
          0,
          hero.stats.wisdom - Math.max(1, hero.settings.minimumStats.wisdom),
        ) +
        Math.max(
          0,
          hero.stats.willpower -
            Math.max(1, hero.settings.minimumStats.willpower),
        ) +
        Math.max(
          0,
          hero.stats.luck - Math.max(1, hero.settings.minimumStats.luck),
        );

      // make sure we have 7 stats to spend
      if (extraStats >= 7) {
        const removableStats = stats
          .filter(
            (statName) =>
              hero.stats[statName] > hero.settings.minimumStats[statName],
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
      (loc) => loc.type === "dock",
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
    data.attackSpeedRemainder = data.attackSpeedRemainder ?? 0;

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

    data.activeStance = data.activeStance ?? HeroStance.Normal;
    data.availableStances = data.availableStances ?? [HeroStance.Normal];

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
        (item) => !(item.type === InventoryItemType.Quest && item.enchantment),
      );
    }

    data.gold = data.gold ?? 0;
    data.experience = Math.round(data.experience ?? 0);

    data.incomingTrades = [];
    data.outgoingTrades = [];

    if (data.questLog?.washedUp) {
      data.questLog.washedUp.progress = Math.floor(
        data.questLog.washedUp.progress,
      );
    }

    if (data.version < 9) {
      if (
        (hasQuestItem(data as Hero, "orb-of-forbidden-power") ||
          hasQuestItem(data as Hero, "cracked-orb-of-forbidden-power")) &&
        hasQuestItem(data as Hero, "totem-of-hero-rebirth")
      ) {
        data = takeQuestItem(data as Hero, "totem-of-hero-rebirth");
      }
      if (
        (hasQuestItem(data as Hero, "orb-of-forbidden-power") ||
          hasQuestItem(data as Hero, "cracked-orb-of-forbidden-power")) &&
        hasQuestItem(data as Hero, "totem-of-hero")
      ) {
        data = takeQuestItem(data as Hero, "totem-of-hero");
      }
      data.version = 9;
    }

    if (data.version < 10) {
      // 31 is a glitch because of bitwise combining progress incorrectly
      if (data?.questLog?.meetTheQueen?.progress === 31) {
        data.questLog.meetTheQueen = null;
      }
      data.version = 10;
    }

    if (!data.buffs) {
      data.buffs = {
        blessing: null,
      };
    }

    // recalculate stats and turn it into a real hero object
    let hero = this.recalculateStats(data as Hero);
    hero.gold = Math.min(this.maxGold(hero), Math.round(hero.gold));

    if (process.env.MAX_LEVEL_TESTING) {
      while (hero.level < hero.levelCap) {
        hero = this.levelUp(hero);
      }
    }

    hero.class = getClass(hero);
    data.availableStances = this.getAvailableStances(hero);

    // return this.recalculateStats(data as Hero);
    return hero;
  }

  getAvailableStances(hero: Hero): HeroStance[] {
    switch (hero.class) {
      case HeroClasses.Zealot:
        return [HeroStance.Normal, HeroStance.Sunder, HeroStance.Blight];
        break;

      case HeroClasses.MasterWarlock:
      case HeroClasses.MasterWizard:
        return [HeroStance.Fire, HeroStance.Ice, HeroStance.Lightning];
        break;

      case HeroClasses.EnragedBerserker:
        return [HeroStance.Normal, HeroStance.Reckless];
    }
    return [HeroStance.Normal];
    // return [HeroStance.Normal, HeroStance.Reckless];
  }

  async create(account: BaseAccount): Promise<Hero> {
    if (account.hero) {
      return this.upgrade(account.hero);
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
      }),
    );
  }

  async put(data: Hero) {
    const heroUnit = this.getUnit(data);
    const heroData = data as HeroData;
    heroData.persistedModifiers = heroUnit.getPersistentModifiers();
    return super.put(heroData);
  }

  async get(id: string): Promise<Hero> {
    // console.log("get", id);
    const data = (await super.get(id)) as HeroData;
    // console.log(data.persistedModifiers);
    const heroUnit = this.getUnit(data);
    // console.log(heroUnit.getPersistentModifiers());
    // console.log(data);
    return data;
  }
}
