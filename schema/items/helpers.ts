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

export function countEnchantments(
  hero: Hero,
  enchantment: EnchantmentType
): number {
  return hero.inventory.reduce<number>((memo, item) => {
    let count = item.enchantment === enchantment ? 1 : 0;
    const baseItem = BaseItems[item.baseItem];
    if (baseItem && baseItem.passiveEnchantments) {
      count += baseItem.passiveEnchantments.filter(
        (e) => e === enchantment
      ).length;
    }
    return count + memo;
  }, 0);
}

export function enchantItem(
  item: InventoryItem,
  enchantment: EnchantmentType
): InventoryItem {
  item.enchantment = enchantment;
  return item;
}

const EnchantmentTiers: EnchantmentType[][] = [
  [
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
  ],
  [
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
  ],
  [
    EnchantmentType.BonusAllStats,
    EnchantmentType.MinusEnemyAllStats,
    EnchantmentType.WisDexWill,
    EnchantmentType.CounterSpell,
  ],
  [
    EnchantmentType.AllStatsSteal,
    EnchantmentType.Vampirism,
    EnchantmentType.BigMelee,
    EnchantmentType.BigCaster,
  ],
  [
    // not droppable
    EnchantmentType.SuperDexterity,
    EnchantmentType.SuperWillpower,
    EnchantmentType.SuperWisdom,
    EnchantmentType.SuperMelee,
    EnchantmentType.SuperCaster,
    EnchantmentType.SuperMeleeVamp,
    EnchantmentType.SuperSorcVamp,
    EnchantmentType.SuperVamp,
    EnchantmentType.SuperVampMelee,
    EnchantmentType.SuperVampSorc,
    EnchantmentType.SuperBattleMage,
    EnchantmentType.SuperAllStats,
  ],
];

export function getEnchantmentTier(enchantment: EnchantmentType): number {
  let result = -1;
  EnchantmentTiers.map((tier: EnchantmentType[], index) => {
    if (tier.find((e) => e === enchantment)) {
      result = index;
    }
  });
  return result;
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
      options = options.concat(EnchantmentTiers[0]);
      break;
    case 1:
      options = options.concat(EnchantmentTiers[1]);
      break;
    case 2:
      options = options.concat(EnchantmentTiers[2]);
      break;
    // highest tier of overworld enchantments
    case 3:
      options = options.concat(EnchantmentTiers[3]);
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
    if (!item.canBuy || !item.cost || item.type === InventoryItemType.Quest) {
      return false;
    }
    if (item.level < level) {
      maxLevel = Math.max(item.level, maxLevel);
    }
    return item.level === level;
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
  allowUpgraded: boolean,
  includeLowerTiers: boolean = true
) {
  const baseItem = allowUpgraded
    ? randomUpgradedBaseItem(itemLevel)
    : randomBaseItem(itemLevel);

  const enchantment = randomEnchantment(enchantmentLevel, includeLowerTiers);

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
