import {
  SpecialLocation,
  NpcShop,
  Hero,
  MonsterInstance,
  AttackType,
  InventoryItem,
  EnchantmentType,
  NpcShopItems,
} from "types/graphql";
import { LocationData, MapNames } from "../../constants";
import { giveQuestItemNotification, takeQuestItem } from "../quests/helpers";
import { BaseContext } from "../context";

type NpcTradeResult = { success: boolean; message: string };

export async function executeNpcTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  if (tradeId.startsWith("domari")) {
    return executeDomariTrade(context, hero, tradeId);
  }
  if (tradeId.startsWith("naxxremis")) {
    return executeNaxxremisTrade(context, hero, tradeId);
  }
  if (tradeId.startsWith("trimarim")) {
    return executeTrimarimTrade(context, hero, tradeId);
  }
  return { success: false, message: "not implemented" };
}
export function getShopData(
  context: BaseContext,
  hero: Hero,
  location: SpecialLocation
): NpcShop | null {
  if (location.name === "Domari's Hut") {
    return getDomariTrades(context, hero);
  } else if (location.name === "Naxxremis's Grotto") {
    return getNaxxremisTrades(context, hero);
  } else if (location.name === "The Hellhound's Fur") {
    return getTrimarimTrades(context, hero);
  }

  return null;
}

function payForTrimarim(hero: Hero, price: NpcShopItems): NpcTradeResult {
  const enchantmentsFound: { [x in EnchantmentType]?: 0 | 1 } = {};

  if (price.enchantments) {
    price.enchantments.forEach((ench) => {
      enchantmentsFound[ench] = 0;
    });
  }

  const filteredEnchantments = hero.enchantments.filter((enchantment) => {
    if (enchantmentsFound[enchantment] === 0) {
      enchantmentsFound[enchantment] = 1;
      return false;
    }
    return true;
  });

  let metCosts = Object.values(enchantmentsFound).indexOf(0) === -1;

  if (!metCosts) {
    return {
      success: false,
      message: "You lack the pure enchantments for this.",
    };
  }
  price.gold = price.gold ?? 0;
  price.dust = price.dust ?? 0;
  if (hero.gold < price.gold) {
    return { success: false, message: "You lack the gold for this." };
  }
  if (hero.enchantingDust < price.dust) {
    return { success: false, message: "You lack the gold for this." };
  }
  // pay fee's
  hero.gold -= price.gold;
  hero.enchantingDust -= price.dust;
  hero.enchantments = filteredEnchantments;

  return { success: true, message: "" };
}

const TrimarimPrices = {
  "trimarim-enchantment-combiner": {
    gold: 1000000,
    dust: 50,
    enchantments: [
      EnchantmentType.BonusStrength,
      EnchantmentType.BonusDexterity,
      EnchantmentType.BonusConstitution,
      EnchantmentType.BonusIntelligence,
      EnchantmentType.BonusWisdom,
      EnchantmentType.BonusWillpower,
      EnchantmentType.BonusLuck,
    ],
    description: "one of each normal enchantment and a small fee",
  },
  "trimarim-enchantment-combiner-minus-enemy": {
    gold: 1000000,
    dust: 50,
    enchantments: [
      EnchantmentType.MinusEnemyStrength,
      EnchantmentType.MinusEnemyDexterity,
      EnchantmentType.MinusEnemyConstitution,
      EnchantmentType.MinusEnemyIntelligence,
      EnchantmentType.MinusEnemyWisdom,
      EnchantmentType.MinusEnemyWillpower,
    ],
    description: "one of each destructive enchantment and a small fee",
  },
  "trimarim-enchantment-make-sa": {
    gold: 2000000000,
    dust: 500,
    enchantments: [
      EnchantmentType.StrengthSteal,
      EnchantmentType.DexteritySteal,
      EnchantmentType.ConstitutionSteal,
      EnchantmentType.IntelligenceSteal,
      EnchantmentType.WisdomSteal,
      EnchantmentType.WillpowerSteal,
      EnchantmentType.LuckSteal,
    ],
    description: "the seven greedy enchantments",
  },
};

