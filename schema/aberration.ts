import { AttackType, EnchantmentType } from "types/graphql";

import { AberrationStats } from "./monster/aberration-stats";
import { BaseContext } from "./context";

import Databases from "../db";
import { getRandomizer } from "../random";
import { io } from "../index";

// at least 1 minute between spawns
const minSpawnTime = 60000;
// const minSpawnTime = 10000;
const maxSpawnTime = 48 * 60 * 60 * 1000;
// const maxSpawnTime = 120 * 1000;

const idealSpawnTime = 0.5 * 60 * 60 * 1000;
// const idealSpawnTime = 30 * 1000;
const changeWindow = 800;

let lastAberrationSpawn = Date.now();
let nextMinSpawnTime = lastAberrationSpawn;

export function resetTimer() {
  lastAberrationSpawn = Date.now();
  setNextMinTime();
}

export async function spawnRandomAberration(context: BaseContext) {
  const aberration =
    Aberrations[Math.floor(Aberrations.length * Math.random())];
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
      spawnMessage = "Ash can be seem overhead near {{loc}}";
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
    Math.max(0, location[0] + (Math.floor(Math.random() * 3) - 1))
  );
  location[1] = Math.min(
    95,
    Math.max(0, location[1] + (Math.floor(Math.random() * 3) - 1))
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

setNextMinTime();
setTimeout(init, minSpawnTime / 3);

const Aberrations = [
  {
    id: "domari-aberration-1",
    ...AberrationStats["domari-aberration-1"],
  },
  {
    id: "random-aberration-unholy-paladin",
    ...AberrationStats["random-aberration-unholy-paladin"],
  },
  {
    id: "random-aberration-thornbrute",
    ...AberrationStats["random-aberration-thornbrute"],
  },
];
