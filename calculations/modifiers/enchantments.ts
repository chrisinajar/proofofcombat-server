import { EnchantmentType, AttackType } from "types/graphql";
import {
  GenericStatsModifier,
  GenericStatsModifierOptions,
} from "./generic-stats-modifier";
import { ModifierClass } from "./index";
import {
  createStatStealModifiers,
  StatStealModifier,
  StatStealModifierOptions,
} from "./stat-steal-modifier";
import { Unit } from "../units/unit";

export type ModifierDefition<T, O> = {
  type: ModifierClass<T, O>;
  enchantment: EnchantmentType;
  options: O;
};
export function modifiersForEnchantment(
  enchantment: EnchantmentType,
): ModifierDefition<any, any>[] {
  const genericStats = genericStatsModifierForEnchantment(enchantment);
  const statStealModifiers = statStealAttackModifierForEnchantment(enchantment);

  const result = [];

  if (genericStats) {
    result.push(genericStats);
  }
  if (statStealModifiers) {
    result.push(statStealModifiers);
  }

  return result;
}
type AttackerModifierDefinition<T> = {
  attacker: ModifierDefition<T, any>[];
  victim: ModifierDefition<T, any>[];
};
export function attackModifiersForEnchantment(
  enchantment: EnchantmentType,
  attacker: Unit,
  victim: Unit,
): AttackerModifierDefinition<any> {
  const genericVictimStats = genericStatsAttackModifierForEnchantment(
    enchantment,
    attacker,
    victim,
  );
  const genericAttackerStats = attackerAttackModifierForEnchantment(
    enchantment,
    attacker,
    victim,
  );

  return {
    attacker: genericAttackerStats ? [genericAttackerStats] : [],
    victim: genericVictimStats ? [genericVictimStats] : [],
  };
}

export function statStealAttackModifierForEnchantment(
  enchantment: EnchantmentType,
): ModifierDefition<StatStealModifier, StatStealModifierOptions> | void {
  switch (enchantment) {
    case EnchantmentType.StrengthSteal:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.StrengthSteal,
        options: {
          strength: 0.3,
        },
      };
      break;
    case EnchantmentType.DexteritySteal:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.DexteritySteal,
        options: {
          dexterity: 0.3,
        },
      };
      break;
    case EnchantmentType.ConstitutionSteal:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.ConstitutionSteal,
        options: {
          constitution: 0.3,
        },
      };
      break;
    case EnchantmentType.IntelligenceSteal:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.IntelligenceSteal,
        options: {
          intelligence: 0.3,
        },
      };
      break;
    case EnchantmentType.WisdomSteal:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.WisdomSteal,
        options: {
          wisdom: 0.3,
        },
      };
      break;
    case EnchantmentType.WillpowerSteal:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.WillpowerSteal,
        options: {
          willpower: 0.3,
        },
      };
      break;
    case EnchantmentType.LuckSteal:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.LuckSteal,
        options: {
          luck: 0.3,
        },
      };
      break;
    case EnchantmentType.Vampirism:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.Vampirism,
        options: {
          constitution: 0.3,
        },
      };
      break;
    case EnchantmentType.AllStatsSteal:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.AllStatsSteal,
        options: {
          strength: 0.3,
          dexterity: 0.3,
          constitution: 0.3,
          intelligence: 0.3,
          wisdom: 0.3,
          willpower: 0.3,
          luck: 0.3,
        },
      };
      break;

    case EnchantmentType.BigMelee:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.BigMelee,
        options: {
          dexterity: 0.4,
        },
      };
      break;
    case EnchantmentType.BigCaster:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.BigCaster,
        options: {
          wisdom: 0.4,
        },
      };
      break;
    case EnchantmentType.SuperVampStats:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.SuperVampStats,
        options: {
          constitution: 0.8,
        },
      };
      break;
    case EnchantmentType.SuperMeleeStats:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.SuperMeleeStats,
        options: {
          dexterity: 0.8,
        },
      };
      break;
    case EnchantmentType.SuperCasterStats:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.SuperCasterStats,
        options: {
          wisdom: 0.8,
        },
      };
      break;
    case EnchantmentType.SuperVampMeleeStats:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.SuperVampMeleeStats,
        options: {
          constitution: 0.6,
          dexterity: 0.6,
        },
      };
      break;
    case EnchantmentType.SuperVampSorcStats:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.SuperVampSorcStats,
        options: {
          constitution: 0.6,
          wisdom: 0.6,
        },
      };
      break;
    case EnchantmentType.SuperMeleeVampStats:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.SuperMeleeVampStats,
        options: {
          constitution: 0.5,
          dexterity: 0.5,
        },
      };
      break;
    case EnchantmentType.SuperSorcVampStats:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.SuperSorcVampStats,
        options: {
          constitution: 0.5,
          wisdom: 0.5,
        },
      };
      break;
    case EnchantmentType.SuperBattleMageStats:
      return {
        type: StatStealModifier,
        enchantment: EnchantmentType.SuperBattleMageStats,
        options: {
          dexterity: 0.6,
          wisdom: 0.6,
        },
      };
      break;
  }
}