async function executeTrimarimTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  if (tradeId === "trimarim-enchantment-combiner") {
    const priceResult = payForTrimarim(
      hero,
      TrimarimPrices["trimarim-enchantment-combiner"]
    );
    if (!priceResult.success) {
      return priceResult;
    }

    hero.enchantments.push(EnchantmentType.BonusAllStats);
    await context.db.hero.put(hero);
    return { success: true, message: "You shall know power like none before" };
  } else if (tradeId === "trimarim-enchantment-combiner-minus-enemy") {
    const priceResult = payForTrimarim(
      hero,
      TrimarimPrices["trimarim-enchantment-combiner-minus-enemy"]
    );
    if (!priceResult.success) {
      return priceResult;
    }

    hero.enchantments.push(EnchantmentType.MinusEnemyAllStats);
    await context.db.hero.put(hero);
    return { success: true, message: "Your enemies will melt before you" };
  } else if (tradeId === "trimarim-enchantment-make-sa") {
    const priceResult = payForTrimarim(
      hero,
      TrimarimPrices["trimarim-enchantment-make-sa"]
    );
    if (!priceResult.success) {
      return priceResult;
    }

    hero.enchantments.push(EnchantmentType.AllStatsSteal);
    await context.db.hero.put(hero);
    return { success: true, message: "The power is overwhelming" };
  }

  return { success: false, message: "not implemented" };
}

function getTrimarimTrades(context: BaseContext, hero: Hero): NpcShop {
  const shop: NpcShop = {
    name: "Trimarim's Enchantment Shop",

    trades: [],
  };

  shop.trades.push({
    id: "trimarim-enchantment-combiner",
    price: TrimarimPrices["trimarim-enchantment-combiner"],
    offer: {
      enchantments: [EnchantmentType.BonusAllStats],
      description: "a combination of all of them",
    },
  });

  shop.trades.push({
    id: "trimarim-enchantment-combiner-minus-enemy",
    price: TrimarimPrices["trimarim-enchantment-combiner-minus-enemy"],
    offer: {
      enchantments: [EnchantmentType.MinusEnemyAllStats],
      description: "a combination of all of them",
    },
  });

  shop.trades.push({
    id: "trimarim-enchantment-make-sa",
    price: TrimarimPrices["trimarim-enchantment-make-sa"],
    offer: {
      enchantments: [EnchantmentType.AllStatsSteal],
      description: "something far far greater",
    },
  });

  return shop;
}

function getUnupgradedItems(hero: Hero): InventoryItem[] {
  return hero.inventory.filter(
    (item) =>
      item.baseItem === "fishermans-luck" ||
      item.baseItem === "fishermans-strength" ||
      item.baseItem === "fishermans-intelligence" ||
      item.baseItem === "fishermans-wisdom" ||
      item.baseItem === "fishermans-willpower" ||
      item.baseItem === "fishermans-dexterity" ||
      item.baseItem === "fishermans-constitution"
  );
}

const NaxxremisClassUpgradeCost = 5000;
function getNaxxremisTrades(context: BaseContext, hero: Hero): NpcShop {
  const unupgradedItems = getUnupgradedItems(hero);

  const shop: NpcShop = {
    name: "Naxxremis the Crafter",

    trades: [],
  };

  if (unupgradedItems.length) {
    shop.trades.push({
      id: "naxxremis-class-upgrade",
      price: {
        dust: NaxxremisClassUpgradeCost,
        description: "a little dust",
      },
      offer: {
        questItems: ["A random class upgrade you have not yet unlocked"],
        description: "something you'd otherwise miss",
      },
    });
  }

  return shop;
}
async function executeNaxxremisTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  if (tradeId === "naxxremis-class-upgrade") {
    if (hero.enchantingDust < NaxxremisClassUpgradeCost) {
      return {
        success: false,
        message: "You do not have enough enchanting dust for this.",
      };
    }
    const unupgradedItems = getUnupgradedItems(hero);
    if (!unupgradedItems.length) {
      return {
        success: false,
        message: "You do not have any items to upgrade.",
      };
    }
    const itemToUpgrade =
      unupgradedItems[Math.floor(unupgradedItems.length * Math.random())];

    if (itemToUpgrade.baseItem === "fishermans-luck") {
      hero = giveQuestItemNotification(context, hero, "gambling-kit");
      hero = takeQuestItem(hero, "loaded-dice");
      hero = takeQuestItem(hero, "fishermans-luck");
    } else if (itemToUpgrade.baseItem === "fishermans-strength") {
      hero = giveQuestItemNotification(context, hero, "warriors-armlette");
      hero = takeQuestItem(hero, "warrior-plate");
      hero = takeQuestItem(hero, "fishermans-strength");
    } else if (itemToUpgrade.baseItem === "fishermans-intelligence") {
      hero = giveQuestItemNotification(context, hero, "tome-of-knowledge");
      hero = takeQuestItem(hero, "secret-codex");
      hero = takeQuestItem(hero, "fishermans-intelligence");
    } else if (itemToUpgrade.baseItem === "fishermans-wisdom") {
      hero = giveQuestItemNotification(context, hero, "patrons-wisdom");
      hero = takeQuestItem(hero, "patrons-mark");
      hero = takeQuestItem(hero, "fishermans-wisdom");
    } else if (itemToUpgrade.baseItem === "fishermans-willpower") {
      hero = giveQuestItemNotification(context, hero, "liturgical-censer");
      hero = takeQuestItem(hero, "righteous-incense");
      hero = takeQuestItem(hero, "fishermans-willpower");
    } else if (itemToUpgrade.baseItem === "fishermans-dexterity") {
      hero = giveQuestItemNotification(context, hero, "quiver-of-speed");
      hero = takeQuestItem(hero, "fletching-leather");
      hero = takeQuestItem(hero, "fishermans-dexterity");
    } else if (itemToUpgrade.baseItem === "fishermans-constitution") {
      hero = giveQuestItemNotification(context, hero, "vampire-ring");
      hero = takeQuestItem(hero, "blood-stone");
      hero = takeQuestItem(hero, "fishermans-constitution");
    }
    hero.enchantingDust -= NaxxremisClassUpgradeCost;
    await context.db.hero.put(hero);
    return {
      success: true,
      message: "His power amazes you.",
    };
  }
  return { success: false, message: "not implemented" };
}

