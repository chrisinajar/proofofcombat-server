import { EnchantmentType } from "types/graphql";

export function expandEnchantmentList(
  enchantments: EnchantmentType[]
): EnchantmentType[] {
  return enchantments.reduce<EnchantmentType[]>((list, entry) => {
    return list.concat(getExpandedEnchantments(entry));
  }, []);
}

export function getExpandedEnchantments(
  enchantment: EnchantmentType
): EnchantmentType[] {
  switch (enchantment) {
    case EnchantmentType.BigCounterSpell:
      return expandEnchantmentList([
        EnchantmentType.CounterSpell,
        EnchantmentType.CounterSpell,
        EnchantmentType.CounterSpell,
        EnchantmentType.CounterSpell,
      ]);
      break;

    case EnchantmentType.SuperCounterSpell:
      return expandEnchantmentList([
        EnchantmentType.BigCounterSpell,
        EnchantmentType.BigCounterSpell,
        EnchantmentType.BigCounterSpell,
        EnchantmentType.BigCounterSpell,
      ]);
      break;

    case EnchantmentType.TierFourCommon:
      return expandEnchantmentList([
        EnchantmentType.CounterSpell,
        EnchantmentType.MinusEnemyArmor,
        EnchantmentType.BonusArmor,
      ]);
      break;

    case EnchantmentType.SuperDexterity:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperDexterityStats,
      ]);
      break;

    case EnchantmentType.SuperWillpower:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperWillpowerStats,
      ]);
      break;

    case EnchantmentType.SuperWisdom:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperWisdomStats,
      ]);
      break;

    case EnchantmentType.SuperVamp:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperVampStats,
      ]);
      break;

    case EnchantmentType.SuperMelee:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperMeleeStats,
      ]);
      break;

    case EnchantmentType.SuperCaster:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperCasterStats,
      ]);
      break;

    case EnchantmentType.SuperVampMelee:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperVampMeleeStats,
        EnchantmentType.ThirtyLifeSteal,
      ]);
      break;

    case EnchantmentType.SuperVampSorc:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperVampSorcStats,
        EnchantmentType.ThirtyLifeSteal,
      ]);
      break;

    case EnchantmentType.SuperMeleeVamp:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperMeleeVampStats,
        EnchantmentType.TwentyLifeSteal,
      ]);
      break;

    case EnchantmentType.SuperBattleMage:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperBattleMageStats,
      ]);
      break;

    case EnchantmentType.SuperSorcVamp:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.SuperSorcVampStats,
        EnchantmentType.TwentyLifeSteal,
      ]);
      break;

    case EnchantmentType.SuperAllStats:
      return expandEnchantmentList([
        EnchantmentType.TierFourCommon,
        EnchantmentType.DoubleAllStats,
        EnchantmentType.TwentyLifeSteal,
      ]);
      break;
  }

  // no expand, stops the recursion
  return [enchantment];
}
