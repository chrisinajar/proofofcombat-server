import { v4 as uuidv4 } from "uuid";

import {
  Hero,
  ArtifactItem,
  ArtifactAttribute,
  ArtifactAttributes,
  ArtifactAttributeType,
} from "types/graphql";
import DatabaseInterface from "../interface";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type PartialArtifactItem = ArtifactItem; // Optional<ArtifactItem, "banned" | "nextAllowedAction">;

export function getArtifactModifier(
  artifact: ArtifactItem,
  type: ArtifactAttributeType,
): ArtifactAttribute | undefined {
  const modifiers = modifiersForArtifact(artifact);
  const modifier = modifiers.find((mod) => mod.type === type);
  return modifier;
}

export function modifiersForArtifact(
  artifact: ArtifactItem,
): ArtifactAttribute[] {
  const artifactBuffs: ArtifactAttribute[] = [
    artifact.attributes.namePrefix,
    artifact.attributes.namePostfix,
    ...artifact.attributes.bonusAffixes,
  ];

  if (artifact.attributes.titlePrefix) {
    artifactBuffs.push(artifact.attributes.titlePrefix);
  }

  if (artifact.attributes.titlePostfix) {
    artifactBuffs.push(artifact.attributes.titlePostfix);
  }

  return artifactBuffs;
}

export default class ArtifactItemModel extends DatabaseInterface<ArtifactItem> {
  getArtifactModifier = getArtifactModifier;
  modifiersForArtifact = modifiersForArtifact;

  constructor() {
    super("artifact");
  }

  upgrade(data: PartialArtifactItem): ArtifactItem {
    return data as ArtifactItem;
  }

  artifactName(affixes: ArtifactAffix[]): string {
    if (affixes.length > 3) {
      return `${affixes[0].namePrefix}${affixes[1].namePostfix} of the ${affixes[2].titlePrefix} ${affixes[3].titlePostfix}`;
    } else if (affixes.length > 2) {
      return `${affixes[0].namePrefix}${affixes[1].namePostfix} of the ${affixes[2].titlePrefix}`;
    } else if (affixes.length > 1) {
      return `${affixes[0].namePrefix}${affixes[1].namePostfix}`;
    }
    return "";
  }

  rollArtifact(magicFind: number, owner: Hero): ArtifactItem {
    const baseLevel = Math.max(1, Math.floor(magicFind));

    let quality = 1;
    let affixCount = 2;

    if (Math.random() < 0.01 * Math.pow(1.095, magicFind)) {
      affixCount = 4;
      affixCount += Math.floor(Math.random() * 4);
      quality = 3;
    } else if (Math.random() < 0.05 * Math.pow(1.1, magicFind)) {
      affixCount = 3;
      affixCount += Math.floor(Math.random() * 3);
      quality = 2;
    }

    const affixTypesFound: { [x in ArtifactAttributeType]?: true } = {};
    const affixes: ArtifactAffix[] = [];

    for (let i = 0; i < 100 && affixes.length < affixCount; ++i) {
      const affixChoice =
        ArtifactAffixes[Math.floor(Math.random() * ArtifactAffixes.length)];
      if (
        affixTypesFound[affixChoice.attributeType] ||
        affixChoice.levelRequirement > baseLevel
      ) {
        continue;
      }
      affixes.push(affixChoice);
      affixTypesFound[affixChoice.attributeType] = true;
    }

    const artifactAttributes: ArtifactAttribute[] = affixes.map((affix) => ({
      type: affix.attributeType,
      magnitude:
        Math.round(
          (affix.magnitude[0] +
            Math.random() * (affix.magnitude[1] - affix.magnitude[0])) /
            affix.step,
        ) /
        (1 / affix.step),
    }));

    console.log(artifactAttributes);

    const namePrefix = artifactAttributes.shift();
    const namePostfix = artifactAttributes.shift();

    // failed to generate name? how?
    if (!namePrefix || !namePostfix) {
      throw new Error("Failed to generate artifact");
    }
    // should rare tier get a title postfix if it rolls enough affixes?
    const artifact: ArtifactItem = {
      id: uuidv4(),
      owner: owner.id,
      name: this.artifactName(affixes),
      level: baseLevel,
      attributes: {
        namePrefix,
        namePostfix,
        titlePrefix: artifactAttributes.shift(),
        titlePostfix: artifactAttributes.shift(),

        bonusAffixes: artifactAttributes,
      },
    };

    return artifact;
  }
}

