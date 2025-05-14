import {
  CombatEntry,
  AttackType,
  HeroStats,
  InventoryItemType,
  EnchantmentType,
  HeroClasses,
  HeroSkills,
  ArtifactItem,
  InventoryItemImbue,
} from "types/graphql";

import type { Unit } from "../calculations/units/unit";

export type Attribute = keyof HeroStats;

export type Combatant = {
  level: number;
  name: string;
  attackType: AttackType;
  class: HeroClasses;
  equipment: CombatantGear;
  attributes: HeroStats;
  skills?: HeroSkills;
  damageReduction: number;
  health: number;
  maxHealth: number;
  luck: {
    smallModifier: number;
    largeModifier: number;
    ultraModifier: number;
  };
  unit: Unit;

  // attack speed
  attackSpeed: number;
  attackSpeedRemainder: number;
};

export type EnchantedCombatant = Combatant & {
  percentageDamageIncrease: number;
  percentageDamageReduction: number;
  percentageEnchantmentDamageReduction: number;
  enchanted: true;
  bonusAccuracy: number;
  bonusDodge: number;
  bonusWeaponTiers: number;
  bonusShieldTiers: number;
  bonusArmorTiers: number;
  lifesteal: number;
  // inverse for MATHS
  mesmerizeChance: number;
  focusChance: number;
};

export type AttackAttributes = {
  toHit: Attribute;
  damage: Attribute;
  dodge: Attribute;
  damageReduction: Attribute;
};

export type CombatResult = {
  attackerCombatant: Combatant;
  victimCombatant: Combatant;
  victimDamage: number;
  attackerDamage: number;
  victimEnchantmentDamage: number;
  attackerEnchantmentDamage: number;
  victimHeal: number;
  attackerHeal: number;

  victimDied: boolean;
  attackerDied: boolean;
  victimIsMesmerized: boolean;
  attackerIsMesmerized: boolean;
  victimIsDead: boolean;
  attackerIsDead: boolean;
  log: CombatEntry[];
};

export type CombatGear = {
  type?: InventoryItemType;
  level: number;
  baseItem?: string;
  enchantment?: EnchantmentType | null;
  imbue?: InventoryItemImbue | null;
};

export type QuestItem = {
  name: string;
  baseItem: string;
};

export type CombatantGear = {
  armor: CombatGear[];
  weapons: CombatGear[];
  quests: QuestItem[];
  artifact?: ArtifactItem;
};
