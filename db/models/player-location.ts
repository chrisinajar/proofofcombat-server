import {
  PlayerLocation,
  PlayerLocationType,
  PlayerLocationUpgrades,
  AccessRole,
  Location,
  Hero,
} from "types/graphql";
import DatabaseInterface from "../interface";

import { hash } from "../../hash";
import { io } from "../../index";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type PartialPlayerLocation = Optional<
  PlayerLocation,
  "upgrades" | "resources" | "lastUpkeep" | "connections" | "availableUpgrades"
>;

const inMemoryLocationMaxLength = 100;
const upkeepInterval = 1000 * 60 * 60;

type UpkeepCosts = {
  stone: number;
  wood: number;
  food: number;
  water: number;
};

export default class PlayerLocationModel extends DatabaseInterface<PlayerLocation> {
  constructor() {
    super("playerLocation");
  }

  async get(id: string): Promise<PlayerLocation> {
    let location = await super.get(id);
    if (location.id !== id) {
      location = await super.get(location.id);
    }
    const result = await this.upkeep(location);
    if (!result) {
      throw new Error("missing");
    }
    return result;
  }

  async createCamp(hero: Hero): Promise<PlayerLocation> {
    return this.put(
      this.upgrade({
        id: hero.id,
        type: PlayerLocationType.Camp,
        owner: hero.id,
        location: hero.location,
      })
    );
  }

  async getHome(heroId: string): Promise<PlayerLocation | null> {
    try {
      let home: PlayerLocation | null = await this.get(heroId);
      if (home.id !== heroId) {
        home = await this.get(home.id);
      }
      return home;
    } catch (e) {
      return null;
    }
  }

  async getConnections(location: PlayerLocation): Promise<PlayerLocation[]> {
    if (location.type !== PlayerLocationType.Settlement) {
      return [];
    }
    let links = 2;
    const connections: PlayerLocation[] = [];
    const checkedLocations: { [x in string]?: number } = {};

    const checkLocation = async (
      check: Location,
      limit: number
    ): Promise<void> => {
      const locId = this.locationId(check);
      if ((checkedLocations[locId] ?? 0) >= limit) {
        return;
      }
      try {
        const loc = await this.get(locId);
        if (loc.owner === location.owner) {
          if (!checkedLocations[locId]) {
            connections.push(loc);
          }
          if (limit > 1) {
            await checkNeighbors(loc, limit - 1);
          }
        }
      } catch (e) {
      } finally {
        checkedLocations[locId] = limit;
      }
    };
    const checkNeighbors = async (
      check: PlayerLocation,
      limit: number
    ): Promise<void> => {
      const loc = { ...check.location };

      await Promise.all([
        checkLocation(
          {
            x: loc.x + 1,
            y: loc.y,
            map: loc.map,
          },
          limit
        ),
        checkLocation(
          {
            x: loc.x - 1,
            y: loc.y,
            map: loc.map,
          },
          limit
        ),
        checkLocation(
          {
            x: loc.x,
            y: loc.y + 1,
            map: loc.map,
          },
          limit
        ),
        checkLocation(
          {
            x: loc.x,
            y: loc.y - 1,
            map: loc.map,
          },
          limit
        ),
      ]);
    };

    await checkNeighbors(location, links);

    return connections;
  }

  addResource(location: PlayerLocation, name: string, value: number): void {
    location.resources.forEach((resource) => {
      if (resource.name === name) {
        resource.value = Math.min(
          this.resourceStorage(location, name),
          resource.value + value
        );
      }
    });
  }

  resourceCost(resource: string): number | null {
    if (
      resource === "water" ||
      resource === "food" ||
      resource === "stone" ||
      resource === "wood"
    ) {
      return 10000;
    }
    if (resource === "honey") {
      return 1000000000;
    }
    return null;
  }

  hasUpgrade(
    location: PlayerLocation,
    upgrade: PlayerLocationUpgrades
  ): boolean {
    return !!location.upgrades.find((up) => up === upgrade);
  }