type SummoningCost = {
  gold?: number;
  dust?: number;
};

const domariAberrationCosts: SummoningCost[] = [
  {
    gold: 1000000000,
    dust: 1000,
  },
];

const domariAberrations: Omit<MonsterInstance, "id" | "location">[] = [
  {
    monster: {
      name: "Burnt Harlequin",
      id: "domari-aberration-1",
      attackType: AttackType.Melee,
      level: 31,
      combat: {
        maxHealth: 25000000,
        health: 25000000,
      },
    },
    equipment: {
      bodyArmor: { level: 32 },
      handArmor: { level: 32 },
      legArmor: { level: 32 },
      headArmor: { level: 32 },
      footArmor: { level: 32 },

      leftHand: { level: 32 },
      rightHand: { level: 32 },
    },
  },
];

// domari the aberration hunter
function getDomariTrades(context: BaseContext, hero: Hero): NpcShop {
  return {
    name: "Domari the Aberration Hunter",
    trades: [
      {
        id: "domari-aberration-1",
        price: {
          ...domariAberrationCosts[0],
          description: "some gold and dust",
        },
        offer: { description: "the location of a forgotten aberration" },
      },
    ],
  };
}
async function executeDomariTrade(
  context: BaseContext,
  hero: Hero,
  tradeId: string
): Promise<NpcTradeResult> {
  console.log("Attempting summon aberration", hero.name, tradeId);
  let tradeIndex = -1;
  switch (tradeId) {
    case "domari-aberration-1":
      tradeIndex = 0;
      break;
  }

  if (tradeIndex === -1) {
    return { success: false, message: `Trade not implemented: ${tradeId}` };
  }
  const costs = domariAberrationCosts[tradeIndex];
  const aberration = domariAberrations[tradeIndex];

  if (costs) {
    if (costs.gold) {
      if (hero.gold < costs.gold) {
        return { success: false, message: "You do not have enough gold!" };
      }
      hero.gold -= costs.gold;
    }
    if (costs.dust) {
      if (hero.enchantingDust < costs.dust) {
        return {
          success: false,
          message: "You do not have enough enchanting dust!",
        };
      }
      hero.enchantingDust -= costs.dust;
    }
  }
  if (aberration) {
    console.log({ aberration });
    let location: [number, number] = getRandomTerrainLocation(
      hero.location.map as MapNames,
      "land"
    );
    const monster = {
      ...aberration,
      location: {
        map: hero.location.map,
        x: location[0],
        y: location[1],
      },
    };

    await context.db.monsterInstances.create(monster);
    await context.db.hero.put(hero);

    return {
      success: true,
      message: `The ${aberration.monster.name} has been summoned at ${location[0]}, ${location[1]}`,
    };
  }
  return { success: false, message: "not implemented" };
}

function getRandomTerrainLocation(
  map: MapNames,
  targetTerrain: string
): [number, number] {
  for (let i = 0, l = 1000; i < l; ++i) {
    const location = getRandomLocation(map);
    const terrain = LocationData[map]?.locations[location[0]][location[1]];
    if (terrain?.terrain === targetTerrain) {
      return location;
    }
  }
  return [0, 0];
}
function getRandomLocation(map: MapNames): [number, number] {
  // floor so they cap out at 127 and 96
  return [Math.floor(Math.random() * 128), Math.floor(Math.random() * 96)];
}
