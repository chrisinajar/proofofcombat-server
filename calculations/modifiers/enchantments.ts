import { EnchantmentType, AttackType } from "types/graphql";
import {
  GenericStatsModifier,
  GenericStatsModifierOptions,
} from "./generic-stats-modifier";
import { ModifierClass } from "./index";
import { Modifier } from "./modifier";
import {
  createStatStealModifiers,
  StatStealModifier,
  StatStealModifierOptions,
} from "./stat-steal-modifier";
import { Unit } from "../units/unit";
import { ParentModifier } from "./parent-modifier";
import { InventoryItem } from "../items/inventory-item";
import { EnchantmentCounterSpellOrder } from "../../combat/enchantment-order";
import { expandEnchantmentList } from "../../combat/enchantment-groups";

export type ModifierDefinition<T, O> = {
  type: ModifierClass<T, O>;
  enchantment?: EnchantmentType;
  options: O;
};
type AttackerModifierDefinition<T> = {
  attacker: ModifierDefinition<T, any>[];
  victim: ModifierDefinition<T, any>[];
};
export function modifiersForEnchantment(
  enchantment: EnchantmentType,
  attackType: AttackType,
): AttackerModifierDefinition<Modifier<any>> {
  const expandedModifiers = expandEnchantmentList([enchantment]);
  if (!expandedModifiers.length) {
    return { attacker: [], victim: [] };
  }
  if (expandedModifiers.length > 1) {
    // loop
    const result = expandedModifiers.reduce<
      AttackerModifierDefinition<Modifier<any>>
    >(
      (memo, e) => {
        const result = modifiersForEnchantment(e, attackType);
        memo.attacker = memo.attacker.concat(result.attacker);
        memo.victim = memo.victim.concat(result.victim);
        return memo;
      },
      { attacker: [], victim: [] },
    );
    return result;
  }
  enchantment = expandedModifiers[0];

  const genericStats = genericStatsModifierForEnchantment(
    enchantment,
    attackType,
  );
  const statStealModifiers = statStealAttackModifierForEnchantment(
    enchantment,
    attackType,
  );

  const attacker = [];
  const victim = [];

  if (genericStats) {
    attacker.push(genericStats);
  }
  if (statStealModifiers) {
    attacker.push(statStealModifiers);
  }

  const genericVictimStats = genericStatsAttackModifierForEnchantment(
    enchantment,
    attackType,
  );

  if (genericVictimStats) {
    victim.push(genericVictimStats);
  }

  return { attacker, victim };
}

type ModifierDefinitionList = ModifierDefinition<Modifier<any>, any>[];

export function applyAttackModifiers(attackerUnit: Unit, victimUnit: Unit) {
  victimUnit.modifiers.forEach((modifier) => {
    if (modifier instanceof ParentModifier) {
      if (modifier.id === "applyAttackModifiers") {
        modifier.remove();
      }
    }
  });
  const modifierList = attackerUnit.equipment.reduce<ModifierDefinitionList>(
    (memo, item) => {
      if (item instanceof InventoryItem) {
        if (item.victimModifiers && item.victimModifiers.length) {
          return memo.concat(item.victimModifiers);
        }
      }
      return memo;
    },
    [] as ModifierDefinitionList,
  );

  victimUnit.applyModifier({
    type: ParentModifier,
    options: {
      modifiers: modifierList,
      id: "applyAttackModifiers",
    },
  });
}

export function applyCounterSpells(attackerUnit: Unit, victimUnit: Unit) {
  const attackerCounters = attackerUnit.stats.counterSpell * 2;
  const victimCounters = victimUnit.stats.counterSpell * 2;
  // counter spells cancel each other out, so if they're equal (including both 0) we skip
  if (attackerCounters === victimCounters) {
    return;
  }

  const counterVictim =
    attackerCounters > victimCounters ? victimUnit : attackerUnit;
  const counterCount = Math.abs(attackerCounters - victimCounters);

  counterVictim.modifiers.forEach((modifier) => modifier.enable());

  let result = counterVictim.modifiers.filter(
    (modifier) =>
      !modifier.isDebuff() &&
      modifier.enchantment &&
      EnchantmentCounterSpellOrder.indexOf(modifier.enchantment) >= 0,
  );
  // nothin to counter
  if (result.length === 0) {
    return;
  }

  // if everything is going to be countered then short circuit
  if (result.length <= counterCount) {
    // console.log(
    //   counterVictim === victimUnit ? "victim" : "attacker",
    //   "is having all",
    //   result.length,
    //   "modifiers countered",
    //   { attackerCounters, victimCounters },
    // );
    result.forEach((modifier) => modifier.disable());
    return;
  }

  // console.log(
  //   counterVictim === victimUnit ? "victim" : "attacker",
  //   "is having ",
  //   counterCount,
  //   "of",
  //   result.length,
  //   "modifiers countered",
  //   { attackerCounters, victimCounters },
  // );
  result
    .sort(
      (a, b) =>
        EnchantmentCounterSpellOrder.indexOf(b.enchantment as EnchantmentType) -
        EnchantmentCounterSpellOrder.indexOf(a.enchantment as EnchantmentType),
    )
    .slice(0, counterCount)
    .forEach((modifier) => modifier.disable());
}

// enchantment switches //

