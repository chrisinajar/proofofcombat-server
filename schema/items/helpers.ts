import {
  InventoryItemType,
  InventoryItem,
  Hero,
  EnchantmentType,
} from "types/graphql";
import { v4 as uuidv4 } from "uuid";

import { BaseContext } from "../context";

import { BaseItem } from "./";
import { BaseItems } from "./base-items";

export function enchantItem(
  item: InventoryItem,
  enchantment: EnchantmentType
): InventoryItem {
  item.enchantment = enchantment;
  return item;
}

export function getEnchantments(
  level: number,
  includeLowerTiers: boolean
): EnchantmentType[] {
  // current max tier, to prevent extra iterations from overly aggressive proceedural code
  level = Math.min(3, level);
  let options: EnchantmentType[] = [];
  if (includeLowerTiers && level > 0) {
    options = options.concat(getEnchantments(level - 1, includeLowerTiers));
  }

  switch (level) {
    case 0:
      options = options.concat([
        // bonus individual stats
        EnchantmentType.BonusStrength,
        EnchantmentType.BonusDexterity,
        EnchantmentType.BonusConstitution,
        EnchantmentType.BonusIntelligence,
        EnchantmentType.BonusWisdom,
        EnchantmentType.BonusWillpower,
        EnchantmentType.BonusLuck,

        // minus individual enemy stats
        EnchantmentType.MinusEnemyStrength,
        EnchantmentType.MinusEnemyDexterity,
        EnchantmentType.MinusEnemyConstitution,
        EnchantmentType.MinusEnemyIntelligence,
        EnchantmentType.MinusEnemyWisdom,
        EnchantmentType.MinusEnemyWillpower,

        // heal / damage
        EnchantmentType.LifeHeal,
        EnchantmentType.LifeDamage,
      ]);
      break;
    case 1:
      options = options.concat([
        // combined bonus/minuses
        EnchantmentType.BonusPhysical,
        EnchantmentType.BonusMental,
        EnchantmentType.MinusEnemyPhysical,
        EnchantmentType.MinusEnemyMental,
        // armor
        EnchantmentType.MinusEnemyArmor,
        EnchantmentType.BonusArmor,
        // combined heal / damage
        EnchantmentType.LifeSteal,

        // individual stat leaching
        EnchantmentType.StrengthSteal,
        EnchantmentType.DexteritySteal,
        EnchantmentType.ConstitutionSteal,
        EnchantmentType.IntelligenceSteal,
        EnchantmentType.WisdomSteal,
        EnchantmentType.WillpowerSteal,
        EnchantmentType.LuckSteal,
      ]);
      break;
    case 2:
      options = options.concat([
        EnchantmentType.BonusAllStats,
        EnchantmentType.MinusEnemyAllStats,
      ]);
      break;
    // highest tier of overworld enchantments
    case 3:
      options = options.concat([
        EnchantmentType.AllStatsSteal,
        EnchantmentType.Vampirism,
        EnchantmentType.BigMelee,
        EnchantmentType.BigCaster,
        EnchantmentType.WisDexWill,
      ]);
      break;
    case 4:
      options = options.concat([]);
      break;
  }

  return options;
}

export function randomEnchantment(
  level: number,
  includeLowerTiers: boolean = true
): EnchantmentType {
  const options = getEnchantments(level, includeLowerTiers);

  return options[Math.floor(Math.random() * options.length)];
}

export function randomUpgradedBaseItem(level: number): BaseItem {
  let maxLevel = 0;

  let options = Object.values(BaseItems).filter((item) => {
    if (item.level < level) {
      maxLevel = Math.max(item.level, maxLevel);
    }
    return item.type !== InventoryItemType.Quest && item.level === level;
  });

  if (!options.length) {
    options = Object.values(BaseItems).filter(
      (item) => item.type !== InventoryItemType.Quest && item.level === maxLevel
    );
  }

  return options[Math.floor(Math.random() * options.length)];
}
export function randomBaseItem(level: number): BaseItem {
  let maxLevel = 0;

  let options = Object.values(BaseItems).filter((item) => {
    if (item.level < level) {
      maxLevel = Math.max(item.level, maxLevel);
    }
    return (
      item.canBuy &&
      item.cost &&
      item.type !== InventoryItemType.Quest &&
      item.level === level
    );
  });

  if (!options.length) {
    options = Object.values(BaseItems).filter(
      (item) =>
        item.canBuy &&
        item.cost &&
        item.type !== InventoryItemType.Quest &&
        item.level === maxLevel
    );
  }

  return options[Math.floor(Math.random() * options.length)];
}

export function createItemInstance(item: BaseItem, owner: Hero): InventoryItem {
  const id = uuidv4();
  return {
    id,
    owner: owner.id,
    baseItem: item.id,

    name: item.name,
    type: item.type,
    level: item.level,
    enchantment: null,
  };
}

export function giveHeroRandomDrop(
  context: BaseContext,
  hero: Hero,
  itemLevel: number,
  enchantmentLevel: number,
  allowUpgraded: boolean
) {
  const baseItem = allowUpgraded
    ? randomUpgradedBaseItem(itemLevel)
    : randomBaseItem(itemLevel);

  const enchantment = randomEnchantment(enchantmentLevel, true);

  giveHeroItem(context, hero, baseItem, enchantment);
}

export function giveHeroItem(
  context: BaseContext,
  hero: Hero,
  baseItem: BaseItem,
  enchantment?: EnchantmentType
) {
  let itemInstance = createItemInstance(baseItem, hero);

  if (enchantment) {
    itemInstance = enchantItem(itemInstance, enchantment);
  }

  hero.inventory.push(itemInstance);

  context.io.sendNotification(hero.id, {
    type: "drop",
    message: `You found {{item}}`,
    item: itemInstance,
  });
}
