import { BaseContext } from "../context";
import { getRandomizer } from "../../random";
import { LocationData, MapNames, MAP_DIMENSIONS } from "../../constants";
import {
  MonsterInstance,
  PlayerLocation,
  PlayerLocationType,
  Location,
} from "types/graphql";
import { io } from "../../index";

async function handleAberrationSettlementBattle(
  context: BaseContext,
  aberration: MonsterInstance,
  settlement: PlayerLocation,
): Promise<void> {
  // calculate both army and defensive power

  if (settlement.health === 0) {
    await context.db.playerLocation.del(settlement);
    io.sendGlobalMessage({
      color: "error",
      message: `The aberration at ${aberration.location.x}, ${aberration.location.y} has destroyed the settlement!`,
    });
  } else {
    await context.db.playerLocation.put(settlement);
    io.sendGlobalMessage({
      color: "primary",
      message: `The aberration at ${aberration.location.x}, ${aberration.location.y} is attacking a settlement!`,
    });
  }
}

async function checkSettlementOwnership(
  context: BaseContext,
  location: Location,
): Promise<PlayerLocation | null> {
  try {
    const settlement = await context.db.playerLocation.get(
      context.db.playerLocation.locationId(location),
    );

    if (settlement?.type === PlayerLocationType.Settlement) {
      return settlement;
    }
  } catch (e) {
    // No settlement found at this location
  }
  return null;
}

export async function roamAberrations(
  context: BaseContext,
  seed: number,
): Promise<boolean> {
  const random = getRandomizer(`aberration-roam-${seed}`);

  // Generate a random location on the map
  const location: Location = {
    map: "default",
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
  location: Location,
  random: () => number,
) {
  if (!aberrations.length) {
    // do nothing, method was called wrong
    return;
  }

  // grab the first aberration for single monster events, use the array in multi-monster events
  const aberration = aberrations[0];
  const { x, y } = location;

  // Check if current location has a settlement
  const currentSettlement = await checkSettlementOwnership(context, location);

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
      message: `The aberration at ${x}, ${y} has wandered into the unknown and disappeared...`,
    });
    return;
  }

  // update their location regardless
  aberration.location = newLocation;

  // Check if new location has a settlement
  const newSettlement = await checkSettlementOwnership(context, newLocation);

  // If we're moving from non-settlement to settlement, or between settlements with different owners
  if (
    (!currentSettlement && newSettlement) ||
    (currentSettlement &&
      newSettlement &&
      currentSettlement.owner !== newSettlement.owner)
  ) {
    await handleAberrationSettlementBattle(context, aberration, newSettlement);
  }

  await context.db.monsterInstances.put(aberration);
}
