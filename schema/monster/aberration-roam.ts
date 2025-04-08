import { BaseContext } from "../context";
import { getRandomizer } from "../../random";
import { LocationData, MapNames, MAP_DIMENSIONS } from "../../constants";
import { MonsterInstance } from "types/graphql";
import { io } from "../../index";

export async function roamAberrations(
  context: BaseContext,
  seed: number,
): Promise<boolean> {
  const random = getRandomizer(`aberration-roam-${seed}`);

  // Generate a random location on the map
  const location = {
    map: "default" as MapNames,
    x: Math.floor(random() * MAP_DIMENSIONS.WIDTH),
    y: Math.floor(random() * MAP_DIMENSIONS.HEIGHT),
  };

  // Get any aberrations at this location
  const monsters = await context.db.monsterInstances.getInLocation(location);
  const aberrations = monsters.filter((monster) =>
    monster.monster.id.includes("aberration"),
  );

  if (aberrations.length > 0) {
    await handleAberrationRoam(context, aberrations, location, random);
    return true;
  }

  return false;
}

async function handleAberrationRoam(
  context: BaseContext,
  aberrations: MonsterInstance[],
  location: { map: MapNames; x: number; y: number },
  random: () => number,
) {
  // grab the first aberration for single monster events, use the array in multi-monster events
  const aberration = aberrations[0];
  const { x, y } = location;

  let roamMessage = `A forgotten aberration stirs at ${x}, ${y}...`;

  switch (aberration.monster.id) {
    case "random-aberration-unholy-paladin":
      roamMessage = `The darkness grows restless at ${x}, ${y}...`;
      break;
    case "random-aberration-thornbrute":
      roamMessage = `The thorns writhe with new vigor at ${x}, ${y}...`;
      break;
    case "domari-aberration-1":
      roamMessage = `The ash swirls with purpose at ${x}, ${y}...`;
      break;
    case "random-aberration-moving-mountain":
      roamMessage = `The earth shudders with renewed force at ${x}, ${y}...`;
      break;
    case "random-aberration-artificer":
      roamMessage = `Ancient machinery whirs to life at ${x}, ${y}...`;
      break;
  }

  io.sendGlobalMessage({
    color: "primary",
    message: roamMessage,
  });

  // Pick a random direction: 0 = north, 1 = east, 2 = south, 3 = west
  const direction = Math.floor(random() * 4);
  const newLocation = { ...aberration.location };

  switch (direction) {
    case 0:
      newLocation.y -= 1;
      break; // north
    case 1:
      newLocation.x += 1;
      break; // east
    case 2:
      newLocation.y += 1;
      break; // south
    case 3:
      newLocation.x -= 1;
      break; // west
  }

  // If they wander off the map, they're gone
  if (
    newLocation.x < 0 ||
    newLocation.x >= MAP_DIMENSIONS.WIDTH ||
    newLocation.y < 0 ||
    newLocation.y >= MAP_DIMENSIONS.HEIGHT
  ) {
    await context.db.monsterInstances.del(aberration);
    io.sendGlobalMessage({
      color: "primary",
      message: `The aberration at ${x}, ${y} has wandered into the unknown...`,
    });
    return;
  }

  // Otherwise, update their location
  aberration.location = newLocation;
  await context.db.monsterInstances.put(aberration);
}
