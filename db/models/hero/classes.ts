import {
  Hero,
  HeroClasses,
  HeroStats,
  InventoryItemType,
  EnchantmentType,
} from "types/graphql";
import { countEnchantments } from "../../../schema/items/helpers";

type HeroStatName = keyof HeroStats;

const stats: HeroStatName[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "willpower",
  "luck",
];

// EnchantmentType.MeleeUpgrade
// EnchantmentType.CasterUpgrade
// EnchantmentType.ArcherUpgrade
// EnchantmentType.VampireUpgrade
// EnchantmentType.GamblerUpgrade
// EnchantmentType.BattleMageUpgrade
// EnchantmentType.SmiterUpgrade

export function getClass(hero: Hero): HeroClasses {
  const baseClass = getBaseClass(hero);
  // check for upgraded class

  const upgradedMelee = countEnchantments(hero, EnchantmentType.MeleeUpgrade);
  const upgradedCaster = countEnchantments(hero, EnchantmentType.CasterUpgrade);
  const upgradedArcher = countEnchantments(hero, EnchantmentType.ArcherUpgrade);
  const upgradedVampire = countEnchantments(
    hero,
    EnchantmentType.VampireUpgrade,
  );
  const upgradedGambler = countEnchantments(
    hero,
    EnchantmentType.GamblerUpgrade,
  );
  const upgradedBattleMage = countEnchantments(
    hero,
    EnchantmentType.BattleMageUpgrade,
  );
  const upgradedPaladin = countEnchantments(
    hero,
    EnchantmentType.SmiterUpgrade,
  );

  // console.log({
  //   upgradedMelee,
  //   upgradedCaster,
  //   upgradedArcher,
  //   upgradedVampire,
  //   upgradedGambler,
  //   upgradedBattleMage,
  //   upgradedPaladin,
  // });

  if (baseClass === HeroClasses.Gambler) {
    if (upgradedGambler > 0) {
      return HeroClasses.Daredevil;
    }
  }
  if (baseClass === HeroClasses.Fighter) {
    if (upgradedMelee > 0) {
      return HeroClasses.Gladiator;
    }
  }
  if (baseClass === HeroClasses.Berserker) {
    if (upgradedMelee > 0) {
      return HeroClasses.EnragedBerserker;
    }
  }
  if (baseClass === HeroClasses.Wizard) {
    if (upgradedCaster > 0) {
      return HeroClasses.MasterWizard;
    }
  }
  if (baseClass === HeroClasses.Warlock) {
    if (upgradedCaster > 0) {
      return HeroClasses.MasterWarlock;
    }
  }
  if (baseClass === HeroClasses.BattleMage) {
    if (upgradedBattleMage > 0) {
      return HeroClasses.DemonHunter;
    }
  }
  if (baseClass === HeroClasses.Paladin) {
    if (upgradedPaladin > 0) {
      return HeroClasses.Zealot;
    }
  }
  if (baseClass === HeroClasses.Ranger) {
    if (upgradedArcher > 0) {
      return HeroClasses.Archer;
    }
  }
  if (baseClass === HeroClasses.BloodMage) {
    if (upgradedVampire > 0) {
      return HeroClasses.Vampire;
    }
  }

  return baseClass;
}
export function getBaseClass(hero: Hero): HeroClasses {
  if (hero.level < 10) {
    return HeroClasses.Adventurer;
  }

  const highestStat: HeroStatName = stats.reduce<HeroStatName>(
    (high, current) => {
      if (!high) {
        return current;
      }
      if (hero.stats[high] < hero.stats[current]) {
        return current;
      }
      return high;
    },
    stats[0],
  );

  const leftWeaponType = hero.equipment.leftHand?.type;
  const rightWeaponType = hero.equipment.rightHand?.type;

  const highestStatValue = hero.stats[highestStat];

  const statRatios: { [x in HeroStatName]: number } = {
    strength: 1,
    dexterity: 1,
    constitution: 1,
    intelligence: 1,
    wisdom: 1,
    willpower: 1,
    luck: 1,
  };
  let highestStatRatio = 1;
  stats.forEach((statName) => {
    statRatios[statName] = highestStatValue / hero.stats[statName];
    if (statRatios[statName] > highestStatRatio) {
      highestStatRatio = statRatios[statName];
    }
  });

  if (highestStatRatio < 1.2) {
    if (hero.level < 100) {
      return HeroClasses.Adventurer;
    }
    return HeroClasses.JackOfAllTrades;
  }
  if (highestStat === "luck") {
    return HeroClasses.Gambler;
  }
  if (highestStat === "constitution") {
    return HeroClasses.BloodMage;
  }

  if (!leftWeaponType && !rightWeaponType) {
    // no weapons!
    // no monks yet
    // return HeroClasses.Monk;
  }

  if (
    leftWeaponType === InventoryItemType.RangedWeapon ||
    rightWeaponType === InventoryItemType.RangedWeapon
  ) {
    return HeroClasses.Ranger;
  }

  if (leftWeaponType === rightWeaponType) {
    // this'll be easy...
    if (leftWeaponType === InventoryItemType.MeleeWeapon) {
      return HeroClasses.Berserker;
    }
    if (leftWeaponType === InventoryItemType.SpellFocus) {
      return HeroClasses.Wizard;
    }
    if (leftWeaponType === InventoryItemType.Shield) {
      return HeroClasses.Paladin;
    }
  }

  if (
    leftWeaponType === InventoryItemType.Shield ||
    rightWeaponType === InventoryItemType.Shield
  ) {
    // one hand is a shield and the other isn't (double shield caught by paladin above)
    const nonShieldType =
      leftWeaponType === InventoryItemType.Shield
        ? rightWeaponType
        : leftWeaponType;
    if (nonShieldType === InventoryItemType.MeleeWeapon) {
      return HeroClasses.Fighter;
    }
    if (nonShieldType === InventoryItemType.SpellFocus) {
      return HeroClasses.Warlock;
    }
  }

  if (
    (leftWeaponType === InventoryItemType.SpellFocus &&
      rightWeaponType === InventoryItemType.MeleeWeapon) ||
    (rightWeaponType === InventoryItemType.SpellFocus &&
      leftWeaponType === InventoryItemType.MeleeWeapon)
  ) {
    return HeroClasses.BattleMage;
  }

  return HeroClasses.Adventurer;
}