  countStorageImprovements(location: PlayerLocation): number {
    return location.upgrades.filter(
      (up) =>
        up === PlayerLocationUpgrades.ImprovedCamp ||
        up === PlayerLocationUpgrades.Settlement ||
        up === PlayerLocationUpgrades.StorageCache
    ).length;
  }

  resourceStorage(location: PlayerLocation, resource: string): number {
    const storageImprovements = this.countStorageImprovements(location);
    if (resource === "population") {
      return 1000000;
    }

    if (resource === "water") {
      if (
        this.hasUpgrade(location, PlayerLocationUpgrades.RainCollectionUnit)
      ) {
        return 1000 * Math.pow(10, storageImprovements);
      }
    }

    if (resource === "stone") {
      if (this.hasUpgrade(location, PlayerLocationUpgrades.StoneStorage)) {
        return 1000 * Math.pow(10, storageImprovements);
      }
    }

    if (resource === "wood") {
      if (this.hasUpgrade(location, PlayerLocationUpgrades.WoodStorage)) {
        return 1000 * Math.pow(10, storageImprovements);
      }
    }

    if (resource === "food") {
      if (this.hasUpgrade(location, PlayerLocationUpgrades.Garden)) {
        return 1000 * Math.pow(10, storageImprovements);
      }
    }

    return 50;
  }

  upkeepNow(): string {
    return `${Math.floor(Date.now() / upkeepInterval) * upkeepInterval}`;
  }

  calculateUpkeepCosts(location: PlayerLocation): UpkeepCosts {
    // costs per upkeepInterval (hour)
    const costs = {
      stone: 1,
      wood: 1,
      food: 1,
      water: 1,
    };

    if (this.hasUpgrade(location, PlayerLocationUpgrades.HiredHelp)) {
      costs.food += 1;
    }

    if (this.hasUpgrade(location, PlayerLocationUpgrades.ImprovedCamp)) {
      costs.wood += 1;
      costs.stone += 1;
    }
    if (this.hasUpgrade(location, PlayerLocationUpgrades.Settlement)) {
      const population =
        location.resources.find((r) => r.name === "population")?.value ?? 2;

      costs.food += Math.ceil(population / 5);
      costs.water += Math.ceil(population / 5);
    }

    return costs;
  }

  async upkeep(location: PlayerLocation): Promise<PlayerLocation | null> {
    console.log("Checking upkeep for", location.location);
    const now = Number(this.upkeepNow());
    const lastUpkeep = Number(location.lastUpkeep);
    let canAffordUpkeep = true;

    const hasRainCollection = this.hasUpgrade(
      location,
      PlayerLocationUpgrades.RainCollectionUnit
    );
    const hasGarden = this.hasUpgrade(location, PlayerLocationUpgrades.Garden);
    const hasHelper = this.hasUpgrade(
      location,
      PlayerLocationUpgrades.HiredHelp
    );

    const upkeeps = Math.max(
      0,
      Math.floor((now - lastUpkeep) / upkeepInterval)
    );

    for (let i = 0; i < upkeeps; ++i) {
      const upkeepCosts = this.calculateUpkeepCosts(location);
      const food =
        location.resources.find((r) => r.name === "food")?.value ?? 0;
      console.log("Upkeeping...", upkeepCosts, location.resources);

      location.resources.forEach((resource) => {
        // upgrades
        if (hasRainCollection && resource.name === "water") {
          resource.value += Math.floor(Math.random() * Math.random() * 10);
        } else if (hasGarden && resource.name === "food") {
          resource.value += Math.floor(Math.random() * Math.random() * 10);
        } else if (resource.name === "population") {
          if (food < resource.value) {
            resource.value -= Math.ceil((Math.random() * resource.value) / 100);
          } else if (food > upkeepCosts.food * 2) {
            resource.value += Math.round((Math.random() * resource.value) / 2);
          } else {
            resource.value += Math.round(
              (Math.random() * Math.random() * resource.value) / 2
            );
          }
        } else if (resource.name === "population") {
          resource.value += Math.round(
            (Math.random() * Math.random() * resource.value) / 2
          );
        } else if (hasHelper) {
          resource.value += Math.floor(Math.random() * Math.random() * 10);
        }
        resource.value = Math.min(
          this.resourceStorage(location, resource.name),
          resource.value
        );

        // pay upkeep costs
        const cost = upkeepCosts[resource.name as keyof UpkeepCosts];
        if (cost) {
          if (cost > resource.value) {
            resource.value = 0;
            canAffordUpkeep = false;
          } else {
            resource.value -= cost;
          }
        }
      });
      if (!canAffordUpkeep) {
        break;
      }
    }

    if (!canAffordUpkeep) {
      io.sendNotification(location.owner, {
        message: `Could not pay upkeep at ${location.location.x}, ${location.location.y}, the camp was lost`,
        type: "quest",
      });
      await this.del(location);
      return null;
    }

    if (upkeeps > 0) {
      io.sendNotification(location.owner, {
        message: `Your camp at ${location.location.x}, ${location.location.y} paid upkeep.`,
        type: "quest",
      });
      location.lastUpkeep = `${now}`;
      await this.put(location);
    }

    return location;
  }