/*
    # combat stats
    BonusStrength
    BonusDexterity
    BonusConstitution
    BonusIntelligence
    BonusWisdom
    BonusWillpower
    BonusLuck

    # normy stuff
    DamageReduction
    EnhancedDamage
    BonusHealth

    # global stuff that's hard to get
    ReducedDelay
    BonusExperience
    BonusSkillChance
    Lifesteal

    # stun / stun dodge
    Mesmerize
    Focus
*/
type ArtifactAffix = {
  namePrefix: string;
  namePostfix: string;
  titlePrefix: string;
  titlePostfix: string;
  levelRequirement: number;
  attributeType: ArtifactAttributeType;
  magnitude: [number, number];
  step: number;
};
// namename the title1 title2
// namename the title1
// namename
const ArtifactAffixes: ArtifactAffix[] = [
  {
    namePrefix: "Ogre",
    namePostfix: "ogre",
    titlePrefix: "Ogre",
    titlePostfix: "Wrestler",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.BonusStrength,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },
  {
    namePrefix: "Giant",
    namePostfix: "strength",
    titlePrefix: "Brute",
    titlePostfix: "Carrier",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusStrength,
    magnitude: [1.2, 1.4],
    step: 0.01,
  },
  {
    namePrefix: "Blade",
    namePostfix: "smasher",
    titlePrefix: "Strongest",
    titlePostfix: "Dominator",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusStrength,
    magnitude: [1.4, 1.8],
    step: 0.01,
  },

  {
    namePrefix: "Swift",
    namePostfix: "slash",
    titlePrefix: "Nimble",
    titlePostfix: "Escapist",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.BonusDexterity,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },
  {
    namePrefix: "Blink",
    namePostfix: "quiver",
    titlePrefix: "Unseen",
    titlePostfix: "Shadow",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusDexterity,
    magnitude: [1.2, 1.4],
    step: 0.01,
  },
  {
    namePrefix: "Viper",
    namePostfix: "viper",
    titlePrefix: "Shockwave",
    titlePostfix: "Blur",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusDexterity,
    magnitude: [1.4, 1.8],
    step: 0.01,
  },

  {
    namePrefix: "Whale",
    namePostfix: "skin",
    titlePrefix: "Blubber",
    titlePostfix: "Whale",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.BonusConstitution,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },
  {
    namePrefix: "Blood",
    namePostfix: "blood",
    titlePrefix: "Enchanted",
    titlePostfix: "Endurance",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusConstitution,
    magnitude: [1.2, 1.4],
    step: 0.01,
  },
  {
    namePrefix: "Vamp",
    namePostfix: "helm",
    titlePrefix: "Crimson",
    titlePostfix: "Nightmare",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusConstitution,
    magnitude: [1.4, 1.8],
    step: 0.01,
  },

  {
    namePrefix: "Scholars",
    namePostfix: "tome",
    titlePrefix: "Apprentice",
    titlePostfix: "Wand",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.BonusIntelligence,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },
  {
    namePrefix: "Elder",
    namePostfix: "wand",
    titlePrefix: "Glowing",
    titlePostfix: "Stone",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusIntelligence,
    magnitude: [1.2, 1.4],
    step: 0.01,
  },
  {
    namePrefix: "Arch",
    namePostfix: "magi",
    titlePrefix: "Learned",
    titlePostfix: "Orb",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusIntelligence,
    magnitude: [1.4, 1.8],
    step: 0.01,
  },

  {
    namePrefix: "Monk",
    namePostfix: "staff",
    titlePrefix: "Monk",
    titlePostfix: "Monk",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.BonusWisdom,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },
  {
    namePrefix: "Mind",
    namePostfix: "lesson",
    titlePrefix: "Mind",
    titlePostfix: "Mind",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusWisdom,
    magnitude: [1.2, 1.4],
    step: 0.01,
  },
  {
    namePrefix: "Spell",
    namePostfix: "focus",
    titlePrefix: "Invocation",
    titlePostfix: "Invocation",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusWisdom,
    magnitude: [1.4, 1.8],
    step: 0.01,
  },

  {
    namePrefix: "Bard",
    namePostfix: "song",
    titlePrefix: "Bard",
    titlePostfix: "Bard",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.BonusWillpower,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },
  {
    namePrefix: "Light",
    namePostfix: "scepter",
    titlePrefix: "Light",
    titlePostfix: "Light",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusWillpower,
    magnitude: [1.2, 1.4],
    step: 0.01,
  },
  {
    namePrefix: "God",
    namePostfix: "light",
    titlePrefix: "Holy",
    titlePostfix: "Spirit",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusWillpower,
    magnitude: [1.4, 1.8],
    step: 0.01,
  },

  {
    namePrefix: "Chance",
    namePostfix: "dice",
    titlePrefix: "Lucky",
    titlePostfix: "Luck",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.BonusLuck,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },
  {
    namePrefix: "Luck",
    namePostfix: "cog",
    titlePrefix: "Calculated",
    titlePostfix: "Gambler",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusLuck,
    magnitude: [1.2, 1.4],
    step: 0.01,
  },
  {
    namePrefix: "Assassin",
    namePostfix: "shiv",
    titlePrefix: "Horking",
    titlePostfix: "Singer",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusLuck,
    magnitude: [1.4, 1.8],
    step: 0.01,
  },

  // END STATS
  //
  // MID RANGE THINGS

  // DamageReduction
  {
    namePrefix: "Stone",
    namePostfix: "shield",
    titlePrefix: "Protected",
    titlePostfix: "Protector",
    levelRequirement: 5,
    attributeType: ArtifactAttributeType.DamageReduction,
    magnitude: [1.01, 1.1],
    step: 0.01,
  },
  {
    namePrefix: "Iron",
    namePostfix: "mantle",
    titlePrefix: "Ironclad",
    titlePostfix: "Shield",
    levelRequirement: 24,
    attributeType: ArtifactAttributeType.DamageReduction,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },

  // EnhancedDamage
  {
    namePrefix: "Fire",
    namePostfix: "crush",
    titlePrefix: "Angry",
    titlePostfix: "Anger",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.EnhancedDamage,
    magnitude: [1.01, 1.1],
    step: 0.01,
  },
  {
    namePrefix: "Inferno",
    namePostfix: "thrasher",
    titlePrefix: "Fierce",
    titlePostfix: "Ferocity",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.EnhancedDamage,
    magnitude: [1.11, 1.2],
    step: 0.01,
  },
  {
    namePrefix: "Hellfire",
    namePostfix: "slayer",
    titlePrefix: "Deadly",
    titlePostfix: "Death",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.EnhancedDamage,
    magnitude: [1.21, 1.3],
    step: 0.01,
  },

  // BonusHealth
  {
    namePrefix: "Health",
    namePostfix: "sentinal",
    titlePrefix: "Healthy",
    titlePostfix: "Health",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.BonusHealth,
    magnitude: [1.5, 2.5],
    step: 0.1,
  },
  {
    namePrefix: "Life",
    namePostfix: "guard",
    titlePrefix: "Living",
    titlePostfix: "Life",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusHealth,
    magnitude: [2.5, 3.5],
    step: 0.1,
  },
  {
    namePrefix: "Colossus",
    namePostfix: "vita",
    titlePrefix: "Colossus",
    titlePostfix: "Colossus",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusHealth,
    magnitude: [3.5, 5],
    step: 0.1,
  },

  // # global stuff that's hard to get
  // ReducedDelay
  {
    namePrefix: "Impatient",
    namePostfix: "stopwatch",
    titlePrefix: "Clockwerk",
    titlePostfix: "Cogg",
    levelRequirement: 10,
    attributeType: ArtifactAttributeType.ReducedDelay,
    magnitude: [1.01, 1.1],
    step: 0.01,
  },
  {
    namePrefix: "Restless",
    namePostfix: "hourglass",
    titlePrefix: "Mysterical",
    titlePostfix: "Gearbox",
    levelRequirement: 30,
    attributeType: ArtifactAttributeType.ReducedDelay,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },
  // BonusExperience
  {
    namePrefix: "Saavy",
    namePostfix: "guide",
    titlePrefix: "Expert",
    titlePostfix: "Expert",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.BonusExperience,
    magnitude: [1.01, 1.1],
    step: 0.01,
  },
  {
    namePrefix: "Hero",
    namePostfix: "plan",
    titlePrefix: "Heroic",
    titlePostfix: "Hero",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusExperience,
    magnitude: [1.1, 1.2],
    step: 0.01,
  },
  {
    namePrefix: "Master",
    namePostfix: "master",
    titlePrefix: "Veteran",
    titlePostfix: "Master",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusExperience,
    magnitude: [1.2, 1.3],
    step: 0.01,
  },

  // BonusSkillChance
  {
    namePrefix: "Skill",
    namePostfix: "gadget",
    titlePrefix: "Skilled",
    titlePostfix: "Learner",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.BonusSkillChance,
    magnitude: [1.1, 2],
    step: 0.1,
  },
  {
    namePrefix: "Talent",
    namePostfix: "skiller",
    titlePrefix: "Skillacious",
    titlePostfix: "Collector",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.BonusSkillChance,
    magnitude: [2, 3],
    step: 0.1,
  },
  {
    namePrefix: "Prodigious",
    namePostfix: "mind",
    titlePrefix: "Prodigious",
    titlePostfix: "Prodigy",
    levelRequirement: 50,
    attributeType: ArtifactAttributeType.BonusSkillChance,
    magnitude: [3, 4],
    step: 0.1,
  },

  // Lifesteal
  {
    namePrefix: "Leech",
    namePostfix: "leech",
    titlePrefix: "Leech",
    titlePostfix: "Leech",
    levelRequirement: 1,
    attributeType: ArtifactAttributeType.Lifesteal,
    magnitude: [1.01, 1.05],
    step: 0.01,
  },
  {
    namePrefix: "Lamprey",
    namePostfix: "vial",
    titlePrefix: "Lamprey",
    titlePostfix: "Lamprey",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.Lifesteal,
    magnitude: [1.06, 1.1],
    step: 0.01,
  },
  {
    namePrefix: "Satanic",
    namePostfix: "wraith",
    titlePrefix: "Satanic",
    titlePostfix: "Vampire",
    levelRequirement: 40,
    attributeType: ArtifactAttributeType.Lifesteal,
    magnitude: [1.11, 1.15],
    step: 0.01,
  },

  // # stun / stun dodge
  // Mesmerize
  {
    namePrefix: "Mesmer",
    namePostfix: "mesmer",
    titlePrefix: "Mesmerizing",
    titlePostfix: "Mesmer",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.Mesmerize,
    magnitude: [1.05, 1.2],
    step: 0.01,
  },
  // Focus
  {
    namePrefix: "Focus",
    namePostfix: "thought",
    titlePrefix: "Unbending",
    titlePostfix: "Focus",
    levelRequirement: 20,
    attributeType: ArtifactAttributeType.Focus,
    magnitude: [1.05, 1.2],
    step: 0.01,
  },
];