export function attackerAttackModifierForEnchantment(
  enchantment: EnchantmentType,
  attacker: Unit,
  victim: Unit,
): ModifierDefition<GenericStatsModifier, GenericStatsModifierOptions> | void {
  switch (enchantment) {
    case EnchantmentType.BonusMeleeWeaponTier:
      if (attacker.attackType === AttackType.Melee) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.BonusMeleeWeaponTier,
          options: {
            bonus: { bonusWeaponTiers: 1 },
          },
        };
      }
      break;
    case EnchantmentType.BonusCasterWeaponTier:
      if (attacker.attackType === AttackType.Cast) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.BonusCasterWeaponTier,
          options: {
            bonus: { bonusWeaponTiers: 1 },
          },
        };
      }
      break;
    case EnchantmentType.BonusRangedWeaponTier:
      if (attacker.attackType === AttackType.Ranged) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.BonusRangedWeaponTier,
          options: {
            bonus: { bonusWeaponTiers: 1 },
          },
        };
      }
      break;
  }
}

export function genericStatsAttackModifierForEnchantment(
  enchantment: EnchantmentType,
  attacker: Unit,
  victim: Unit,
): ModifierDefition<GenericStatsModifier, GenericStatsModifierOptions> | void {
  switch (enchantment) {
    case EnchantmentType.MinusEnemyArmor:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyArmor,
        options: {
          multiplier: {
            percentageDamageReduction: 0.5,
          },
        },
      };
      break;

    case EnchantmentType.MinusEnemyStrength:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyStrength,
        options: {
          multiplier: {
            strength: 0.8,
          },
        },
      };
      break;

    case EnchantmentType.MinusEnemyDexterity:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyDexterity,
        options: {
          multiplier: {
            dexterity: 0.8,
          },
        },
      };
      break;

    case EnchantmentType.MinusEnemyConstitution:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyConstitution,
        options: {
          multiplier: {
            constitution: 0.8,
          },
        },
      };
      break;

    case EnchantmentType.MinusEnemyIntelligence:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyIntelligence,
        options: {
          multiplier: {
            intelligence: 0.8,
          },
        },
      };
      break;

    case EnchantmentType.MinusEnemyWisdom:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyWisdom,
        options: {
          multiplier: {
            wisdom: 0.8,
          },
        },
      };
      break;

    case EnchantmentType.MinusEnemyWillpower:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyWillpower,
        options: {
          multiplier: {
            willpower: 0.8,
          },
        },
      };
      break;
    case EnchantmentType.MinusEnemyPhysical:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyPhysical,
        options: {
          multiplier: {
            strength: 0.9,
            dexterity: 0.9,
            constitution: 0.9,
          },
        },
      };
      break;
    case EnchantmentType.MinusEnemyMental:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyMental,
        options: {
          multiplier: {
            intelligence: 0.9,
            wisdom: 0.9,
            willpower: 0.9,
          },
        },
      };
      break;
    case EnchantmentType.MinusEnemyAllStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyAllStats,
        options: {
          multiplier: {
            strength: 0.9,
            dexterity: 0.9,
            constitution: 0.9,
            intelligence: 0.9,
            wisdom: 0.9,
            willpower: 0.9,
          },
        },
      };
      break;

    case EnchantmentType.Vampirism:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.Vampirism,
        options: {
          multiplier: {
            percentageEnchantmentDamageReduction: 0.95,
          },
        },
      };
      break;

    case EnchantmentType.RangedArmorPiercing:
      if (attacker.attackType === AttackType.Ranged) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.RangedArmorPiercing,
          options: {
            multiplier: {
              percentageDamageReduction: 0.5,
            },
          },
        };
      }
      break;
    case EnchantmentType.MeleeArmorPiercing:
      if (attacker.attackType === AttackType.Melee) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.MeleeArmorPiercing,
          options: {
            multiplier: {
              percentageDamageReduction: 0.5,
            },
          },
        };
      }
      break;
    case EnchantmentType.CasterArmorPiercing:
      if (attacker.attackType === AttackType.Cast) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.CasterArmorPiercing,
          options: {
            multiplier: {
              percentageDamageReduction: 0.5,
            },
          },
        };
      }
      break;
    case EnchantmentType.SmiteArmorPiercing:
      if (attacker.attackType === AttackType.Smite) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.SmiteArmorPiercing,
          options: {
            multiplier: {
              percentageDamageReduction: 0.5,
            },
          },
        };
      }
      break;
    case EnchantmentType.VampireArmorPiercing:
      if (attacker.attackType === AttackType.Blood) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.VampireArmorPiercing,
          options: {
            multiplier: {
              percentageEnchantmentDamageReduction: 0.5,
            },
          },
        };
      }
      break;
  }
}

