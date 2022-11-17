import { Hero, ArtifactAttributeType, ArtifactAttribute } from "types/graphql";

import { EnchantedCombatant } from "./types";

export function getArtifactBuffs(
  enchantedHero: EnchantedCombatant
): EnchantedCombatant {
  if (!enchantedHero.equipment.artifact) {
    return enchantedHero;
  }

  const { artifact } = enchantedHero.equipment;

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

  artifactBuffs.forEach((buff) => {
    switch (buff.type) {
      case ArtifactAttributeType.BonusStrength:
        enchantedHero.attributes.strength *= buff.magnitude;
        break;

      case ArtifactAttributeType.BonusDexterity:
        enchantedHero.attributes.dexterity *= buff.magnitude;
        break;

      case ArtifactAttributeType.BonusConstitution:
        enchantedHero.attributes.constitution *= buff.magnitude;
        break;

      case ArtifactAttributeType.BonusIntelligence:
        enchantedHero.attributes.intelligence *= buff.magnitude;
        break;

      case ArtifactAttributeType.BonusWisdom:
        enchantedHero.attributes.wisdom *= buff.magnitude;
        break;

      case ArtifactAttributeType.BonusWillpower:
        enchantedHero.attributes.willpower *= buff.magnitude;
        break;

      case ArtifactAttributeType.BonusLuck:
        enchantedHero.attributes.luck *= buff.magnitude;
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
        enchantedHero.percentageDamageReduction *= buff.magnitude;
        enchantedHero.percentageEnchantmentDamageReduction *= buff.magnitude;
        break;

      case ArtifactAttributeType.EnhancedDamage:
        enchantedHero.percentageDamageIncrease *= buff.magnitude;
        break;

      case ArtifactAttributeType.BonusHealth:
        // implemented in hero model health calculations //
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
        enchantedHero.lifesteal += buff.magnitude;
        break;

      case ArtifactAttributeType.Mesmerize:
        enchantedHero.mesmerizeChance *= 2 - buff.magnitude;
        break;

      case ArtifactAttributeType.Focus:
        enchantedHero.focusChance *= 2 - buff.magnitude;
        break;
    }
  });

  return enchantedHero;
}
