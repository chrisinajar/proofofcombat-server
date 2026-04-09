import { Hero, Quest } from "types/graphql";

import { QUEST_LOG_FIELD, setQuestLogProgress } from "./helpers";

const allQuestValues = Object.values(Quest) as Quest[];

describe("QUEST_LOG_FIELD", () => {
  it("has an entry for every Quest enum value", () => {
    for (const q of allQuestValues) {
      expect(QUEST_LOG_FIELD).toHaveProperty(q);
    }
  });

  it("maps to valid QuestLog fields (no duplicates)", () => {
    const values = Object.values(QUEST_LOG_FIELD);
    expect(new Set(values).size).toBe(values.length);
  });

  it("is a bijection: Quest count equals mapped-field count", () => {
    expect(allQuestValues.length).toBe(Object.values(QUEST_LOG_FIELD).length);
    expect(allQuestValues.length).toBe(11);
  });
});

describe("setQuestLogProgress", () => {
  function makeHero(overrides: Partial<Hero> = {}): Hero {
    return {
      id: "test-hero",
      questLog: {} as Hero["questLog"],
      currentQuest: null,
      ...overrides,
    } as Hero;
  }

  it("writes to the correct QuestLog field for a straightforward mapping", () => {
    const hero = makeHero();
    const result = setQuestLogProgress(hero, Quest.WashedUp, 5);
    expect(result.questLog.washedUp).toBeDefined();
    expect(result.questLog.washedUp?.progress).toBe(5);
    expect(result.questLog.washedUp?.started).toBe(true);
  });

  it("writes to 'droop' for Quest.DroopsQuest (mismatched name)", () => {
    const hero = makeHero();
    const result = setQuestLogProgress(hero, Quest.DroopsQuest, 2);
    expect(result.questLog.droop).toBeDefined();
    expect(result.questLog.droop?.progress).toBe(2);
  });

  it("writes to 'clockwork' for Quest.MysteriousAutomation (mismatched name)", () => {
    const hero = makeHero();
    const result = setQuestLogProgress(hero, Quest.MysteriousAutomation, 1);
    expect(result.questLog.clockwork).toBeDefined();
    expect(result.questLog.clockwork?.progress).toBe(1);
  });

  it("writes to 'dailyPurification' for Quest.EssencePurification (mismatched name)", () => {
    const hero = makeHero();
    const result = setQuestLogProgress(hero, Quest.EssencePurification, 3);
    expect(result.questLog.dailyPurification).toBeDefined();
    expect(result.questLog.dailyPurification?.progress).toBe(3);
  });

  it("respects the finished flag", () => {
    const hero = makeHero();
    const result = setQuestLogProgress(hero, Quest.Rebirth, 10, true);
    expect(result.questLog.rebirth?.finished).toBe(true);
  });
});
