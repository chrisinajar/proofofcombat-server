import {
  ArtifactAttributes,
  ArtifactAttribute,
  ArtifactAttributeType,
} from "types/graphql";

import { Item, ItemOptions } from "./item";
import { GenericStatsModifier } from "../modifiers/generic-stats-modifier";

export type ArtifactItemOptions = ItemOptions & {
  attributes: ArtifactAttributes;
  enabledAffixes?: ArtifactAttributeType[];
};

export class ArtifactItem extends Item {
  options: ArtifactItemOptions;

  constructor(options: ArtifactItemOptions) {
    super(options);

    this.options = options;

    this.applyArtifactAttribute(options.attributes.namePrefix);
    this.applyArtifactAttribute(options.attributes.namePostfix);
    this.applyArtifactAttribute(options.attributes.titlePrefix);
    this.applyArtifactAttribute(options.attributes.titlePostfix);

    options.attributes.bonusAffixes.forEach((affix) => {
      this.applyArtifactAttribute(affix);
    });
  }

  applyArtifactAttribute(attribute?: ArtifactAttribute | null) {
    if (!attribute) {
      return;
    }

    if (
      this.options.enabledAffixes &&
      !this.options.enabledAffixes.includes(attribute.type)
    ) {
      return;
    }

    switch (attribute.type) {
      case ArtifactAttributeType.BonusStrength:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: { multiplier: { strength: attribute.magnitude } },
        });
        break;

      case ArtifactAttributeType.BonusDexterity:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: { multiplier: { dexterity: attribute.magnitude } },
        });
        break;

      case ArtifactAttributeType.BonusConstitution:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: { multiplier: { constitution: attribute.magnitude } },
        });
        break;

      case ArtifactAttributeType.BonusIntelligence:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: { multiplier: { intelligence: attribute.magnitude } },
        });
        break;

      case ArtifactAttributeType.BonusWisdom:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: { multiplier: { wisdom: attribute.magnitude } },
        });
        break;

      case ArtifactAttributeType.BonusWillpower:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: { multiplier: { willpower: attribute.magnitude } },
        });
        break;

      case ArtifactAttributeType.BonusLuck:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: { multiplier: { luck: attribute.magnitude } },
        });
        break;

      /*

  percentageDamageIncrease: number;
  percentageDamageReduction: number;
  percentageEnchantmentDamageReduction: number;
  bonusAccuracy: number;
  bonusDodge: number;
  bonusWeaponTiers: number;
  bonusShieldTiers: number;
  bonusArmorTiers: number;
  // inverse for MATHS
  mesmerizeChance: number;
  focusChance: number;
*/
      case ArtifactAttributeType.DamageReduction:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            multiplier: {
              percentageDamageReduction: attribute.magnitude,
              percentageEnchantmentDamageReduction: attribute.magnitude,
            },
          },
        });
        break;

      case ArtifactAttributeType.EnhancedDamage:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            multiplier: {
              percentageDamageIncrease: attribute.magnitude,
            },
          },
        });
        break;

      case ArtifactAttributeType.BonusHealth:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            multiplier: {
              health: attribute.magnitude,
            },
          },
        });
        break;

      case ArtifactAttributeType.ReducedDelay:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            multiplier: {
              // inverse scaling from 1 -> 0, 0% -> 100%
              // makes it "diminishing"
              reducedDelay: 2 - attribute.magnitude,
            },
          },
        });
        break;

      case ArtifactAttributeType.BonusExperience:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            multiplier: {
              bonusExperience: attribute.magnitude,
            },
          },
        });
        break;

      case ArtifactAttributeType.BonusSkillChance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            multiplier: {
              bonusSkillChance: attribute.magnitude,
            },
          },
        });
        break;

      case ArtifactAttributeType.Lifesteal:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              // what's happening here?
              // OH, it's "bonus"
              // stacks "additively"
              lifesteal:
                attribute.magnitude > 1
                  ? attribute.magnitude - 1
                  : attribute.magnitude,
            },
          },
        });
        break;

      case ArtifactAttributeType.Mesmerize:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            multiplier: {
              mesmerizeChance: 2 - attribute.magnitude,
            },
          },
        });
        break;

      case ArtifactAttributeType.Focus:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            multiplier: {
              focusChance: 2 - attribute.magnitude,
            },
          },
        });
        break;

      case ArtifactAttributeType.AllResistances:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              allResistances: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.DamageAsPhysical:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              damageAsPhysical: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.DamageAsMagical:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              damageAsMagical: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.DamageAsFire:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              damageAsFire: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.DamageAsIce:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              damageAsIce: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.DamageAsLightning:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              damageAsLightning: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.DamageAsHoly:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              damageAsHoly: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.DamageAsBlight:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              damageAsBlight: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.PhysicalResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              physicalResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.MagicalResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              magicalResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.FireResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              fireResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.IceResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              iceResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.LightningResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              lightningResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.HolyResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              holyResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.BlightResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              blightResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.BonusPhysicalDamage:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              bonusPhysicalDamage: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.BonusMagicalDamage:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              bonusMagicalDamage: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.BonusFireDamage:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              bonusFireDamage: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.BonusIceDamage:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              bonusIceDamage: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.BonusLightningDamage:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              bonusLightningDamage: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.BonusHolyDamage:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              bonusHolyDamage: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.BonusBlightDamage:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              bonusBlightDamage: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.EnemyPhysicalResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              enemyPhysicalResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.EnemyMagicalResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              enemyMagicalResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.EnemyFireResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              enemyFireResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.EnemyIceResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              enemyIceResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.EnemyLightningResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              enemyLightningResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.EnemyHolyResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              enemyHolyResistance: attribute.magnitude,
            },
          },
        });
        break;
      case ArtifactAttributeType.EnemyBlightResistance:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
              enemyBlightResistance: attribute.magnitude,
            },
          },
        });
        break;
    }
  }
}
