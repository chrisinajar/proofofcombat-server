import { AttackType, EnchantmentType } from "types/graphql";

import { AberrationStats } from "./monster/aberration-stats";
import { BaseContext } from "./context";

import Databases from "../db";
import { getRandomizer } from "../random";
import { io } from "../index";

// at least 1 minute between spawns
const minSpawnTime = 90000;
// const minSpawnTime = 10000;
const maxSpawnTime = 48 * 60 * 60 * 1000;
// const maxSpawnTime = 120 * 1000;

const idealSpawnTime = 1.2 * 60 * 60 * 1000;
// const idealSpawnTime = 30 * 1000;
const changeWindow = 600;

let lastAberrationSpawn = Date.now();
let nextMinSpawnTime = lastAberrationSpawn;

export function resetTimer() {
  lastAberrationSpawn = Date.now();
  setNextMinTime();
}

export async function spawnRandomAberration(context: BaseContext) {
  const totalWeight = Aberrations.reduce<number>(
    (memo: number, abby) => memo + abby.weight,
    0,
  );
  let roll = Math.floor(totalWeight * Math.random());
  console.log({ totalWeight, roll });
  const aberration = Aberrations.find((abby) => {
    if (abby.weight > roll) {
      return true;
    }
    roll -= abby.weight;
    return false;
  });
  if (!aberration) {
    console.error(
      "ERROR IN ABERRATION CODE",
      "Could not find a valid aberration with roll",
      roll,
      "and totalWeight",
      totalWeight,
    );
    return;
  }
  console.log("ABERRATION SPAWN EVENT!?", aberration);
  let spawnMessage = "A forgotten aberration is rampaging near {{loc}}";

  switch (aberration.id) {
    case "random-aberration-unholy-paladin":
      spawnMessage = "It's dark near {{loc}}. Something unholy lurks there.";
      break;
    case "random-aberration-thornbrute":
      spawnMessage = "A horrible crack is heard near {{loc}}";
      break;
    case "domari-aberration-1":
      spawnMessage = "Ash can be seen overhead near {{loc}}";
      break;
    case "random-aberration-moving-mountain":
      spawnMessage = "The ground trembles as the mountains rise near {{loc}}";
      break;
  }

  const location = [
    Math.floor(Math.random() * 128),
    Math.floor(Math.random() * 96),
  ];

  const monster = {
    monster: aberration.monster,
    equipment: aberration.equipment,
    location: {
      map: "default",
      x: location[0],
      y: location[1],
    },
  };

  await context.db.monsterInstances.create(monster);

  location[0] = Math.min(
    127,
    Math.max(0, location[0] + (Math.floor(Math.random() * 3) - 1)),
  );
  location[1] = Math.min(
    95,
    Math.max(0, location[1] + (Math.floor(Math.random() * 3) - 1)),
  );

  // Aberrations
  io.sendGlobalMessage({
    color: "primary",
    message: spawnMessage.replace(/{{loc}}/g, `${location[0]}, ${location[1]}`),
  });
}

export async function runAberrationCheck(context: BaseContext) {
  if (!runOdds()) {
    return;
  }
  spawnRandomAberration(context);
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
  }
  return success;
}

export function getCurrentOdds() {
  const now = Date.now();

  if (now < nextMinSpawnTime) {
    return 0;
  }
  const ellapsedTime = now - nextMinSpawnTime;
  // console.log({ now, ellapsedTime });
  if (ellapsedTime >= maxSpawnTime) {
    return 1;
  }
  return 1 / (idealSpawnTime / changeWindow);
}

export function setNextMinTime() {
  nextMinSpawnTime = lastAberrationSpawn + minSpawnTime;
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

export function startAberrations() {
  setNextMinTime();
  setTimeout(init, minSpawnTime / 3);
}

const Aberrations = [
  {
    id: "domari-aberration-1",
    weight: 2,
    ...AberrationStats["domari-aberration-1"],
  },
  {
    id: "random-aberration-unholy-paladin",
    weight: 3,
    ...AberrationStats["random-aberration-unholy-paladin"],
  },
  {
    id: "random-aberration-thornbrute",
    weight: 3,
    ...AberrationStats["random-aberration-thornbrute"],
  },
  {
    id: "random-aberration-moving-mountain",
    weight: 1,
    ...AberrationStats["random-aberration-moving-mountain"],
  },
  // {
  //   id: "random-aberration-void-keeper",
  //   weight: 1,
  //   ...AberrationStats["random-aberration-void-keeper"],
  // },
];
