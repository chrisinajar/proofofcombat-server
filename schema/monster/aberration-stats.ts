import { AttackType, EnchantmentType } from "types/graphql";

export const AberrationStats = {
  "domari-aberration-1": {
    monster: {
      name: "Burnt Harlequin",
      id: "domari-aberration-1",
      attackType: AttackType.Melee,
      level: 31,
      combat: {
        maxHealth: 25000000,
        health: 25000000,
      },
    },
    equipment: {
      bodyArmor: { level: 32 },
      handArmor: { level: 32 },
      legArmor: { level: 32 },
      headArmor: { level: 32 },
      footArmor: { level: 32 },

      leftHand: { level: 32 },
      rightHand: { level: 32 },
    },
  },

  "random-aberration-unholy-paladin": {
    monster: {
      name: "The Unholy Paladin",
      id: "random-aberration-unholy-paladin",
      attackType: AttackType.Smite,
      level: 8,
      combat: {
        maxHealth: 250,
        health: 250,
      },
    },
    equipment: {
      bodyArmor: {
        level: 32,
        enchantment: EnchantmentType.CanOnlyTakeOneDamage,
      },
      handArmor: {
        level: 32,
        enchantment: EnchantmentType.MinusEnemyDexterity,
      },
      legArmor: { level: 32, enchantment: EnchantmentType.MinusEnemyWisdom },
      headArmor: { level: 32, enchantment: EnchantmentType.MinusEnemyWisdom },
      footArmor: {
        level: 32,
        enchantment: EnchantmentType.MinusEnemyDexterity,
      },

      leftHand: { level: 32 },
      rightHand: { level: 32 },
    },
  },

  "random-aberration-thornbrute": {
    monster: {
      name: "Thornbrute",
      id: "random-aberration-thornbrute",
      attackType: AttackType.Cast,
      level: 35,
      combat: {
        maxHealth: 1000000000,
        health: 1000000000,
      },
    },
    equipment: {
      bodyArmor: {
        level: 33,
        enchantment: EnchantmentType.MinusEnemyAllStats,
      },
      handArmor: {
        level: 33,
        enchantment: EnchantmentType.MinusEnemyAllStats,
      },
      legArmor: { level: 33, enchantment: EnchantmentType.Vampirism },
      headArmor: { level: 33 },
      footArmor: { level: 33 },

      leftHand: { level: 33 },
      rightHand: { level: 33 },
    },
  },

  // "random-aberration-armored": {
  //   monster: {
  //     name: "Armor Guy",
  //     id: "random-aberration-armored",
  //     attackType: AttackType.Smite,
  //     level: 40,
  //     combat: {
  //       maxHealth: 1000000000,
  //       health: 1000000000,
  //     },
  //   },
  //   equipment: {
  //     bodyArmor: {
  //       level: 60,
  //       enchantment: EnchantmentType.MinusEnemyAllStats,
  //     },
  //     handArmor: {
  //       level: 60,
  //       enchantment: EnchantmentType.MinusEnemyAllStats,
  //     },
  //     legArmor: { level: 60, enchantment: EnchantmentType.Vampirism },
  //     headArmor: { level: 60 },
  //     footArmor: { level: 60 },

  //     leftHand: { level: 60 },
  //     rightHand: { level: 60 },
  //   },
  // },
};
