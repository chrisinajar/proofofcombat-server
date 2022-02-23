import { Hero, HeroClasses, HeroStats } from "types/graphql";

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
  const highestStat: HeroStatName = Object.keys(hero.stats)
    .map<HeroStatName>((i) => i as HeroStatName)
    .reduce<HeroStatName>((high, current) => {
      if (!high) {
        return current;
      }
      if (hero.stats[high] < hero.stats[current]) {
        return current;
      }
      return high;
    }, stats[0]);

  const highestStatValue = hero.stats[highestStat];

  if (highestStatValue < 12) {
    return HeroClasses.Adventurer;
  }

  switch (highestStat) {
    case "strength":
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
