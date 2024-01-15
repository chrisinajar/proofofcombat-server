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
  options: O;
};
export function modifiersForEnchantment(
  enchantment: EnchantmentType,
): ModifierDefition<any, any>[] {
  const genericStats = genericStatsModifierForEnchantment(enchantment);

  if (genericStats) {
    return [genericStats];
  }
  return [];
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
  const genericStats = genericStatsAttackModifierForEnchantment(
    enchantment,
    attacker,
    victim,
  );

  const statStealModifiers = statStealAttackModifierForEnchantment(
    enchantment,
    attacker,
    victim,
  );

  return {
    attacker: statStealModifiers ? [statStealModifiers] : [],
    victim: genericStats ? [genericStats] : [],
  };
}

export function statStealAttackModifierForEnchantment(
  enchantment: EnchantmentType,
  attacker: Unit,
  victim: Unit,
): ModifierDefition<GenericStatsModifier, GenericStatsModifierOptions> | void {
  switch (enchantment) {
    case EnchantmentType.StrengthSteal:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            strength: 0.3,
          },
        },
      };
      break;
    case EnchantmentType.DexteritySteal:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            dexterity: 0.3,
          },
        },
      };
      break;
    case EnchantmentType.ConstitutionSteal:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            constitution: 0.3,
          },
        },
      };
      break;
    case EnchantmentType.IntelligenceSteal:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            intelligence: 0.3,
          },
        },
      };
      break;
    case EnchantmentType.WisdomSteal:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            wisdom: 0.3,
          },
        },
      };
      break;
    case EnchantmentType.WillpowerSteal:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            willpower: 0.3,
          },
        },
      };
      break;
    case EnchantmentType.LuckSteal:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            luck: 0.3,
          },
        },
      };
      break;
    case EnchantmentType.Vampirism:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            constitution: 0.3,
          },
        },
      };
      break;
    case EnchantmentType.AllStatsSteal:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            strength: 0.3,
            dexterity: 0.3,
            constitution: 0.3,
            intelligence: 0.3,
            wisdom: 0.3,
            willpower: 0.3,
            luck: 0.3,
          },
        },
      };
      break;

    case EnchantmentType.BigMelee:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            dexterity: 0.4,
          },
        },
      };
      break;
    case EnchantmentType.BigCaster:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            wisdom: 0.4,
          },
        },
      };
      break;
    case EnchantmentType.SuperVampStats:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            constitution: 0.8,
          },
        },
      };
      break;
    case EnchantmentType.SuperMeleeStats:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            dexterity: 0.8,
          },
        },
      };
      break;
    case EnchantmentType.SuperCasterStats:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            wisdom: 0.8,
          },
        },
      };
      break;
    case EnchantmentType.SuperVampMeleeStats:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            constitution: 0.6,
            dexterity: 0.6,
          },
        },
      };
      break;
    case EnchantmentType.SuperVampSorcStats:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            constitution: 0.6,
            wisdom: 0.6,
          },
        },
      };
      break;
    case EnchantmentType.SuperMeleeVampStats:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            constitution: 0.5,
            dexterity: 0.5,
          },
        },
      };
      break;
    case EnchantmentType.SuperSorcVampStats:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            constitution: 0.5,
            wisdom: 0.5,
          },
        },
      };
      break;
    case EnchantmentType.SuperBattleMageStats:
      return {
        type: GenericStatsModifier,
        options: {
          multiplier: {
            dexterity: 0.6,
            wisdom: 0.6,
          },
        },
      };
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
        options: {
          bonus: {
            weaponTier: 1,
          },
        },
      };
      break;
    case EnchantmentType.BonusArmorTier:
      return {
        type: GenericStatsModifier,
        options: {
          bonus: {
            armorTier: 1,
          },
        },
      };
      break;
    case EnchantmentType.BonusSmiteWeaponTier:
      return {
        type: GenericStatsModifier,
        options: {
          bonus: {
            shieldTiers: 1,
          },
        },
      };
      break;

    case EnchantmentType.BonusMeleeWeaponTier:
      return {
        type: GenericStatsModifier,
        options: {
          // if (attacker.attackType === AttackType.Melee) {
          // attacker.bonusWeaponTiers += 1;
          // }
        },
      };
      break;
    case EnchantmentType.BonusCasterWeaponTier:
      return {
        type: GenericStatsModifier,
        options: {
          // if (attacker.attackType === AttackType.Cast) {
          //   attacker.bonusWeaponTiers += 1;
          // }
        },
      };
      break;
    case EnchantmentType.BonusRangedWeaponTier:
      return {
        type: GenericStatsModifier,
        options: {
          // if (attacker.attackType === AttackType.Ranged) {
          //   attacker.bonusWeaponTiers += 1;
          // }
        },
      };
      break;
    // tier 4's
    case EnchantmentType.SuperDexterityStats:
      return {
        type: GenericStatsModifier,
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
        options: {},
      };
      break;
    case EnchantmentType.SuperMeleeStats:
      return {
        type: GenericStatsModifier,
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
        options: {
          multiplier: {
            intelligence: 2.5,
            strength: 2.5,
          },
        },
      };
      break;
  }
}
