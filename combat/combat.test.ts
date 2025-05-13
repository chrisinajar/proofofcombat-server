import {
  AttackType,
  Hero,
  HeroStats,
  EnchantmentType,
  HeroClasses,
  EquipmentSlots,
  InventoryItemType,
  DamageType,
} from "types/graphql";
import {
  calculateOdds,
  createHeroCombatant,
  createMonsterCombatant,
  Combatant,
  attributesForAttack,
  calculateDamageValues,
  calculateDamage,
} from "./";
import Databases from "../db";
import { getEnchantedAttributes } from "./enchantments";
import { calculateEnchantmentDamage } from "./calculate-enchantment-damage";
import {
  GenericStatsModifier,
  GenericStatsModifierOptions,
} from "../calculations/modifiers/generic-stats-modifier";
import type { ModifierOptions } from "../calculations/modifiers/modifier";

type Attribute = keyof HeroStats;

function generateHero(): Hero {
  const hero = Databases.hero.upgrade({
    id: "asdf",
    name: "test",
    location: {
      x: 0,
      y: 0,
      map: "default",
    },
  });
  hero.combat.health = hero.combat.maxHealth;

  return hero;
}

function getAverageDamage(
  heroA: Combatant,
  attackType: AttackType,
  heroB: Combatant,
  debug: boolean = false,
) {
  const {
    baseDamage,
    variation,
    criticalChance,
    doubleCriticalChance,
    trippleCriticalChance,
    multiplier,
  } = calculateDamageValues(heroA, heroB, false, debug);

  return (
    (baseDamage - variation / 2) *
    ((1 + criticalChance * 3) *
      (1 + criticalChance * doubleCriticalChance * 3) *
      (1 + criticalChance * doubleCriticalChance * trippleCriticalChance * 3)) *
    multiplier
  );
}

function getHitOdds(
  heroA: Combatant,
  attackType: AttackType,
  heroB: Combatant,
  debug: boolean = false,
) {
  return calculateOdds(heroA, heroB, false);
}

type StatDistribution = { [x in Attribute]?: number };

function levelUpHero(
  hero: Hero,
  levels: number,
  stats: StatDistribution,
): Hero {
  hero.level += levels;
  let pointsToSpend = levels * 7;

  hero.stats.strength += levels;
  hero.stats.dexterity += levels;
  hero.stats.constitution += levels;
  hero.stats.intelligence += levels;
  hero.stats.wisdom += levels;
  hero.stats.willpower += levels;
  hero.stats.luck += levels;

  const totalRatio = Object.values(stats).reduce((memo, val) => memo + val);

  const singleWeight = pointsToSpend / totalRatio;

  const statList = Object.keys(stats) as Attribute[];
  const orderedStats: Attribute[] = statList.sort(
    (a, b) => hero.stats[a] - hero.stats[b],
  );

  if (!orderedStats.length) {
    hero.stats.strength += levels;
    hero.stats.dexterity += levels;
    hero.stats.constitution += levels;
    hero.stats.intelligence += levels;
    hero.stats.wisdom += levels;
    hero.stats.willpower += levels;
    hero.stats.luck += levels;
  } else {
    orderedStats.forEach((stat) => {
      if (stat && stats && stats[stat]) {
        const rawValue = stats[stat] * singleWeight;
        const toAdd = Math.floor(rawValue);
        hero.stats[stat] += toAdd;
        pointsToSpend -= toAdd;
      }
    });

    const lastStat = orderedStats.pop();
    if (lastStat) {
      hero.stats[lastStat] += pointsToSpend;
    }
  }
  return hero;
}

function simulateMonsterCombat(
  hero: Combatant,
  level: number,
  attackType: AttackType,
  debug: boolean = false,
) {
  const monster = createMonsterCombatant({
    level,
    name: `Level ${level} Mob`,
    attackType: AttackType.Melee,
    combat: {
      health: Math.round(Math.pow(1.4, level) * 8),
      maxHealth: Math.round(Math.pow(1.4, level) * 8),
    },
  });

  const heroHitOdds = getHitOdds(hero, attackType, monster);
  const heroAverageDamage = getAverageDamage(hero, attackType, monster, debug);

  const monsterHitOdds = getHitOdds(monster, AttackType.Melee, hero);
  const monsterAverageDamage = getAverageDamage(
    monster,
    AttackType.Melee,
    hero,
    debug,
  );

  return {
    heroHitOdds,
    heroAverageDamage,
    monsterHitOdds,
    monsterAverageDamage,
  };
}

