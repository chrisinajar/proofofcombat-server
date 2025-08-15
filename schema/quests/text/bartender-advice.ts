import { Hero, Quest, QuestProgress } from "types/graphql";
import { SpecialLocation } from "../../../constants";
import { getQuestDescription } from "./quest-descriptions";

type AdviceContext = {
  hero: Hero;
  tavern: SpecialLocation;
};

type AdviceRule = {
  id: string;
  when: (ctx: AdviceContext) => boolean;
  lines: (ctx: AdviceContext) => string[] | string;
};

type BartenderPersona = {
  name: string; // for flavor only; not displayed unless included in lines
  tone: "gruff" | "warm" | "eccentric" | "hushed" | "industrial" | "rustic";
  rules: AdviceRule[];
  fallback: (ctx: AdviceContext) => string[];
};

function isValidQuestEntry(
  entry: QuestProgress | string | undefined | null,
): entry is QuestProgress {
  return (
    !!entry &&
    typeof entry === "object" &&
    (entry.started === undefined || typeof entry.started === "boolean") &&
    (entry.finished === undefined || typeof entry.finished === "boolean")
  );
}

function questProgress(hero: Hero, key: keyof Hero["questLog"]): number {
  if (!questStarted(hero, key)) {
    return -1;
  }
  const entry = hero.questLog[key];
  if (!isValidQuestEntry(entry)) {
    return -1;
  }
  return entry.progress;
}

function questStarted(hero: Hero, key: keyof Hero["questLog"]): boolean {
  const entry = hero.questLog[key];
  return isValidQuestEntry(entry) && !!entry.started && !entry.finished;
}

