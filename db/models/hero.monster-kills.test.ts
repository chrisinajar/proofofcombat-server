// Avoid circular import via schema/quests/rebirth -> db/index -> hero
jest.mock("../../schema/quests/rebirth", () => ({ startingLevelCap: 10 }));
// Mock the DB index to avoid circular instantiation of HeroModel via schema helpers
jest.mock("../../db/index", () => ({
  __esModule: true,
  default: {
    start: () => {},
    account: {},
    artifact: {},
    hero: {},
    monsterInstances: {},
    system: {},
    trades: {},
    playerLocation: {},
    graal: {},
  },
}));

import HeroModel from "./hero";
import { Hero } from "types/graphql";

describe("HeroModel monster kill helpers", () => {
  let model: HeroModel;

  beforeAll(() => {
    process.env.NODE_ENV = "test";
  });

  beforeEach(() => {
    model = new HeroModel();
  });

  function newHero(): Hero {
    // Use upgrade() to materialize defaults for a minimal hero record
    return model.upgrade({ id: "h1", name: "Tester" } as any);
  }

  test("upgrade initializes monsterKills to empty array", () => {
    const hero = newHero();
    expect(Array.isArray(hero.monsterKills)).toBe(true);
    expect(hero.monsterKills.length).toBe(0);
  });

  test("getMonsterKillEntry returns undefined when not present", () => {
    const hero = newHero();
    const entry = model.getMonsterKillEntry(hero, "goblin");
    expect(entry).toBeUndefined();
  });

  test("setMonsterKillCount upserts and overwrites kill counts", () => {
    let hero = newHero();
    hero = model.setMonsterKillCount(hero, "goblin", 3);
    let entry = model.getMonsterKillEntry(hero, "goblin");
    expect(entry).toBeDefined();
    expect(entry!.kills).toBe(3);
    expect(hero.monsterKills.length).toBe(1);

    hero = model.setMonsterKillCount(hero, "goblin", 5);
    entry = model.getMonsterKillEntry(hero, "goblin");
    expect(entry!.kills).toBe(5);
    expect(hero.monsterKills.length).toBe(1);
  });

  test("incrementMonsterKill increases counts from zero and existing", () => {
    let hero = newHero();
    hero = model.incrementMonsterKill(hero, "goblin");
    expect(model.getMonsterKillEntry(hero, "goblin")!.kills).toBe(1);

    hero = model.incrementMonsterKill(hero, "goblin");
    expect(model.getMonsterKillEntry(hero, "goblin")!.kills).toBe(2);

    hero = model.incrementMonsterKill(hero, "goblin", 3);
    expect(model.getMonsterKillEntry(hero, "goblin")!.kills).toBe(5);
  });
});
