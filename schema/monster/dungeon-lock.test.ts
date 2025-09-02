// Avoid circular import via schema/quests/rebirth -> db/index -> hero
jest.mock("../../schema/quests/rebirth", () => ({ startingLevelCap: 10 }));

// Mock the combat function to avoid deep dependencies
jest.mock("../../combat/fight-monster", () => ({
  fightMonster: jest.fn(async () => ({
    attackerCombatant: { attackSpeedRemainder: 0 },
    victimCombatant: { attackSpeedRemainder: 0 },
    attackerDamage: 0,
    attackerEnchantmentDamage: 0,
    attackerHeal: 0,
    victimDamage: 0,
    victimEnchantmentDamage: 0,
    victimHeal: 0,
    log: [],
    victimDied: false,
  })),
}));

import { UserInputError } from "apollo-server";
import resolvers from "./resolvers";
import type { BaseContext } from "../context";
import type { Hero, MonsterInstance, BaseAccount } from "types/graphql";

describe("Dungeon combat locking", () => {
  function makeHero(overrides: Partial<Hero> = {}): Hero {
    const base: any = {
      id: "h1",
      name: "Tester",
      version: 10,
      class: "Fighter",
      level: 1,
      levelCap: 10,
      experience: 0,
      needed: 1,
      gold: 0,
      enchantingDust: 0,
      location: { x: 0, y: 0, map: "domari" },
      attributePoints: 0,
      combat: { health: 10, maxHealth: 10 },
      stats: {
        strength: 5,
        dexterity: 5,
        constitution: 5,
        intelligence: 5,
        wisdom: 5,
        willpower: 5,
        luck: 5,
      },
      enchantments: [],
      inventory: [],
      equipment: { accessories: [] },
      currentQuest: null,
      questLog: { id: "h1" },
      combatStats: null,
      incomingTrades: [],
      outgoingTrades: [],
      settings: { minimumStats: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        willpower: 10,
        luck: 10,
      }, autoDust: -1 },
      skills: {
        attackingAccuracy: 0,
        castingAccuracy: 0,
        attackingDamage: 0,
        castingDamage: 0,
        vitality: 0,
        resilience: 0,
        regeneration: 0,
      },
      skillPercent: 0,
      activeSkill: "vitality",
      activeStance: "Normal",
      availableStances: ["Normal"],
      buffs: { blessing: null },
      pendingArtifact: null,
      attackSpeedRemainder: 0,
      availableAttacks: ["Melee"],
      monsterKills: [],
      dungeon: null,
    };
    return { ...base, ...overrides } as Hero;
  }

  function makeMonsterInstance(id: string, map = "domari"): MonsterInstance {
    return {
      id: "m1",
      monster: {
        id,
        name: id,
        level: 1,
        combat: { health: 5, maxHealth: 5 },
        terrain: "land",
      } as any,
      location: { x: 0, y: 0, map },
      lastActive: Date.now(),
      attackSpeedRemainder: 0,
    } as any;
  }

  test("rejects fighting non-allowed monster when in LockedOrder dungeon", async () => {
    const hero = makeHero({
      dungeon: {
        id: "d1" as any,
        remaining: ["goblin", "wolf"],
        selection: "LockedOrder" as any,
        index: 0,
      } as any,
    });
    const monster = makeMonsterInstance("wolf");
    const account: BaseAccount = { id: hero.id, name: hero.name } as BaseAccount;

    const ctx: BaseContext = {
      auth: { id: hero.id },
      client: null,
      db: {
        account: { get: async () => account },
        hero: {
          get: async () => hero,
          put: async () => hero,
          countEnchantments: () => 0,
          rollSkillsForAction: (_c: any, h: Hero) => h,
        },
        monsterInstances: {
          get: async () => monster,
          put: async () => monster,
          del: async () => undefined,
        },
        graal: { get: async () => ({}) as any, put: async () => undefined, createDefault: async () => ({}) as any },
      } as any,
      io: {
        sendNotification: () => undefined,
        sendLocalNotification: () => undefined,
      } as any,
    };

    await expect(
      resolvers.Mutation!.fight!(null as any, { monster: monster.id }, ctx)
    ).rejects.toBeInstanceOf(UserInputError);
  });
});