export function genericStatsModifierForEnchantment(
  enchantment: EnchantmentType,
): ModifierDefition<GenericStatsModifier, GenericStatsModifierOptions> | void {
  switch (enchantment) {
    case EnchantmentType.BonusStrength:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusStrength,
        options: {
          multiplier: {
            strength: 1.3,
          },
        },
      };
      break;
    case EnchantmentType.BonusDexterity:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusDexterity,
        options: {
          multiplier: {
            dexterity: 1.3,
          },
        },
      };
      break;
    case EnchantmentType.BonusConstitution:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusConstitution,
        options: {
          multiplier: {
            constitution: 1.3,
          },
        },
      };
      break;
    case EnchantmentType.BonusIntelligence:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusIntelligence,
        options: {
          multiplier: {
            intelligence: 1.3,
          },
        },
      };
      break;
    case EnchantmentType.BonusWisdom:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusWisdom,
        options: {
          multiplier: {
            wisdom: 1.3,
          },
        },
      };
      break;
    case EnchantmentType.BonusWillpower:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusWillpower,
        options: {
          multiplier: {
            willpower: 1.3,
          },
        },
      };
      break;
    case EnchantmentType.BonusLuck:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusLuck,
        options: {
          multiplier: {
            luck: 1.3,
          },
        },
      };
      break;
    case EnchantmentType.BonusPhysical:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusPhysical,
        options: {
          multiplier: {
            strength: 1.2,
            dexterity: 1.2,
            constitution: 1.2,
          },
        },
      };
      break;
    case EnchantmentType.BonusMental:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusMental,
        options: {
          multiplier: {
            intelligence: 1.2,
            wisdom: 1.2,
            willpower: 1.2,
          },
        },
      };
      break;
    case EnchantmentType.BonusAllStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusAllStats,
        options: {
          multiplier: {
            strength: 1.2,
            dexterity: 1.2,
            constitution: 1.2,
            intelligence: 1.2,
            wisdom: 1.2,
            willpower: 1.2,
          },
        },
      };
      break;

    case EnchantmentType.BonusArmor:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusArmor,
        options: {
          multiplier: {
            percentageDamageReduction: 2,
          },
        },
      };
      break;
    case EnchantmentType.BigMelee:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BigMelee,
        options: {
          multiplier: {
            strength: 2,
          },
        },
      };
      break;
    case EnchantmentType.BigCaster:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BigCaster,
        options: {
          multiplier: {
            intelligence: 2,
          },
        },
      };
      break;
    case EnchantmentType.WisDexWill:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.WisDexWill,
        options: {
          multiplier: {
            wisdom: 1.4,
            dexterity: 1.4,
            willpower: 1.4,
          },
        },
      };
      break;
    case EnchantmentType.Mesmerize:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.Mesmerize,
        options: {
          multiplier: {
            mesmerizeChance: 0.5,
          },
        },
      };
      break;
    case EnchantmentType.Focus:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.Focus,
        options: {
          multiplier: {
            focusChance: 0.5,
          },
        },
      };
      break;

    // quest rewards
    case EnchantmentType.FishermansStrength:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.FishermansStrength,
        options: {
          multiplier: {
            strength: 1.5,
          },
        },
      };
      break;
    case EnchantmentType.FishermansDexterity:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.FishermansDexterity,
        options: {
          multiplier: {
            dexterity: 1.5,
          },
        },
      };
      break;
    case EnchantmentType.FishermansConstitution:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.FishermansConstitution,
        options: {
          multiplier: {
            constitution: 1.5,
          },
        },
      };
      break;
    case EnchantmentType.FishermansIntelligence:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.FishermansIntelligence,
        options: {
          multiplier: {
            intelligence: 1.5,
          },
        },
      };
      break;
    case EnchantmentType.FishermansWisdom:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.FishermansWisdom,
        options: {
          multiplier: {
            wisdom: 1.5,
          },
        },
      };
      break;
    case EnchantmentType.FishermansWillpower:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.FishermansWillpower,
        options: {
          multiplier: {
            willpower: 1.5,
          },
        },
      };
      break;
    case EnchantmentType.FishermansLuck:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.FishermansLuck,
        options: {
          multiplier: {
            luck: 1.5,
          },
        },
      };
      break;

    case EnchantmentType.DoubleAccuracy:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.DoubleAccuracy,
        options: {
          multiplier: {
            bonusAccuracy: 2,
          },
        },
      };
      break;
    case EnchantmentType.DoubleDodge:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.DoubleDodge,
        options: {
          multiplier: {
            bonusDodge: 2,
          },
        },
      };
      break;
    case EnchantmentType.DoubleAllStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.DoubleAllStats,
        options: {
          multiplier: {
            strength: 2,
            dexterity: 2,
            constitution: 2,
            intelligence: 2,
            wisdom: 2,
            willpower: 2,
            luck: 2,
          },
        },
      };
      break;
    case EnchantmentType.BonusWeaponTier:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusWeaponTier,
        options: {
          bonus: {
            bonusWeaponTiers: 1,
          },
        },
      };
      break;
    case EnchantmentType.BonusArmorTier:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusArmorTier,
        options: {
          bonus: {
            bonusArmorTiers: 1,
          },
        },
      };
      break;
    case EnchantmentType.BonusSmiteWeaponTier:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.BonusSmiteWeaponTier,
        options: {
          bonus: {
            bonusShieldTiers: 1,
          },
        },
      };
      break;
    // tier 4's
    case EnchantmentType.SuperDexterityStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperDexterityStats,
        options: {
          multiplier: {
            dexterity: 3,
            willpower: 1.5,
            wisdom: 1.5,
          },
        },
      };
      break;
    case EnchantmentType.SuperWillpowerStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperWillpowerStats,
        options: {
          multiplier: {
            dexterity: 1.5,
            willpower: 3,
            wisdom: 1.5,
          },
        },
      };
      break;
    case EnchantmentType.SuperWisdomStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperWisdomStats,
        options: {
          multiplier: {
            dexterity: 1.5,
            willpower: 1.5,
            wisdom: 3,
          },
        },
      };
      break;
    case EnchantmentType.SuperVampStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperVampStats,
        options: {},
      };
      break;
    case EnchantmentType.SuperMeleeStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperMeleeStats,
        options: {
          multiplier: {
            strength: 3.5,
          },
        },
      };
      break;
    case EnchantmentType.SuperCasterStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperCasterStats,
        options: {
          multiplier: {
            intelligence: 3.5,
          },
        },
      };
      break;
    case EnchantmentType.SuperVampMeleeStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperVampMeleeStats,
        options: {
          multiplier: {
            strength: 2.5,
          },
        },
      };
      break;
    case EnchantmentType.SuperVampSorcStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperVampSorcStats,
        options: {
          multiplier: {
            intelligence: 2.5,
          },
        },
      };
      break;
    case EnchantmentType.SuperMeleeVampStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperMeleeVampStats,
        options: {
          multiplier: {
            strength: 3,
          },
        },
      };
      break;
    case EnchantmentType.SuperSorcVampStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperSorcVampStats,
        options: {
          multiplier: {
            intelligence: 3,
          },
        },
      };
      break;
    case EnchantmentType.SuperBattleMageStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperBattleMageStats,
        options: {
          multiplier: {
            intelligence: 2.5,
            strength: 2.5,
          },
        },
      };
      break;
    case EnchantmentType.CounterSpell:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.CounterSpell,
        options: {
          bonus: {
            counterSpell: 1,
          },
        },
      };
      break;
  }
}