function snapshotUnitAttributes(attributes: { [x in string]: number }) {
  Object.keys(attributes).forEach((key) => {
    attributes[key] = Math.round(attributes[key]);
  });
  expect(attributes).toMatchSnapshot();
}

describe("combat", () => {
  const combatTypes: {
    attackType: AttackType;
    weapons: InventoryItemType[];
  }[] = [
    {
      attackType: AttackType.Melee,
      weapons: [InventoryItemType.MeleeWeapon],
    },
    {
      attackType: AttackType.Ranged,
      weapons: [InventoryItemType.RangedWeapon],
    },
    {
      attackType: AttackType.Blood,
      weapons: [InventoryItemType.Shield],
    },
    {
      attackType: AttackType.Cast,
      weapons: [InventoryItemType.SpellFocus],
    },
    {
      attackType: AttackType.Smite,
      weapons: [InventoryItemType.Shield],
    },
  ];
  combatTypes.forEach((entry) => {
    const stats = attributesForAttack(entry.attackType);
    describe(`attacking with ${entry.attackType}`, () => {
      it(`increasing ${stats.toHit} makes it easier to hit`, () => {
        const hero = generateHero();
        const hero2 = generateHero();
        const hero2Combatant = createHeroCombatant(hero2, entry.attackType);
        const oddsBefore = getHitOdds(
          createHeroCombatant(hero, entry.attackType),
          entry.attackType,
          hero2Combatant,
        );

        hero.stats[stats.toHit] *= 1.5;

        const oddsAfter = getHitOdds(
          createHeroCombatant(hero, entry.attackType),
          entry.attackType,
          hero2Combatant,
        );
        expect(oddsBefore).toBeLessThan(oddsAfter);
      });
      it(`increasing ${stats.damage} makes you do more damage`, () => {
        const hero = generateHero();
        const hero2 = generateHero();
        const hero2Combatant = createHeroCombatant(hero2, entry.attackType);
        const damageBefore = getAverageDamage(
          createHeroCombatant(hero, entry.attackType),
          entry.attackType,
          hero2Combatant,
        );

        hero.stats[stats.damage] *= 1.5;

        const damageAfter = getAverageDamage(
          createHeroCombatant(hero, entry.attackType),
          entry.attackType,
          hero2Combatant,
        );
        expect(damageBefore).toBeLessThan(damageAfter);
      });
      it(`increasing ${stats.damage} a little makes you do more damage even with big weapons`, () => {
        const hero = generateHero();
        const hero2 = generateHero();
        const hero2Combatant = createHeroCombatant(hero2, entry.attackType);
        hero.equipment.leftHand = {
          level: 32,
          type: entry.weapons[0],
          id: "test-weapon",
          baseItem: "test-weapon",
          name: "test-weapon",
          owner: "test-hero",
        };
        if (entry.weapons[1]) {
          hero.equipment.rightHand = {
            level: 32,
            type: entry.weapons[1],
            id: "test-weapon",
            baseItem: "test-weapon",
            name: "test-weapon",
            owner: "test-hero",
          };
        }
        const damageBefore = getAverageDamage(
          createHeroCombatant(hero, entry.attackType),
          entry.attackType,
          hero2Combatant,
        );

        hero.stats[stats.damage] *= 1.1;

        const damageAfter = getAverageDamage(
          createHeroCombatant(hero, entry.attackType),
          entry.attackType,
          hero2Combatant,
        );
        expect(damageBefore).toBeLessThan(damageAfter);
      });
      it(`having a ton of ${stats.damage} makes you do way more damage`, () => {
        const hero = generateHero();
        const hero2 = generateHero();
        const hero2Combatant = createHeroCombatant(hero2, entry.attackType);
        const damageBefore = getAverageDamage(
          createHeroCombatant(hero, entry.attackType),
          entry.attackType,
          hero2Combatant,
        );

        hero.stats[stats.damage] *= 1000;

        const damageAfter = getAverageDamage(
          createHeroCombatant(hero, entry.attackType),
          entry.attackType,
          hero2Combatant,
        );
        expect(damageBefore * 50).toBeLessThan(damageAfter);
      });
    });
  });
  describe("blood combat", () => {
    it("works with huge numbers", () => {
      const hero = levelUpHero(generateHero(), 5000, { constitution: 1 });

      hero.class = HeroClasses.Vampire;
      // hero.attackType = AttackType.Blood;
      hero.skills.regeneration = 25;

      hero.equipment.footArmor = {
        id: "test-foot-armor",
        type: InventoryItemType.FootArmor,
        level: 34,
        enchantment: EnchantmentType.SuperVamp,
        baseItem: "test-foot-armor",
        name: "test-foot-armor",
        owner: hero.id,
      };
      hero.equipment.bodyArmor = {
        id: "test-body-armor",
        type: InventoryItemType.BodyArmor,
        level: 34,
        enchantment: EnchantmentType.SuperVamp,
        baseItem: "test-body-armor",
        name: "test-body-armor",
        owner: hero.id,
      };

      let heroCombatant = createHeroCombatant(hero, AttackType.Melee);
      const monster = createMonsterCombatant({
        level: 60,
        name: `Level ${60} Mob`,
        attackType: AttackType.Melee,
        combat: {
          health: Math.round(Math.pow(1.4, 60) * 8),
          maxHealth: Math.round(Math.pow(1.4, 60) * 8),
        },
      });

      heroCombatant.health = heroCombatant.maxHealth;

      let result = calculateEnchantmentDamage(heroCombatant, monster);
      expect(result.attackerHeal).toBeLessThan(30000000);
    });
    it("should reduce enemy enchantment resistance", () => {
      const hero = generateHero();
      const hero2 = generateHero();

      let heroCombatant = createHeroCombatant(hero, AttackType.Melee);
      let hero2Combatant = createHeroCombatant(hero2, AttackType.Melee);

      let result = getEnchantedAttributes(heroCombatant, hero2Combatant);
      calculateEnchantmentDamage(result.attacker, result.victim);

      const percentBefore = result.victim.percentageEnchantmentDamageReduction;

      expect(percentBefore).toBe(1);

      heroCombatant = createHeroCombatant(hero, AttackType.Blood);

      result = getEnchantedAttributes(heroCombatant, hero2Combatant);
      calculateEnchantmentDamage(result.attacker, result.victim);

      expect(result.victim.percentageEnchantmentDamageReduction).toBe(0.75);
    });
  });
});
describe("builds", () => {
  type gearFunction = () => EquipmentSlots;
  function testBuilds(
    buildName: string,
    attackType: AttackType,
    heroClass: HeroClasses,
    trashGear: gearFunction,
    normalGear: gearFunction,
    greatGear: gearFunction,
    uberGear: gearFunction,
    stats: StatDistribution,
  ): void {
    describe("trash items", () => {
      it("can kill level 1 mobs", () => {
        const hero = generateHero();
        hero.equipment = trashGear();
        hero.class = heroClass;

        const heroCombatant = createHeroCombatant(hero, attackType);
        heroCombatant.equipment.quests = hero.equipment.accessories;

        const {
          heroHitOdds,
          heroAverageDamage,
          monsterHitOdds,
          monsterAverageDamage,
        } = simulateMonsterCombat(heroCombatant, 1, attackType);

        expect(heroHitOdds).toBeGreaterThan(0.5);
        expect(heroAverageDamage).toBeGreaterThan(10);

        const { attacker, victim } = getEnchantedAttributes(
          heroCombatant,
          createMonsterCombatant({
            level: 32,
            name: `Level ${32} Mob`,
            attackType: AttackType.Melee,
            combat: {
              health: Math.round(Math.pow(1.4, 32) * 8),
              maxHealth: Math.round(Math.pow(1.4, 32) * 8),
            },
          }),
        );

        snapshotUnitAttributes({
          strength: attacker.unit.stats.strength,
          dexterity: attacker.unit.stats.dexterity,
          constitution: attacker.unit.stats.constitution,
          intelligence: attacker.unit.stats.intelligence,
          wisdom: attacker.unit.stats.wisdom,
          willpower: attacker.unit.stats.willpower,
          luck: attacker.unit.stats.luck,
        });
      });
      it("can kill level 2 mobs", () => {
        const hero = generateHero();
        // level 3 attempts mob #2...
        levelUpHero(hero, 2, stats);
        hero.equipment = trashGear();
        hero.class = heroClass;

        const heroCombatant = createHeroCombatant(hero, attackType);
        heroCombatant.equipment.quests = hero.equipment.accessories;

        const {
          heroHitOdds,
          heroAverageDamage,
          monsterHitOdds,
          monsterAverageDamage,
        } = simulateMonsterCombat(heroCombatant, 2, attackType);

        expect(heroHitOdds).toBeGreaterThan(0.5);
        expect(heroAverageDamage).toBeGreaterThan(10);
      });
      it("can kill level 3 mobs", () => {
        const hero = generateHero();
        // level 4 attempts mob #3...
        levelUpHero(hero, 3, stats);
        hero.equipment = trashGear();
        hero.class = heroClass;

        const heroCombatant = createHeroCombatant(hero, attackType);
        heroCombatant.equipment.quests = hero.equipment.accessories;

        const {
          heroHitOdds,
          heroAverageDamage,
          monsterHitOdds,
          monsterAverageDamage,
        } = simulateMonsterCombat(heroCombatant, 3, attackType);

        expect(heroHitOdds).toBeGreaterThan(0.5);
        expect(heroAverageDamage).toBeGreaterThan(15);
      });
      it("can't' kill level 5 mobs without gear", () => {
        const hero = generateHero();
        // level 4 attempts mob #5...
        levelUpHero(hero, 3, stats);
        hero.equipment = trashGear();
        hero.class = heroClass;

        const heroCombatant = createHeroCombatant(hero, attackType);
        heroCombatant.equipment.quests = hero.equipment.accessories;

        const {
          heroHitOdds,
          heroAverageDamage,
          monsterHitOdds,
          monsterAverageDamage,
        } = simulateMonsterCombat(heroCombatant, 6, attackType);

        expect(heroHitOdds * heroAverageDamage).toBeLessThan(100);
      });
    });

    describe("normal items", () => {
      it("can kill level 5 mobs", () => {
        const hero = generateHero();
        // level 5 attempts mob #5...
        levelUpHero(hero, 4, stats);
        hero.equipment = normalGear();
        hero.class = heroClass;

        const heroCombatant = createHeroCombatant(hero, attackType);
        heroCombatant.equipment.quests = hero.equipment.accessories;

        const {
          heroHitOdds,
          heroAverageDamage,
          monsterHitOdds,
          monsterAverageDamage,
        } = simulateMonsterCombat(heroCombatant, 5, attackType);

        expect(heroHitOdds).toBeGreaterThan(0.5);
        expect(heroAverageDamage).toBeGreaterThan(100);

        const { attacker, victim } = getEnchantedAttributes(
          heroCombatant,
          createMonsterCombatant({
            level: 32,
            name: `Level ${32} Mob`,
            attackType: AttackType.Melee,
            combat: {
              health: Math.round(Math.pow(1.4, 32) * 8),
              maxHealth: Math.round(Math.pow(1.4, 32) * 8),
            },
          }),
        );

        snapshotUnitAttributes({
          strength: attacker.unit.stats.strength,
          dexterity: attacker.unit.stats.dexterity,
          constitution: attacker.unit.stats.constitution,
          intelligence: attacker.unit.stats.intelligence,
          wisdom: attacker.unit.stats.wisdom,
          willpower: attacker.unit.stats.willpower,
          luck: attacker.unit.stats.luck,
        });
      });
      it("can kill level 10 mobs with enough stats", () => {
        const hero = generateHero();
        // level 100 attempts mob #5...
        levelUpHero(hero, 100, stats);
        hero.equipment = normalGear();
        hero.class = heroClass;

        const heroCombatant = createHeroCombatant(hero, attackType);
        heroCombatant.equipment.quests = hero.equipment.accessories;

        const {
          heroHitOdds,
          heroAverageDamage,
          monsterHitOdds,
          monsterAverageDamage,
        } = simulateMonsterCombat(heroCombatant, 10, attackType);

        expect(heroHitOdds).toBeGreaterThan(0.5);
        expect(heroAverageDamage).toBeGreaterThan(200);
      });
    });
    describe("great items", () => {
      it("can destroy 28's", () => {
        const hero = generateHero();
        levelUpHero(hero, 5000, stats);
        hero.equipment = greatGear();
        hero.class = heroClass;

        const heroCombatant = createHeroCombatant(hero, attackType);
        heroCombatant.equipment.quests = hero.equipment.accessories;

        const {
          heroHitOdds,
          heroAverageDamage,
          monsterHitOdds,
          monsterAverageDamage,
        } = simulateMonsterCombat(heroCombatant, 28, attackType);

        expect(heroHitOdds).toBeGreaterThan(0.8);
        expect(heroAverageDamage).toBeGreaterThan(5000);

        const { attacker, victim } = getEnchantedAttributes(
          heroCombatant,
          createMonsterCombatant({
            level: 32,
            name: `Level ${32} Mob`,
            attackType: AttackType.Melee,
            combat: {
              health: Math.round(Math.pow(1.4, 32) * 8),
              maxHealth: Math.round(Math.pow(1.4, 32) * 8),
            },
          }),
        );

        snapshotUnitAttributes({
          strength: attacker.unit.stats.strength,
          dexterity: attacker.unit.stats.dexterity,
          constitution: attacker.unit.stats.constitution,
          intelligence: attacker.unit.stats.intelligence,
          wisdom: attacker.unit.stats.wisdom,
          willpower: attacker.unit.stats.willpower,
          luck: attacker.unit.stats.luck,
        });
      });
      it("can farm level 32s at max level", () => {
        const hero = generateHero();
        levelUpHero(hero, 5000, stats);
        hero.equipment = greatGear();
        hero.class = heroClass;

        const heroCombatant = createHeroCombatant(hero, attackType);
        heroCombatant.equipment.quests = hero.equipment.accessories;

        const {
          heroHitOdds,
          heroAverageDamage,
          monsterHitOdds,
          monsterAverageDamage,
        } = simulateMonsterCombat(heroCombatant, 32, attackType);

        expect(heroHitOdds).toBeGreaterThan(0.5);
        expect(heroAverageDamage).toBeGreaterThan(2000);
      });
    });
    describe("uber items", () => {
      it("can deal destroy 32s at max level", () => {
        const hero = generateHero();
        // level 10 attempts mob #5...
        levelUpHero(hero, 5000, stats);
        hero.equipment = uberGear();
        hero.class = heroClass;

        const heroCombatant = createHeroCombatant(hero, attackType);
        heroCombatant.equipment.quests = hero.equipment.accessories;

        const {
          heroHitOdds,
          heroAverageDamage,
          monsterHitOdds,
          monsterAverageDamage,
        } = simulateMonsterCombat(heroCombatant, 32, attackType);

        expect(heroHitOdds).toBeGreaterThan(0.8);
        expect(heroAverageDamage).toBeGreaterThan(5000);

        const { attacker, victim } = getEnchantedAttributes(
          heroCombatant,
          createMonsterCombatant({
            level: 32,
            name: `Level ${32} Mob`,
            attackType: AttackType.Melee,
            combat: {
              health: Math.round(Math.pow(1.4, 32) * 8),
              maxHealth: Math.round(Math.pow(1.4, 32) * 8),
            },
          }),
        );

        snapshotUnitAttributes({
          strength: attacker.unit.stats.strength,
          dexterity: attacker.unit.stats.dexterity,
          constitution: attacker.unit.stats.constitution,
          intelligence: attacker.unit.stats.intelligence,
          wisdom: attacker.unit.stats.wisdom,
          willpower: attacker.unit.stats.willpower,
          luck: attacker.unit.stats.luck,
        });
      });
    });
  }
  // end test generator function

  // start builds
  describe("archer", () => {
    const trashGear = () => ({
      leftHand: { level: 1, type: InventoryItemType.RangedWeapon },
      bodyArmor: { level: 1, type: InventoryItemType.BodyArmor },
      handArmor: { level: 1, type: InventoryItemType.HandArmor },
      legArmor: { level: 1, type: InventoryItemType.LegArmor },
      headArmor: { level: 1, type: InventoryItemType.HeadArmor },
      footArmor: { level: 1, type: InventoryItemType.FootArmor },
      accessories: [],
    });
    const normalGear = () => ({
      leftHand: {
        level: 5,
        type: InventoryItemType.RangedWeapon,
        enchantment: EnchantmentType.BonusDexterity,
      },
      bodyArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusDexterity,
        type: InventoryItemType.BodyArmor,
      },
      handArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusDexterity,
        type: InventoryItemType.HandArmor,
      },
      legArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusDexterity,
        type: InventoryItemType.LegArmor,
      },
      headArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusDexterity,
        type: InventoryItemType.HeadArmor,
      },
      footArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusDexterity,
        type: InventoryItemType.FootArmor,
      },
      accessories: [
        { name: "fisherman's dex", baseItem: "fishermans-dexterity" },
      ],
    });
    const greatGear = () => ({
      leftHand: {
        level: 30,
        type: InventoryItemType.RangedWeapon,
        enchantment: EnchantmentType.DexteritySteal,
      },
      bodyArmor: {
        level: 28,
        enchantment: EnchantmentType.DexteritySteal,
        type: InventoryItemType.BodyArmor,
      },
      handArmor: {
        level: 28,
        enchantment: EnchantmentType.DexteritySteal,
        type: InventoryItemType.HandArmor,
      },
      legArmor: {
        level: 28,
        enchantment: EnchantmentType.DexteritySteal,
        type: InventoryItemType.LegArmor,
      },
      headArmor: {
        level: 28,
        enchantment: EnchantmentType.DexteritySteal,
        type: InventoryItemType.HeadArmor,
      },
      footArmor: {
        level: 28,
        enchantment: EnchantmentType.DexteritySteal,
        type: InventoryItemType.FootArmor,
      },
      accessories: [
        { name: "fisherman's dex", baseItem: "fishermans-dexterity" },
      ],
    });
    const uberGear = () => ({
      leftHand: {
        level: 33,
        type: InventoryItemType.RangedWeapon,
        enchantment: EnchantmentType.WisDexWill,
      },
      bodyArmor: {
        level: 33,
        enchantment: EnchantmentType.WisDexWill,
        type: InventoryItemType.BodyArmor,
      },
      handArmor: {
        level: 33,
        enchantment: EnchantmentType.WisDexWill,
        type: InventoryItemType.HandArmor,
      },
      legArmor: {
        level: 33,
        enchantment: EnchantmentType.WisDexWill,
        type: InventoryItemType.LegArmor,
      },
      headArmor: {
        level: 33,
        enchantment: EnchantmentType.AllStatsSteal,
        type: InventoryItemType.HeadArmor,
      },
      footArmor: {
        level: 33,
        enchantment: EnchantmentType.AllStatsSteal,
        type: InventoryItemType.FootArmor,
      },
      accessories: [
        { name: "fisherman's dex", baseItem: "fishermans-dexterity" },
      ],
    });

    testBuilds(
      "archer",
      AttackType.Ranged,
      HeroClasses.Ranger,
      trashGear as unknown as gearFunction,
      normalGear as unknown as gearFunction,
      greatGear as unknown as gearFunction,
      uberGear as unknown as gearFunction,
      { dexterity: 0.8, luck: 0.2 },
    );
  });

  describe("melee", () => {
    const trashGear = () => ({
      leftHand: { level: 1, type: InventoryItemType.MeleeWeapon },
      bodyArmor: { level: 1, type: InventoryItemType.BodyArmor },
      handArmor: { level: 1, type: InventoryItemType.HandArmor },
      legArmor: { level: 1, type: InventoryItemType.LegArmor },
      headArmor: { level: 1, type: InventoryItemType.HeadArmor },
      footArmor: { level: 1, type: InventoryItemType.FootArmor },
      accessories: [],
    });
    const normalGear = () => ({
      leftHand: {
        level: 5,
        enchantment: EnchantmentType.BonusStrength,
        type: InventoryItemType.MeleeWeapon,
      },
      rightHand: {
        level: 5,
        enchantment: EnchantmentType.BonusStrength,
        type: InventoryItemType.MeleeWeapon,
      },
      bodyArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusStrength,
        type: InventoryItemType.BodyArmor,
      },
      handArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusStrength,
        type: InventoryItemType.HandArmor,
      },
      legArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusDexterity,
        type: InventoryItemType.LegArmor,
      },
      headArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusDexterity,
        type: InventoryItemType.HeadArmor,
      },
      footArmor: {
        level: 5,
        enchantment: EnchantmentType.BonusDexterity,
        type: InventoryItemType.FootArmor,
      },
      accessories: [
        { name: "fisherman's str", baseItem: "fishermans-strength" },
        { name: "fisherman's dex", baseItem: "fishermans-dexterity" },
      ],
    });
    const greatGear = () => ({
      leftHand: {
        level: 30,
        enchantment: EnchantmentType.DexteritySteal,
        type: InventoryItemType.MeleeWeapon,
      },
      bodyArmor: {
        level: 28,
        enchantment: EnchantmentType.DexteritySteal,
        type: InventoryItemType.BodyArmor,
      },
      handArmor: {
        level: 28,
        enchantment: EnchantmentType.DexteritySteal,
        type: InventoryItemType.HandArmor,
      },
      legArmor: {
        level: 28,
        enchantment: EnchantmentType.StrengthSteal,
        type: InventoryItemType.LegArmor,
      },
      headArmor: {
        level: 28,
        enchantment: EnchantmentType.StrengthSteal,
        type: InventoryItemType.HeadArmor,
      },
      footArmor: {
        level: 28,
        enchantment: EnchantmentType.StrengthSteal,
        type: InventoryItemType.FootArmor,
      },
      accessories: [
        { name: "fisherman's str", baseItem: "fishermans-strength" },
        { name: "fisherman's dex", baseItem: "fishermans-dexterity" },
        { name: "hero guidance", baseItem: "heros-guidance" },
      ],
    });
    const uberGear = () => ({
      leftHand: {
        level: 33,
        enchantment: EnchantmentType.BigMelee,
        type: InventoryItemType.MeleeWeapon,
      },
      bodyArmor: {
        level: 33,
        enchantment: EnchantmentType.BigMelee,
        type: InventoryItemType.BodyArmor,
      },
      handArmor: {
        level: 33,
        enchantment: EnchantmentType.BigMelee,
        type: InventoryItemType.HandArmor,
      },
      legArmor: {
        level: 33,
        enchantment: EnchantmentType.AllStatsSteal,
        type: InventoryItemType.LegArmor,
      },
      headArmor: {
        level: 33,
        enchantment: EnchantmentType.AllStatsSteal,
        type: InventoryItemType.HeadArmor,
      },
      footArmor: {
        level: 33,
        enchantment: EnchantmentType.AllStatsSteal,
        type: InventoryItemType.FootArmor,
      },
      accessories: [
        { name: "fisherman's str", baseItem: "fishermans-strength" },
        { name: "fisherman's dex", baseItem: "fishermans-dexterity" },
        { name: "hero guidance", baseItem: "heros-guidance" },
      ],
    });

    testBuilds(
      "melee",
      AttackType.Melee,
      HeroClasses.Fighter,
      trashGear as unknown as gearFunction,
      normalGear as unknown as gearFunction,
      greatGear as unknown as gearFunction,
      uberGear as unknown as gearFunction,
      { strength: 0.6, dexterity: 0.3, luck: 0.1 },
    );
  });
});

