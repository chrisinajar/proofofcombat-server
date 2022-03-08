import Databases from "../db";

// at least 1 minute between spawns
const minSpawnTime = 60000;
// spawn at least 1 beast every 12 hours
const maxSpawnTime = 12 * 60 * 60 * 1000;

let lastAberrationSpawn = Date.now();
let nextMinSpawnTime = lastAberrationSpawn;

export function resetTimer() {
  lastAberrationSpawn = Date.now();
  setNextMinTime();
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
  return ellapsedTime / maxSpawnTime / 10000;
}

export function setNextMinTime() {
  // minimum possible time pre-randomized between 1 minute and 4 hour from now
  nextMinSpawnTime =
    lastAberrationSpawn +
    minSpawnTime +
    Math.random() * Math.random() * 1000 * 60 * 60 * 4;
}

export async function init() {
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
init();
