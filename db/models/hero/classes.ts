import { Hero, HeroClasses, HeroStats, InventoryItemType } from "types/graphql";

type HeroStatName = keyof HeroStats;

const stats: HeroStatName[] = [
  "strength",
  "dexterity",
  "constitution",
  "intelligence",
  "wisdom",
  "charisma",
  "luck",
];

export function getClass(hero: Hero): HeroClasses {
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

  const highestStatValue = hero.stats[highestStat];

  const statRatios: { [x in HeroStatName]: number } = {
    strength: 1,
    dexterity: 1,
    constitution: 1,
    intelligence: 1,
    wisdom: 1,
    charisma: 1,
    luck: 1,
  };
  let highestStatRatio = 1;
  stats.forEach((statName) => {
    statRatios[statName] = highestStatValue / hero.stats[statName];
    if (statRatios[statName] > highestStatRatio) {
      highestStatRatio = statRatios[statName];
    }
  });

  if (highestStatValue < 20) {
    return HeroClasses.Adventurer;
  }

  if (highestStatRatio < 1.2) {
    return HeroClasses.JackOfAllTrades;
  }

  switch (highestStat) {
    case "strength":
      if (
        hero.equipment.leftHand?.type === InventoryItemType.MeleeWeapon &&
        hero.equipment.rightHand?.type === InventoryItemType.MeleeWeapon
      ) {
        return HeroClasses.Berserker;
      }
      return HeroClasses.Fighter;
      break;
    case "dexterity":
      return HeroClasses.Ranger;
      break;
    case "constitution":
      return HeroClasses.BloodMage;
      break;
    case "intelligence":
      return HeroClasses.Wizard;
      break;
    case "wisdom":
      return HeroClasses.Elementalist;
      break;
    case "charisma":
      return HeroClasses.Cleric;
      break;
    case "luck":
      return HeroClasses.Gambler;
      break;
  }

  return HeroClasses.Adventurer;
}