  locationId(location: Location): string {
    return `${location.map}-${location.x}-${location.y}`;
  }

  playerLocationId(location: PartialPlayerLocation): string {
    if (location.type === PlayerLocationType.Camp) {
      return location.owner;
    }
    return this.locationId(location.location);
  }

  async getPlayerLocations({
    x,
    y,
    map,
  }: {
    x: number;
    y: number;
    map: string;
  }): Promise<PlayerLocation[]> {
    let resultList: PlayerLocation[] = [];
    const iterator = this.db.iterate({});
    // ? iterator.seek(...); // You can first seek if you'd like.
    for await (const { key, value } of iterator) {
      if (resultList.length >= inMemoryLocationMaxLength) {
        break;
      }
      if (
        value.location.x !== x ||
        value.location.y !== y ||
        value.location.map !== map
      ) {
        continue;
      } else {
        if (key === this.playerLocationId(value)) {
          resultList.push(value);
        }
      }
    }
    resultList = (
      await Promise.all(resultList.map((result) => this.upkeep(result)))
    ).filter<PlayerLocation>((r): r is PlayerLocation => !!r);

    // If the end of the iterable is reached, iterator.end() is callend.
    await iterator.end();

    return resultList;
  }

  upgrade(data: PartialPlayerLocation): PlayerLocation {
    data.id = this.playerLocationId(data);

    data.upgrades = data.upgrades ?? [];
    data.resources = data.resources ?? [];
    data.lastUpkeep = data.lastUpkeep ?? this.upkeepNow();
    data.connections = [];
    data.availableUpgrades = [];

    const lastUpkeep = Number(data.lastUpkeep);
    if (isNaN(lastUpkeep) || !Number.isFinite(lastUpkeep)) {
      data.lastUpkeep = this.upkeepNow();
    }

    // construct real object to manipulate further will easier type checking...
    const playerLocation = data as PlayerLocation;

    const defaultResources: { [x in string]: number } = {};
    if (
      data.type === PlayerLocationType.Camp ||
      data.type === PlayerLocationType.Settlement
    ) {
      defaultResources.wood = 1;
      defaultResources.food = 1;
      defaultResources.water = 1;
      defaultResources.stone = 1;
      if (data.type === PlayerLocationType.Settlement) {
        defaultResources.population = 2;
      }
    }
    const foundResources: { [x in string]?: true } = {};
    playerLocation.resources = playerLocation.resources.filter((resource) => {
      resource.maximum = this.resourceStorage(playerLocation, resource.name);
      resource.value = Math.min(resource.maximum, resource.value);
      if (foundResources[resource.name]) {
        return false;
      }
      foundResources[resource.name] = true;
      return true;
    });

    Object.keys(defaultResources).forEach((name) => {
      if (!foundResources[name]) {
        playerLocation.resources.push({
          name,
          value: defaultResources[name],
          maximum: this.resourceStorage(playerLocation, name),
        });
      }
    });
    return playerLocation;
  }
}
