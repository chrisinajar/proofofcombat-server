# Bartender Advice

This document is generated from the bartender advice rules. ‘When’ predicates are stringified for readability, and ‘Lines’ list the possible variants found in source.

## Ancient Vault
Persona: Warden of Echoes — Tone: hushed

### Rules

#### rebirth

When:
```ts
({ hero }) => hero.level >= hero.levelCap
```

Lines:
- "Edges dull at the peak. Reforge yourself before you climb again."
- "When strength meets its ceiling, seek renewal. Old skins must be shed."

### Fallback Lines

- "If you listen long enough, the stone will answer."
- "Quiet places answer loud questions."

## Steamgear Tap House
Persona: Foreman Brin — Tone: industrial

### Rules

#### clockwork

When:
```ts
({ hero }) => questStarted(hero, "clockwork")
```

Lines:
- "Gears jam where heat builds. Follow the hiss, you’ll find loose parts and mean tempers."
- "Keep an eye for irregular ticks — broken machines gather broken men."

#### settlements

When:
```ts
({ hero }) => questStarted(hero, "settlements")
```

Lines:
- "A city respects what you can maintain. Build links, not just walls."
- "Governors rise by feeding many hands. Farms before flags, if you want my two coins."

### Fallback Lines

- "If it hisses or clanks, it’s worth a look."
- "Work with the flow, not against it. Even brass knows its rhythm."

## The Drowning Fish
Persona: Old Mera — Tone: gruff

### Rules

#### washed-up

When:
```ts
({ hero }) => questStarted(hero, "washedUp")
```

Lines:
- "If you swallowed the sea, spit it up at the piers. Folks there will point you right."
- "No sailor gets home arguing the tide. Ask at the docks and read the currents."

#### aqua

When:
```ts
({ hero }) =>
          questStarted(hero, "clockwork") || questStarted(hero, "nagaScale")
```

Lines:
- "Bring a net. The river keeps secrets and trinkets both."
- "Scales and gears both wash ashore. Low tide’s a scavenger’s feast."

### Fallback Lines

- "Keep your feet beneath you and your eyes on the waterline."
- "You’ll learn more listening than talking in a port."

## The Hellhound's Fur
Persona: Trimarim — Tone: eccentric

### Rules

#### washed-up

When:
```ts
({ hero }) =>
          questStarted(hero, "washedUp") && questProgress(hero, "washedUp") < 8
```

Lines:
- "Salt still on your boots? Check the docks and listen for chatter about shipwrecks."
- "You look like you’ve been through a storm. Docks workers know which way the tide pulls strays."

#### tavern-champion

When:
```ts
({ hero }) =>
          questStarted(hero, "tavernChampion") &&
          !questFinished(hero, "tavernChampion")
```

Lines:
- "Champion, hm? Try the hidden stump for a warmup, then Rotherham’s clang and steam for a real test."
- "If you’re chasing trophies, our regulars whisper about a beast in the roots and another in the machinists’ quarter."

#### crafting

When:
```ts
({ hero }) =>
          questStarted(hero, "clockwork") ||
          questStarted(hero, "nagaScale") ||
          questStarted(hero, "tasteForBusiness")
```

Lines:
- "Gathering’s half the work. Keep your pack light and your eyes open — ingredients have a way of hiding in plain sight."
- "Need parts or scales? Hunt where the locals talk about ‘strange gleam’ or ‘slick shapes under the pier’."

#### meet-the-queen

When:
```ts
({ hero }) => questStarted(hero, "meetTheQueen")
```

Lines:
- "If you’re set on courtly halls, perform well where the Queen’s entourage lingers. They like a good story."
- "Palace doors open easier for those with a reputation. Stir the city and you’ll find the path."

### Fallback Lines

- "A hint? Head where the sounds change — the world speaks before it shows."
- "No map ink beats a good walk. Follow odd noises and stranger footprints."

## The Hidden Stump Inn
Persona: Rootkeeper Iri — Tone: rustic

### Rules

#### hobgoblins

When:
```ts
({ hero }) =>
          questProgress(hero, "washedUp") >= 8 && !questStarted(hero, "droop")
```

Lines:
- "Hobgoblins are a menace, but they’re not the sharpest. If you find their camp, they’ll probably have a stash of stolen goods."
- "That damn goblin is always stealing from my patrons. He keeps the Hobgoblins on payroll, if you kill enough of them you might get an idea where he's hiding out."

#### droop

When:
```ts
({ hero }) =>
          questProgress(hero, "droop") >= 8 && !questFinished(hero, "droop")
```

Lines:
- "He's not likely to move; if you keep an eye out for his poorly drawn maps, you might find him."
- "If you find yourself running around in circles then he's surely near. Keep at it."

#### droop

When:
```ts
({ hero }) =>
          questStarted(hero, "droop") && !questFinished(hero, "droop")
```

Lines:
- "A map eh? I wouldn't trust any map made by that goblin, but if you find him, he might lead you to his secret stash."
- "He could be anywhere; I would try to find more maps to zero in on his location."

#### forest-hunt

When:
```ts
({ hero }) => questStarted(hero, "tavernChampion")
```

Lines:
- "In these woods, loud things die quiet. Move light, strike quick."
- "Keep to the roots — the strongest here don’t like open ground."

### Fallback Lines

- "Plenty pass through. The ones who return walk softly and think ahead."
- "Trail’s warm if you use your senses. Listen more than you look."

## Wyverns Holm
Persona: Keeper of Bones — Tone: hushed

### Rules

#### naga

When:
```ts
({ hero }) => questStarted(hero, "nagaScale")
```

Lines:
- "Old scales sleep beneath older stones. Unsettle neither unless you’re ready."
- "The ruins bite back. Bring purpose, not just courage."

### Fallback Lines

- "Patience will uncover more than force here."
- "Relics don’t like haste."

## Generic Rules

### current-quest

When:
```ts
({ hero }) => !!hero.currentQuest
```

Lines:
- `About ${q}: ${desc}`
- `If you’re on ${q}, remember: ${desc}`

