import {
  SpecialLocation,
  NpcShop,
  Hero,
  MonsterInstance,
  AttackType,
} from "types/graphql";
import { LocationData, MapNames } from "../../constants";
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
  return { success: false, message: "not implemented" };
}
export function getShopData(location: SpecialLocation): NpcShop | null {
  if (location.name === "Domari's Hut") {
    return getDomariTrades();
  }

  return null;
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
function getDomariTrades(): NpcShop {
  return {
    name: "Domari the Aberration Hunter",
    trades: [
      {
        id: "domari-aberration-1",
        price: {
          ...domariAberrationCosts[0],
          description: "some gold and dust",
        },
        // todo: find a name that isn't directly ripped off from dwarf fortress
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