describe("calculateEnchantmentDamage", () => {
  it("should calculate damage correctly", () => {
    const hero = levelUpHero(generateHero(), 1000, { constitution: 1 });
    const hero2 = levelUpHero(generateHero(), 1000, { constitution: 1 });
    let result = calculateEnchantmentDamage(
      createHeroCombatant(hero, AttackType.Melee),
      createHeroCombatant(hero2, AttackType.Melee),
    );
    expect(result).toMatchSnapshot();

    hero.equipment.leftHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.SuperVampStats,
      id: "test-weapon",
      baseItem: "test-weapon",
      name: "test-weapon",
      owner: hero.id,
    };
    // hero.equipment.rightHand = {
    //   level: 1,
    //   type: InventoryItemType.MeleeWeapon,
    //   enchantment: EnchantmentType.SuperVampStats,
    // };

    result = calculateEnchantmentDamage(
      createHeroCombatant(hero, AttackType.Melee),
      createHeroCombatant(hero2, AttackType.Melee),
    );

    expect(result).toMatchSnapshot();

    hero.equipment.rightHand = {
      level: 1,
      type: InventoryItemType.MeleeWeapon,
      enchantment: EnchantmentType.SuperVampStats,
      id: "test-weapon",
      baseItem: "test-weapon",
      name: "test-weapon",
      owner: hero.id,
    };

    result = calculateEnchantmentDamage(
      createHeroCombatant(hero, AttackType.Melee),
      createHeroCombatant(hero2, AttackType.Melee),
    );

    expect(result).toMatchSnapshot();

    result = calculateEnchantmentDamage(
      createHeroCombatant(hero, AttackType.Blood),
      createHeroCombatant(hero2, AttackType.Melee),
    );

    expect(result).toMatchSnapshot();
  });
  it("should be symetrical", () => {
    const hero = levelUpHero(generateHero(), 1000, {
      strength: 0.3,
      dexterity: 0.2,
      luck: 0.3,
      willpower: 0.2,
    });
    const hero2 = levelUpHero(generateHero(), 1000, { constitution: 1 });

    function checkForSymmetry() {
      hero.combat.health = hero.combat.maxHealth;
      hero2.combat.health = hero2.combat.maxHealth;

      const result = calculateEnchantmentDamage(
        createHeroCombatant(hero, AttackType.Melee),
        createHeroCombatant(hero2, AttackType.Blood),
      );
      const result2 = calculateEnchantmentDamage(
        createHeroCombatant(hero2, AttackType.Blood),
        createHeroCombatant(hero, AttackType.Melee),
      );

      expect(result.attackerDamage).toEqual(result2.victimDamage);
    }

    hero2.equipment.rightHand = {
      level: 34,
      type: InventoryItemType.Shield,
      enchantment: EnchantmentType.SuperVampStats,
      id: "test-weapon",
      baseItem: "test-weapon",
      name: "test-weapon",
      owner: hero2.id,
    };

    checkForSymmetry();

    hero2.equipment.leftHand = {
      level: 34,
      type: InventoryItemType.Shield,
      enchantment: EnchantmentType.SuperVampStats,
      id: "test-weapon",
      baseItem: "test-weapon",
      name: "test-weapon",
      owner: hero2.id,
    };

    checkForSymmetry();

    hero2.inventory.push({
      level: 0,
      baseItem: "vampire-ring",
      type: InventoryItemType.Quest,
      id: "test-weapon",
      name: "test-weapon",
      owner: hero2.id,
    });
    hero2.inventory.push({
      level: 0,
      baseItem: "heros-guidance",
      type: InventoryItemType.Quest,
      id: "test-weapon",
      name: "test-weapon",
      owner: hero2.id,
    });

    checkForSymmetry();

    hero2.skills.regeneration = 20;
    hero2.skills.resilience = 20;
    hero.skills.regeneration = 20;
    hero.skills.resilience = 20;
    checkForSymmetry();
  });
});

