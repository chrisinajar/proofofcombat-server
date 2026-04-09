import { Hero } from "types/graphql";
import { BaseContext } from "../context";
import { executeNpcTrade } from "./npc-shops";

const minimalHero = {
  inventory: [],
  questLog: {},
  buffs: {},
  enchantments: [],
  gold: 0,
  enchantingDust: 0,
  name: "TestHero",
  location: { map: "default" },
} as unknown as Hero;

const minimalContext = {} as unknown as BaseContext;

describe("executeNpcTrade fallback messages", () => {
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("includes tradeId in message for unknown prefix", async () => {
    const result = await executeNpcTrade(
      minimalContext,
      minimalHero,
      "bogus-trade-42",
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("bogus-trade-42");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("includes tradeId in message for unknown altar blessing", async () => {
    const result = await executeNpcTrade(
      minimalContext,
      minimalHero,
      "altar-blessing-unknown",
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("altar-blessing-unknown");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("includes tradeId in message for unknown transcendence trade", async () => {
    const result = await executeNpcTrade(
      minimalContext,
      minimalHero,
      "transcendence-unknown",
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("transcendence-unknown");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("includes tradeId in message for unknown amixea trade", async () => {
    const result = await executeNpcTrade(
      minimalContext,
      minimalHero,
      "amixea-unknown",
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("amixea-unknown");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("includes tradeId in message for unknown trimarim trade", async () => {
    const result = await executeNpcTrade(
      minimalContext,
      minimalHero,
      "trimarim-unknown",
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("trimarim-unknown");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("includes tradeId in message for unknown naxxremis trade", async () => {
    const result = await executeNpcTrade(
      minimalContext,
      minimalHero,
      "naxxremis-unknown",
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("naxxremis-unknown");
    expect(warnSpy).toHaveBeenCalled();
  });

  it("includes tradeId in message for unknown domari trade", async () => {
    const result = await executeNpcTrade(
      minimalContext,
      minimalHero,
      "domari-unknown",
    );
    expect(result.success).toBe(false);
    expect(result.message).toContain("domari-unknown");
    expect(warnSpy).toHaveBeenCalled();
  });
});
