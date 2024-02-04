import {
  ArtifactAttributes,
  ArtifactAttribute,
  ArtifactAttributeType,
} from "types/graphql";

import { Item, ItemOptions } from "./item";
import { GenericStatsModifier } from "../modifiers/generic-stats-modifier";

export type ArtifactItemOptions = ItemOptions & {
  attributes: ArtifactAttributes;
};

export class ArtifactItem extends Item {
  constructor(options: ArtifactItemOptions) {
    super(options);

    this.applyArtifactAttribute(options.attributes.namePrefix);
    this.applyArtifactAttribute(options.attributes.namePostfix);
    this.applyArtifactAttribute(options.attributes.titlePrefix);
    this.applyArtifactAttribute(options.attributes.titlePostfix);
  }

  applyArtifactAttribute(attribute?: ArtifactAttribute | null) {
    if (!attribute) {
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
        // implemented in hero model health calculations //
        // is it?
        // done
        break;

      case ArtifactAttributeType.ReducedDelay:
        // implemented at gql security layer //
        // done
        break;

      case ArtifactAttributeType.BonusExperience:
        // implemented in hero model //
        // done
        break;

      case ArtifactAttributeType.BonusSkillChance:
        // implement in skills chance system //
        // lol where the fuck is that?
        // done
        break;

      case ArtifactAttributeType.Lifesteal:
        return this.registerModifier({
          type: GenericStatsModifier,
          options: {
            bonus: {
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
    }
  }
}
