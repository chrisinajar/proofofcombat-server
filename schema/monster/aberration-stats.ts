import { AttackType, EnchantmentType, ArtifactAttributeType } from "types/graphql";

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

  "random-aberration-moving-mountain": {
    monster: {
      name: "Moving Mountain",
      id: "random-aberration-moving-mountain",
      attackType: AttackType.Melee,
      level: 33,
      combat: {
        maxHealth: 5000000000,
        health: 5000000000,
      },
    },
    equipment: {
      bodyArmor: { level: 45, enchantment: EnchantmentType.SuperCounterSpell },
      handArmor: { level: 45, enchantment: EnchantmentType.LifeHeal },
      legArmor: { level: 45, enchantment: EnchantmentType.LifeHeal },
      headArmor: { level: 45, enchantment: EnchantmentType.BonusArmor },
      footArmor: { level: 45, enchantment: EnchantmentType.BonusArmor },

      leftHand: { level: 34, enchantment: EnchantmentType.SuperWillpower },
      rightHand: { level: 34, enchantment: EnchantmentType.SuperMelee },
    },
  },

  "random-aberration-void-keeper": {
    monster: {
      name: "Void Keeper",
      id: "random-aberration-void-keeper",
      attackType: AttackType.Cast,
      level: 50,
      combat: {
        maxHealth: 1000000000,
        health: 1000000000,
      },
    },
    equipment: {
      bodyArmor: { level: 60, enchantment: EnchantmentType.SuperCounterSpell },
      handArmor: { level: 60, enchantment: EnchantmentType.SuperDexterity },
      legArmor: { level: 60, enchantment: EnchantmentType.SuperWisdom },
      headArmor: { level: 60, enchantment: EnchantmentType.Vampirism },
      footArmor: { level: 60 },

      leftHand: { level: 60 },
      rightHand: { level: 60 },
    },
  },

  "random-aberration-artificer": {
    monster: {
      name: "The Artificer",
      id: "random-aberration-artificer",
      attackType: AttackType.Cast,
      level: 33,
      combat: {
        maxHealth: 4000000000,
        health: 4000000000,
      },
    },
    equipment: {
      bodyArmor: { 
        level: 34,
        enchantment: EnchantmentType.SuperCounterSpell
      },
      handArmor: { 
        level: 34,
        enchantment: EnchantmentType.SuperCaster,
      },
      legArmor: { 
        level: 34,
        enchantment: EnchantmentType.SuperWisdom,
      },
      headArmor: {
        level: 34,
        enchantment: EnchantmentType.SuperCaster
      },
      footArmor: { 
        level: 34,
        enchantment: EnchantmentType.BonusArmor
      },
      leftHand: { 
        level: 45,
        enchantment: EnchantmentType.SuperCaster,
        imbue: {
          artifact: {
            id: "artificer-fire-tempest",
            name: "Fire Tempest",
            level: 40,
            attributes: {
              namePrefix: {
                type: ArtifactAttributeType.DamageAsLightning,
                magnitude: 0.5
              },
              namePostfix: {
                type: ArtifactAttributeType.DamageAsFire,
                magnitude: 0.5
              },
              bonusAffixes: []
            }
          }
        }
      },
      rightHand: { 
        level: 45,
        enchantment: EnchantmentType.SuperWillpower
      },
    },
  },
};