describe("damage conversion", () => {
  it("should convert damage to lightning and fire", () => {
    const hero = generateHero();
    const hero2 = generateHero();

    // Give the hero some basic stats and equipment
    hero.equipment.leftHand = {
      id: "test-weapon",
      level: 10,
      type: InventoryItemType.MeleeWeapon,
      baseItem: "test-weapon",
      name: "test-weapon",
      owner: hero.id,
    };
    hero.stats.strength = 100; // Add some strength for melee damage

    // Add damage conversion stats to the hero's unit
    const heroCombatant = createHeroCombatant(hero, AttackType.Melee);

    heroCombatant.unit.applyModifier<
      GenericStatsModifier,
      GenericStatsModifierOptions
    >({
      type: GenericStatsModifier,
      enchantment: EnchantmentType.DiamondBlessing,
      options: {
        bonus: {
          damageAsLightning: 0.5,
          damageAsFire: 0.5,
        },
      },
    });

    const hero2Combatant = createHeroCombatant(hero2, AttackType.Melee);

    const result = calculateDamage(heroCombatant, hero2Combatant);

    console.log("Damage instances:", result.damages);
    console.log(
      "Damage types:",
      result.damages.map((d) => d.damageType),
    );

    // Should have 2 damage instances: Lightning and Fire (fully converted)
    expect(result.damages.length).toBe(2);

    // Find each damage type
    const fireDamage =
      result.damages.find((d) => d.damageType === DamageType.Fire)?.damage ?? 0;
    const lightningDamage =
      result.damages.find((d) => d.damageType === DamageType.Lightning)
        ?.damage ?? 0;

    // Both converted damages should be roughly equal since we're converting 50% to each
    expect(fireDamage).toBeGreaterThan(0);
    expect(lightningDamage).toBeGreaterThan(0);
    expect(Math.abs(fireDamage - lightningDamage)).toBeLessThan(10);
  });

  it("should do minimum 1 damage without conversion against high resistance", () => {
    const hero = generateHero();
    const hero2 = generateHero();

    // Give the hero minimal stats and no equipment
    hero.stats.strength = 1; // Minimal strength

    // Give the victim very high physical resistance
    const hero2Combatant = createHeroCombatant(hero2, AttackType.Melee);
    hero2Combatant.unit.applyModifier(GenericStatsModifier, {
      bonus: {
        physicalResistance: 0.99, // 99% physical resistance
      },
    });

    const result = calculateDamage(
      createHeroCombatant(hero, AttackType.Melee),
      hero2Combatant,
    );

    console.log("Damage instances:", result.damages);
    console.log(
      "Damage types:",
      result.damages.map((d) => d.damageType),
    );

    // Should have 1 damage instance of type Physical
    expect(result.damages.length).toBe(1);
    expect(result.damages[0].damageType).toBe(DamageType.Physical);
    expect(result.damages[0].damage).toBe(1);
  });
});
