import { Hero, HeroClasses, HeroStats, InventoryItemType } from "types/graphql";

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

export function getClass(hero: Hero): HeroClasses {
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
    stats[0]
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
    return HeroClasses.JackOfAllTrades;
  }
  if (highestStat === "luck") {
    return HeroClasses.Gambler;
  }
  if (highestStat === "constitution") {
    return HeroClasses.BloodMage;
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
    (leftWeaponType === InventoryItemType.SpellFocus ||
      rightWeaponType === InventoryItemType.MeleeWeapon) &&
    (leftWeaponType === InventoryItemType.SpellFocus ||
      rightWeaponType === InventoryItemType.MeleeWeapon)
  ) {
    return HeroClasses.BattleMage;
  }

  return HeroClasses.Adventurer;
}
