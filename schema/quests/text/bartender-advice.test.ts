import { getBartenderAdvice } from "./bartender-advice";
import { Hero } from "types/graphql";
import { SpecialLocation, MAP_DIMENSIONS } from "../../../constants";
import { DAY_NIGHT_CYCLE } from "../../../constants/helpers";

// Every tavern that has a dedicated bartender persona.
const TAVERNS = [
  "The Hellhound's Fur",
  "The Hidden Stump Inn",
  "Steamgear Tap House",
  "The Drowning Fish",
  "Ancient Vault",
  "Wyverns Holm",
];

// The personas whose `night` rule was previously a `pick([])` stub. With an
// empty quest log these are the only rule that can fire at night, so the
// returned line must be one of the authored night options — this fails if the
// stub regresses (the normalizer would drop the undefined and the persona
// would silently fall back to daytime flavor instead).
const NIGHT_LINES: Record<string, string[]> = {
  "The Hellhound's Fur": [
    "Night already? The Hellhound stirs when the lamps burn low. Mind the shadows on your way out.",
    "You keep odd hours, friend — so do the things that hunt past dusk. Keep your blade where your hand can find it.",
  ],
  "The Hidden Stump Inn": [
    "Dark already? The roots drink deep at night. Step careful — the woods don't forgive a stumble after dusk.",
    "Owls are talking, which means something bigger's awake out there. Rest here till light if you've any sense.",
  ],
};

// Center of the map has a known timezone offset of 0, so `daytime` is simply
// the fraction of the day/night cycle elapsed at the mocked timestamp.
function makeHero(): Hero {
  return {
    location: {
      x: MAP_DIMENSIONS.WIDTH / 2,
      y: MAP_DIMENSIONS.HEIGHT / 2,
      map: "default",
    },
    // Empty quest log + no current quest so only ambient (e.g. night) rules
    // can fire — this isolates the persona's unconditional flavor lines.
    questLog: {},
    currentQuest: null,
  } as unknown as Hero;
}

function tavern(name: string): SpecialLocation {
  return { name, type: "tavern" } as unknown as SpecialLocation;
}

function expectAllNonEmpty(lines: string[]) {
  expect(lines.length).toBeGreaterThan(0);
  for (const line of lines) {
    expect(typeof line).toBe("string");
    expect(line.trim().length).toBeGreaterThan(0);
  }
}

describe("getBartenderAdvice", () => {
  let nowSpy: jest.SpyInstance | undefined;

  afterEach(() => {
    nowSpy?.mockRestore();
    nowSpy = undefined;
  });

  it("never returns empty or undefined advice lines at night", () => {
    // daytime === 0 => isNight() is true, triggering every persona's night rule.
    nowSpy = jest.spyOn(Date, "now").mockReturnValue(0);
    for (const name of TAVERNS) {
      expectAllNonEmpty(getBartenderAdvice(makeHero(), tavern(name)));
    }
  });

  it("never returns empty or undefined advice lines during the day", () => {
    // daytime === 0.5 => isNight() is false; personas fall back to daytime flavor.
    nowSpy = jest.spyOn(Date, "now").mockReturnValue(DAY_NIGHT_CYCLE / 2);
    for (const name of TAVERNS) {
      expectAllNonEmpty(getBartenderAdvice(makeHero(), tavern(name)));
    }
  });

  it("surfaces the authored night line for personas with a night rule", () => {
    // daytime === 0 => isNight() is true, so the night rule fires first.
    nowSpy = jest.spyOn(Date, "now").mockReturnValue(0);
    for (const [name, expected] of Object.entries(NIGHT_LINES)) {
      const lines = getBartenderAdvice(makeHero(), tavern(name));
      expect(lines.length).toBe(1);
      expect(expected).toContain(lines[0]);
    }
  });

  it("falls back to generic advice for an unknown tavern", () => {
    nowSpy = jest.spyOn(Date, "now").mockReturnValue(0);
    expectAllNonEmpty(getBartenderAdvice(makeHero(), tavern("Nowhere Special")));
  });
});
