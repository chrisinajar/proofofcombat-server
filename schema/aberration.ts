import { AttackType, EnchantmentType } from "types/graphql";

import Databases from "../db";
import { getRandomizer } from "../random";
import { io } from "../index";

// at least 1 minute between spawns
const minSpawnTime = 60000;
// spawn at least 1 beast every 12 hours
const maxSpawnTime = 12 * 60 * 60 * 1000;
const idealSpawnTime = 3 * 60 * 60 * 1000;
const changeWindow = 1000;

let lastAberrationSpawn = Date.now();
let nextMinSpawnTime = lastAberrationSpawn;

export function resetTimer() {
  lastAberrationSpawn = Date.now();
  setNextMinTime();
}

export function runOdds(): boolean {
  const now = Date.now();
  const seed = Math.round(now / changeWindow);
  const random = getRandomizer(`aberration-${seed}`);

  const success = random() < getCurrentOdds();
  if (success) {
    lastAberrationSpawn = now;
    setNextMinTime();
    save();
    console.log("ABERRATION SPAWN EVENT!?");
    // io.sendGlobalMessage({
    //   color: "primary",
    //   // type: "drop",
    //   message: "RAWR beast spawn boo",
    // });
  }
  return success;
}

export function getCurrentOdds() {
  const now = Date.now();

  if (now < nextMinSpawnTime) {
    return 0;
  }
  const ellapsedTime = now - nextMinSpawnTime;
  if (ellapsedTime >= maxSpawnTime) {
    return 1;
  }
  return ellapsedTime / maxSpawnTime + 1 / (idealSpawnTime / changeWindow);
}

export function setNextMinTime() {
  // minimum possible time pre-randomized between 1 minute and 4 hour from now
  nextMinSpawnTime =
    lastAberrationSpawn +
    minSpawnTime +
    Math.random() * Math.random() * 1000 * 60 * 60 * 4;
}

export async function init() {
  console.log("Initializing aberration spawn system");
  lastAberrationSpawn = (await Databases.system.getSystemSettings())
    .lastAberrationSpawn;
  setNextMinTime();
}

export async function save() {
  const settings = await Databases.system.getSystemSettings();
  settings.lastAberrationSpawn = lastAberrationSpawn;
  await Databases.system.put(settings);
}

setNextMinTime();
setTimeout(init, 10000);

const Aberrations = [
  {
    id: "random-aberration-big-tank",
    monster: {
      name: "The Unholy Paladin",
      id: "random-aberration-big-tank",
      attackType: AttackType.Smite,
      level: 8,
      combat: {
        maxHealth: 2500,
        health: 2500,
      },
    },
    equipment: {
      bodyArmor: {
        level: 32,
        enchantment: EnchantmentType.CanOnlyTakeOneDamage,
      },
      handArmor: {
        level: 32,
        enchantment: EnchantmentType.MinusEnemyDexterity,
      },
      legArmor: { level: 32, enchantment: EnchantmentType.MinusEnemyWisdom },
      headArmor: { level: 32, enchantment: EnchantmentType.MinusEnemyWisdom },
      footArmor: {
        level: 32,
        enchantment: EnchantmentType.MinusEnemyDexterity,
      },

      leftHand: { level: 32, enchantment: EnchantmentType.Vampirism },
      rightHand: { level: 32 },
    },
  },
  {
    id: "random-aberration-thornbrute",
    monster: {
      name: "Thornbrute",
      id: "random-aberration-thornbrute",
      attackType: AttackType.Cast,
      level: 35,
      combat: {
        maxHealth: 1000000000,
        health: 1000000000,
      },
    },
    equipment: {
      bodyArmor: {
        level: 33,
        enchantment: EnchantmentType.MinusEnemyAllStats,
      },
      handArmor: {
        level: 33,
        enchantment: EnchantmentType.MinusEnemyAllStats,
      },
      legArmor: { level: 33, enchantment: EnchantmentType.LifeSteal },
      headArmor: { level: 33 },
      footArmor: { level: 33 },

      leftHand: { level: 33 },
      rightHand: { level: 33 },
    },
  },
];