function questFinished(hero: Hero, key: keyof Hero["questLog"]): boolean {
  const entry = hero.questLog[key];
  return isValidQuestEntry(entry) && !!entry.finished;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const personas: Record<string, BartenderPersona> = {
  "The Hellhound's Fur": {
    name: "Trimarim",
    tone: "eccentric",
    rules: [
      {
        id: "washed-up",
        when: ({ hero }) =>
          questStarted(hero, "washedUp") && questProgress(hero, "washedUp") < 8,
        lines: ({ hero }) => [
          pick([
            "You look like you’ve been through a storm. Docks workers know which way the tide pulls strays.",
            "Salt still on your boots? Check the docks and listen for chatter about shipwrecks.",
          ]),
        ],
      },
      {
        id: "tavern-champion",
        when: ({ hero }) =>
          questStarted(hero, "tavernChampion") &&
          !questFinished(hero, "tavernChampion"),
        lines: () => [
          pick([
            "If you’re chasing trophies, our regulars whisper about a beast in the roots and another in the machinists’ quarter.",
            "Champion, hm? Try the hidden stump for a warmup, then Rotherham’s clang and steam for a real test.",
          ]),
        ],
      },
      {
        id: "crafting",
        when: ({ hero }) =>
          questStarted(hero, "clockwork") ||
          questStarted(hero, "nagaScale") ||
          questStarted(hero, "tasteForBusiness"),
        lines: () => [
          pick([
            "Gathering’s half the work. Keep your pack light and your eyes open — ingredients have a way of hiding in plain sight.",
            "Need parts or scales? Hunt where the locals talk about ‘strange gleam’ or ‘slick shapes under the pier’.",
          ]),
        ],
      },
      {
        id: "meet-the-queen",
        when: ({ hero }) => questStarted(hero, "meetTheQueen"),
        lines: () => [
          pick([
            "If you’re set on courtly halls, perform well where the Queen’s entourage lingers. They like a good story.",
            "Palace doors open easier for those with a reputation. Stir the city and you’ll find the path.",
          ]),
        ],
      },
    ],
    fallback: () => [
      pick([
        "A hint? Head where the sounds change — the world speaks before it shows.",
        "No map ink beats a good walk. Follow odd noises and stranger footprints.",
      ]),
    ],
  },
  "The Hidden Stump Inn": {
    name: "Rootkeeper Iri",
    tone: "rustic",
    rules: [
      {
        id: "hobgoblins",
        when: ({ hero }) =>
          questProgress(hero, "washedUp") >= 8 && !questStarted(hero, "droop"),
        lines: () => [
          pick([
            "That damn goblin is always stealing from my patrons. He keeps the Hobgoblins on payroll, if you kill enough of them you might get an idea where he's hiding out.",
            "Hobgoblins are a menace, but they’re not the sharpest. If you find their camp, they’ll probably have a stash of stolen goods.",
          ]),
        ],
      },
      {
        id: "droop",
        when: ({ hero }) =>
          questProgress(hero, "droop") >= 8 && !questFinished(hero, "droop"),
        lines: () => [
          pick([
            "He's not likely to move; if you keep an eye out for his poorly drawn maps, you might find him.",
            "If you find yourself running around in circles then he's surely near. Keep at it.",
          ]),
        ],
      },
      {
        id: "droop",
        when: ({ hero }) =>
          questStarted(hero, "droop") && !questFinished(hero, "droop"),
        lines: () => [
          pick([
            "A map eh? I wouldn't trust any map made by that goblin, but if you find him, he might lead you to his secret stash.",
            "He could be anywhere; I would try to find more maps to zero in on his location.",
          ]),
        ],
      },
      {
        id: "forest-hunt",
        when: ({ hero }) => questStarted(hero, "tavernChampion"),
        lines: () => [
          pick([
            "In these woods, loud things die quiet. Move light, strike quick.",
            "Keep to the roots — the strongest here don’t like open ground.",
          ]),
        ],
      },
    ],
    fallback: () => [
      pick([
        "Trail’s warm if you use your senses. Listen more than you look.",
        "Plenty pass through. The ones who return walk softly and think ahead.",
      ]),
    ],
  },
  "Steamgear Tap House": {
    name: "Foreman Brin",
    tone: "industrial",
    rules: [
      {
        id: "clockwork",
        when: ({ hero }) => questStarted(hero, "clockwork"),
        lines: () => [
          pick([
            "Gears jam where heat builds. Follow the hiss, you’ll find loose parts and mean tempers.",
            "Keep an eye for irregular ticks — broken machines gather broken men.",
          ]),
        ],
      },
      {
        id: "settlements",
        when: ({ hero }) => questStarted(hero, "settlements"),
        lines: () => [
          pick([
            "A city respects what you can maintain. Build links, not just walls.",
            "Governors rise by feeding many hands. Farms before flags, if you want my two coins.",
          ]),
        ],
      },
    ],
    fallback: () => [
      pick([
        "If it hisses or clanks, it’s worth a look.",
        "Work with the flow, not against it. Even brass knows its rhythm.",
      ]),
    ],
  },
  "The Drowning Fish": {
    name: "Old Mera",
    tone: "gruff",
    rules: [
      {
        id: "washed-up",
        when: ({ hero }) => questStarted(hero, "washedUp"),
        lines: () => [
          pick([
            "No sailor gets home arguing the tide. Ask at the docks and read the currents.",
            "If you swallowed the sea, spit it up at the piers. Folks there will point you right.",
          ]),
        ],
      },
      {
        id: "aqua",
        when: ({ hero }) =>
          questStarted(hero, "clockwork") || questStarted(hero, "nagaScale"),
        lines: () => [
          pick([
            "Scales and gears both wash ashore. Low tide’s a scavenger’s feast.",
            "Bring a net. The river keeps secrets and trinkets both.",
          ]),
        ],
      },
    ],
    fallback: () => [
      pick([
        "Keep your feet beneath you and your eyes on the waterline.",
        "You’ll learn more listening than talking in a port.",
      ]),
    ],
  },
  "Ancient Vault": {
    name: "Warden of Echoes",
    tone: "hushed",
    rules: [
      {
        id: "rebirth",
        when: ({ hero }) => hero.level >= hero.levelCap,
        lines: () => [
          pick([
            "When strength meets its ceiling, seek renewal. Old skins must be shed.",
            "Edges dull at the peak. Reforge yourself before you climb again.",
          ]),
        ],
      },
    ],
    fallback: () => [
      pick([
        "Quiet places answer loud questions.",
        "If you listen long enough, the stone will answer.",
      ]),
    ],
  },
  "Wyverns Holm": {
    name: "Keeper of Bones",
    tone: "hushed",
    rules: [
      {
        id: "naga",
        when: ({ hero }) => questStarted(hero, "nagaScale"),
        lines: () => [
          pick([
            "Old scales sleep beneath older stones. Unsettle neither unless you’re ready.",
            "The ruins bite back. Bring purpose, not just courage.",
          ]),
        ],
      },
    ],
    fallback: () => [
      pick([
        "Relics don’t like haste.",
        "Patience will uncover more than force here.",
      ]),
    ],
  },
};

const genericRules: AdviceRule[] = [
  {
    id: "current-quest",
    when: ({ hero }) => !!hero.currentQuest,
    lines: ({ hero }) => {
      const q = hero.currentQuest!.quest as Quest;
      const desc = getQuestDescription(q);
      return [
        pick([`If you’re on ${q}, remember: ${desc}`, `About ${q}: ${desc}`]),
      ];
    },
  },
];

export function getBartenderAdvice(
  hero: Hero,
  tavern: SpecialLocation,
): string[] {
  const persona = personas[tavern.name];
  const ctx: AdviceContext = { hero, tavern };

  const lines: string[] = [];

  // Persona-specific prioritized rules
  if (persona) {
    for (const rule of persona.rules) {
      try {
        if (rule.when(ctx)) {
          const l = rule.lines(ctx);
          if (Array.isArray(l)) lines.push(...l);
          else lines.push(l);
        }
      } catch {
        // ignore rule errors to avoid disrupting gameplay
      }
      if (lines.length >= 2) break; // keep it concise and conversational
    }

    if (lines.length < 2) {
      // add one generic nudge if available
      for (const rule of genericRules) {
        if (rule.when(ctx)) {
          const l = rule.lines(ctx);
          if (Array.isArray(l)) lines.push(...l);
          else lines.push(l);
          break;
        }
      }
    }

    if (lines.length === 0) {
      lines.push(...persona.fallback(ctx));
    }

    return lines.slice(0, 2);
  }

  // Unknown tavern: default generic advice
  for (const rule of genericRules) {
    if (rule.when(ctx)) {
      const l = rule.lines(ctx);
      if (Array.isArray(l)) lines.push(...l);
      else lines.push(l);
      break;
    }
  }

  if (lines.length === 0) {
    lines.push(
      pick([
        "Ask around, keep notes, and explore. Answers tend to hide near questions.",
        "Exploration pays best dividends. If the road is quiet, try the docks or the ruins.",
      ]),
    );
  }

  return lines.slice(0, 2);
}