export function statStealAttackModifierForEnchantment(
  enchantment: EnchantmentType,
  attackType: AttackType,
): ModifierDefinition<StatStealModifier, StatStealModifierOptions> | void {
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

export function genericStatsAttackModifierForEnchantment(
  enchantment: EnchantmentType,
  attackType: AttackType,
): ModifierDefinition<
  GenericStatsModifier,
  GenericStatsModifierOptions
> | void {
  switch (enchantment) {
    case EnchantmentType.MinusEnemyArmor:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.MinusEnemyArmor,
        options: {
          isDebuff: true,
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
          isDebuff: true,
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
          isDebuff: true,
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
          isDebuff: true,
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
          isDebuff: true,
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
          isDebuff: true,
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
          isDebuff: true,
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
          isDebuff: true,
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
          isDebuff: true,
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
          isDebuff: true,
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

    case EnchantmentType.SuperVampStats:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SuperVampStats,
        options: {
          isDebuff: true,
          multiplier: {
            percentageEnchantmentDamageReduction: 0.95,
          },
        },
      };
      break;

    case EnchantmentType.Vampirism:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.Vampirism,
        options: {
          isDebuff: true,
          multiplier: {
            percentageEnchantmentDamageReduction: 0.95,
          },
        },
      };
      break;

    case EnchantmentType.RangedArmorPiercing:
      if (attackType === AttackType.Ranged) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.RangedArmorPiercing,
          options: {
            isDebuff: true,
            multiplier: {
              percentageDamageReduction: 0.5,
            },
          },
        };
      }
      break;
    case EnchantmentType.MeleeArmorPiercing:
      if (attackType === AttackType.Melee) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.MeleeArmorPiercing,
          options: {
            isDebuff: true,
            multiplier: {
              percentageDamageReduction: 0.5,
            },
          },
        };
      }
      break;
    case EnchantmentType.CasterArmorPiercing:
      if (attackType === AttackType.Cast) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.CasterArmorPiercing,
          options: {
            isDebuff: true,
            multiplier: {
              percentageDamageReduction: 0.5,
            },
          },
        };
      }
      break;
    case EnchantmentType.SmiteArmorPiercing:
      if (attackType === AttackType.Smite) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.SmiteArmorPiercing,
          options: {
            isDebuff: true,
            multiplier: {
              percentageDamageReduction: 0.5,
            },
          },
        };
      }
      break;
    case EnchantmentType.VampireArmorPiercing:
      if (attackType === AttackType.Blood) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.VampireArmorPiercing,
          options: {
            isDebuff: true,
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
  attackType: AttackType,
): ModifierDefinition<
  GenericStatsModifier,
  GenericStatsModifierOptions
> | void {
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
        options: {
          bonus: {
            enchantmentLeech: 0.4,
          },
        },
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
    case EnchantmentType.BonusMeleeWeaponTier:
      if (attackType === AttackType.Melee) {
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
      if (attackType === AttackType.Cast) {
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
      if (attackType === AttackType.Ranged) {
        return {
          type: GenericStatsModifier,
          enchantment: EnchantmentType.BonusRangedWeaponTier,
          options: {
            bonus: { bonusWeaponTiers: 1 },
          },
        };
      }
      break;

    case EnchantmentType.LifeHeal:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.LifeHeal,
        options: {
          bonus: {
            enchantmentHeal: 0.1,
          },
        },
      };
      break;
    case EnchantmentType.LifeDamage:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.LifeDamage,
        options: {
          bonus: {
            enchantmentDamage: 0.1,
          },
        },
      };
      break;
    case EnchantmentType.LifeSteal:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.LifeSteal,
        options: {
          bonus: {
            enchantmentLeech: 0.1,
          },
        },
      };
      break;
    case EnchantmentType.Vampirism:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.Vampirism,
        options: {
          bonus: {
            enchantmentLeech: 0.2,
          },
        },
      };
      break;
    case EnchantmentType.TwentyLifeSteal:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.TwentyLifeSteal,
        options: {
          bonus: {
            enchantmentLeech: 0.2,
          },
        },
      };
      break;
    case EnchantmentType.ThirtyLifeSteal:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.ThirtyLifeSteal,
        options: {
          bonus: {
            enchantmentLeech: 0.3,
          },
        },
      };
      break;
    case EnchantmentType.CanOnlyTakeOneDamage:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.CanOnlyTakeOneDamage,
        options: {
          bonus: {
            canOnlyTakeOneDamage: 1,
          },
        },
      };
      break;
    case EnchantmentType.RangedSecondAttackChance:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.RangedSecondAttackChance,
        options: {
          multiplier: {
            rangedSecondAttackChance: 0.5,
          },
        },
      };
      break;

    case EnchantmentType.RubyBlessing:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.RubyBlessing,
        options: {
          bonus: {
            physicalResistance: 0.2,
            blightResistance: 0.2,
          },
        },
      };
      break;

    case EnchantmentType.EmeraldBlessing:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.EmeraldBlessing,
        options: {
          bonus: {
            magicalResistance: 0.2,
            holyResistance: 0.2,
          },
        },
      };
      break;

    case EnchantmentType.SapphireBlessing:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.SapphireBlessing,
        options: {
          bonus: {
            fireResistance: 0.2,
            iceResistance: 0.2,
            lightningResistance: 0.2,
          },
        },
      };
      break;

    case EnchantmentType.DiamondBlessing:
      return {
        type: GenericStatsModifier,
        enchantment: EnchantmentType.DiamondBlessing,
        options: {
          bonus: {
            physicalResistance: 0.1,
            magicalResistance: 0.1,
            fireResistance: 0.1,
            iceResistance: 0.1,
            lightningResistance: 0.1,
            holyResistance: 0.1,
            blightResistance: 0.1,
          },
        },
      };
      break;
  }
}
