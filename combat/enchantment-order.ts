import { EnchantmentType } from "types/graphql";

export const EnchantmentActivationOrder = [
  EnchantmentType.BonusStrength,
  EnchantmentType.BonusDexterity,
  EnchantmentType.BonusConstitution,
  EnchantmentType.BonusIntelligence,
  EnchantmentType.BonusWisdom,
  EnchantmentType.BonusWillpower,
  EnchantmentType.BonusLuck,
  EnchantmentType.BonusPhysical,
  EnchantmentType.BonusMental,
  EnchantmentType.BonusAllStats,
  EnchantmentType.MinusEnemyArmor,
  EnchantmentType.BonusArmor,
  EnchantmentType.MinusEnemyStrength,
  EnchantmentType.MinusEnemyDexterity,
  EnchantmentType.MinusEnemyConstitution,
  EnchantmentType.MinusEnemyIntelligence,
  EnchantmentType.MinusEnemyWisdom,
  EnchantmentType.MinusEnemyWillpower,
  EnchantmentType.MinusEnemyPhysical,
  EnchantmentType.MinusEnemyMental,
  EnchantmentType.MinusEnemyAllStats,
  EnchantmentType.WisDexWill,
  EnchantmentType.BigMelee,
  EnchantmentType.BigCaster,
  EnchantmentType.FishermansStrength,
  EnchantmentType.FishermansDexterity,
  EnchantmentType.FishermansConstitution,
  EnchantmentType.FishermansIntelligence,
  EnchantmentType.FishermansWisdom,
  EnchantmentType.FishermansWillpower,
  EnchantmentType.FishermansLuck,

  // damaging / healing
  EnchantmentType.StrengthSteal,
  EnchantmentType.DexteritySteal,
  EnchantmentType.ConstitutionSteal,
  EnchantmentType.IntelligenceSteal,
  EnchantmentType.WisdomSteal,
  EnchantmentType.WillpowerSteal,
  EnchantmentType.LuckSteal,
  EnchantmentType.AllStatsSteal,
  EnchantmentType.LifeSteal,
  EnchantmentType.LifeHeal,
  EnchantmentType.LifeDamage,
  EnchantmentType.Vampirism,
];

export const EnchantmentCounterSpellOrder = [
  // counter other counter spells
  EnchantmentType.CounterSpell,

  // big heals
  EnchantmentType.Vampirism,
  EnchantmentType.LifeSteal,
  EnchantmentType.LifeHeal,
  EnchantmentType.AllStatsSteal,

  // armor is actually stacked
  EnchantmentType.BonusArmor,

  // tier 3's
  EnchantmentType.BigMelee,
  EnchantmentType.BigCaster,

  // just good
  EnchantmentType.LifeDamage,
  EnchantmentType.WisDexWill,

  // steals
  EnchantmentType.StrengthSteal,
  EnchantmentType.DexteritySteal,
  EnchantmentType.ConstitutionSteal,
  EnchantmentType.IntelligenceSteal,
  EnchantmentType.WisdomSteal,
  EnchantmentType.WillpowerSteal,
  EnchantmentType.LuckSteal,

  EnchantmentType.MinusEnemyArmor,

  // minus group stats
  EnchantmentType.MinusEnemyAllStats,
  EnchantmentType.MinusEnemyPhysical,
  EnchantmentType.MinusEnemyMental,

  // minus stats
  EnchantmentType.MinusEnemyStrength,
  EnchantmentType.MinusEnemyDexterity,
  EnchantmentType.MinusEnemyConstitution,
  EnchantmentType.MinusEnemyIntelligence,
  EnchantmentType.MinusEnemyWisdom,
  EnchantmentType.MinusEnemyWillpower,

  // group boosts
  EnchantmentType.BonusAllStats,
  EnchantmentType.BonusPhysical,
  EnchantmentType.BonusMental,

  // minor boosts
  EnchantmentType.BonusStrength,
  EnchantmentType.BonusDexterity,
  EnchantmentType.BonusConstitution,
  EnchantmentType.BonusIntelligence,
  EnchantmentType.BonusWisdom,
  EnchantmentType.BonusWillpower,
  EnchantmentType.BonusLuck,
];
