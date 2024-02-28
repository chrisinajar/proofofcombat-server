import {
  PlayerLocation,
  PlayerLocationType,
  PlayerLocationUpgrades,
  CampResources,
  AccessRole,
  Location,
  Hero,
  UpkeepCosts,
} from "types/graphql";
import DatabaseInterface from "../interface";

import { Pathfinder } from "../../pathfinding";
import { hash } from "../../hash";
import { io } from "../../index";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type PartialPlayerLocation = Optional<
  PlayerLocation,
  | "upgrades"
  | "resources"
  | "lastUpkeep"
  | "connections"
  | "availableUpgrades"
  | "upkeep"
  | "health"
> & { version?: number };

export type ResourceDataEntry = {
  location: PlayerLocation;
  resource: CampResources;
};

const inMemoryLocationMaxLength = 100;
const upkeepInterval = 1000 * 60 * 60;
const maxStoredUpkeeps = 24;

const soldierTiers = ["enlisted", "soldier", "veteran", "ghost"];

export default class PlayerLocationModel extends DatabaseInterface<PlayerLocation> {
  upkeepReentrancy: boolean = false;

  constructor() {
    super("playerLocation");
  }

  range(capital: PlayerLocation): number {
    let range = 4;
    if (
      capital.upgrades.indexOf(PlayerLocationUpgrades.HasGovernorsTitle) >= 0
    ) {
      range += 2;
    }
    if (capital.upgrades.indexOf(PlayerLocationUpgrades.GovernorsManor) >= 0) {
      range += 2;
    }

    return range;
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
      }),
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

  async getResources(
    home: PlayerLocation,
    resourceType: string,
  ): Promise<number> {
    const connections = await this.getConnections(home);
    let total = 0;

    connections.forEach((location) => {
      const resource = location.resources.find((r) => r.name === resourceType);
      if (resource) {
        total += resource.value;
      }
    });

    const resource = home.resources.find((r) => r.name === resourceType);
    if (resource) {
      total += resource.value;
    }

    return total;
  }

  async spendResources(
    home: PlayerLocation,
    resourceType: string,
    amount: number,
    maxDistance: number = -1,
  ) {
    let data = await this.getResourceData(home, resourceType);
    // if (maxDistance > 0) {
    //   data = data.filter(({ location }) => {
    //     return true;
    //   });
    // }
    return this.spendResourcesFromData(data, amount);
  }

  async spendResourcesFromData(data: ResourceDataEntry[], amount: number) {
    const total = data.reduce(
      (total, value) => (total += value.resource?.value ?? 0),
      0,
    );
    if (total < amount) {
      return false;
    }
    let pocketChange = 0;
    let remaining = amount;
    for (let i = 0, l = 1000; remaining > 0 && i < l; ++i) {
      const currentAmount = remaining;
      data.forEach(({ resource }) => {
        if (!resource) {
          return;
        }
        const takenValue = currentAmount * (resource.value / total);
        const amountToTake = Math.floor(takenValue);
        pocketChange += takenValue - amountToTake;
        resource.value -= amountToTake;
        remaining -= amountToTake;
        if (pocketChange >= 1 && resource.value > 0) {
          resource.value -= 1;
          pocketChange -= 1;
          remaining -= 1;
        }
      });
    }

    await Promise.all(data.map(({ location }) => this.put(location)));

    return remaining <= 0;
  }

  async getResourceData(
    home: PlayerLocation,
    resourceType: string,
  ): Promise<ResourceDataEntry[]> {
    const connections = await this.getConnections(home);

    const resourceData = connections
      .map((location): ResourceDataEntry | false => {
        const resource = location.resources.find(
          (r) => r.name === resourceType,
        );
        if (resource) {
          return { resource, location };
        }
        return false;
      })
      .filter((location): location is ResourceDataEntry => !!location);

    const resource = home.resources.find((r) => r.name === resourceType);
    if (resource) {
      resourceData.push({ resource, location: home });
    }

    return resourceData;
  }

  async getConnections(location: PlayerLocation): Promise<PlayerLocation[]> {
    if (location.type !== PlayerLocationType.Settlement) {
      return [];
    }
    let links = this.range(location);
    const connections: PlayerLocation[] = [];
    const checkedLocations: { [x in string]?: number } = {
      [this.locationId(location.location)]: 1,
    };

    const checkLocation = async (
      check: Location,
      limit: number,
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
            checkedLocations[locId] = 1;
          }
          const oldLimit = checkedLocations[locId];
          if (!oldLimit || limit > oldLimit) {
            checkedLocations[locId] = limit;
            await checkNeighbors(loc, limit - 1);
          }
        }
      } catch (e) {}
    };
    const checkNeighbors = async (
      check: PlayerLocation,
      limit: number,
    ): Promise<void> => {
      const loc = { ...check.location };

      await Promise.all([
        checkLocation(
          {
            x: loc.x + 1,
            y: loc.y,
            map: loc.map,
          },
          limit,
        ),
        checkLocation(
          {
            x: loc.x - 1,
            y: loc.y,
            map: loc.map,
          },
          limit,
        ),
        checkLocation(
          {
            x: loc.x,
            y: loc.y + 1,
            map: loc.map,
          },
          limit,
        ),
        checkLocation(
          {
            x: loc.x,
            y: loc.y - 1,
            map: loc.map,
          },
          limit,
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
          resource.value + value,
        );
      }
    });
  }

  buildingHealth(type: PlayerLocationType): number {
    switch (type) {
      case PlayerLocationType.Barracks:
        return 250000;
      case PlayerLocationType.Garrison:
        return 1000000;
      case PlayerLocationType.Settlement:
        return 1000000;
      case PlayerLocationType.Treasury:
        return 50000;
      default:
        return 10000;
    }
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
    return null;
  }

  hasUpgrade(
    location: PlayerLocation,
    upgrade: PlayerLocationUpgrades,
  ): boolean {
    return !!location.upgrades.find((up) => up === upgrade);
  }

  countStorageImprovements(location: PlayerLocation): number {
    const rawUpgrades = location.upgrades.filter(
      (up) =>
        up === PlayerLocationUpgrades.ImprovedCamp ||
        up === PlayerLocationUpgrades.Settlement ||
        up === PlayerLocationUpgrades.StorageCache,
    ).length;

    let populationUpgrades = 0;
    if (location.type === PlayerLocationType.Settlement) {
      const population =
        location.resources.find((res) => res.name === "population")?.value ?? 0;
      if (population > 1000) {
        populationUpgrades += 1;
      }
      if (population > 10000) {
        populationUpgrades += 1;
      }
      if (population > 100000) {
        populationUpgrades += 1;
      }
    }

    return populationUpgrades + rawUpgrades;
  }

  resourceStorage(location: PlayerLocation, resource: string): number {
    const storageImprovements = this.countStorageImprovements(location);
    if (resource === "population") {
      return 1000000;
    }

    if (resource === "cattle") {
      return 10000;
    }

    if (resource === "honey") {
      return 500;
    }

    if (resource === "water") {
      if (
        this.hasUpgrade(location, PlayerLocationUpgrades.RainCollectionUnit)
      ) {
        return 2000 * Math.pow(10, storageImprovements);
      }
    }

    if (resource === "stone") {
      if (this.hasUpgrade(location, PlayerLocationUpgrades.StoneStorage)) {
        return 2000 * Math.pow(10, storageImprovements);
      }
    }

    if (resource === "wood") {
      if (this.hasUpgrade(location, PlayerLocationUpgrades.WoodStorage)) {
        return 2000 * Math.pow(10, storageImprovements);
      }
    }

    if (resource === "food") {
      if (this.hasUpgrade(location, PlayerLocationUpgrades.Garden)) {
        return 2000 * Math.pow(10, storageImprovements);
      }
    }

    if (soldierTiers.indexOf(resource) >= 0) {
      return 1000000000;
    }

    if (resource === "bonds") {
      return 1000000000;
    }

    if (resource === "fortifications") {
      return 1000000000;
    }

    return 100;
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

      if (population > 0) {
        costs.food += Math.ceil(population / 5);
        costs.water += Math.ceil(population / 5);
      }
    }

    return costs;
  }

  async pathLengthToCapital(
    location: PlayerLocation,
    capital: PlayerLocation,
  ): Promise<number | false> {
    function fasterHash(loc: Location): string {
      return `${loc.x}-${loc.y}`;
    }

    const pf = new Pathfinder<Location>({
      hash: fasterHash,
      distance: (a: Location, b: Location): number =>
        Math.abs(a.x - b.x) + Math.abs(a.y - b.y),
      cost: (a: Location): number => 1,
      neighbors: async (a: Location): Promise<Location[]> => {
        const results: Location[] = [];
        try {
          const otherLoc = await this.get(
            this.locationId({ ...a, x: a.x + 1 }),
          );
          if (otherLoc.owner === location.owner) {
            results.push(otherLoc.location);
          }
        } catch (e) {}
        try {
          const otherLoc = await this.get(
            this.locationId({ ...a, x: a.x - 1 }),
          );
          if (otherLoc.owner === location.owner) {
            results.push(otherLoc.location);
          }
        } catch (e) {}
        try {
          const otherLoc = await this.get(
            this.locationId({ ...a, y: a.y + 1 }),
          );
          if (otherLoc.owner === location.owner) {
            results.push(otherLoc.location);
          }
        } catch (e) {}
        try {
          const otherLoc = await this.get(
            this.locationId({ ...a, y: a.y - 1 }),
          );
          if (otherLoc.owner === location.owner) {
            results.push(otherLoc.location);
          }
        } catch (e) {}

        return results;
      },
    });

    const path = await pf.findPath(location.location, capital.location);
    return path.success && path.path.length - 1;
  }

  async upkeep(location: PlayerLocation): Promise<PlayerLocation | null> {
    if (this.upkeepReentrancy) {
      return location;
    }
    this.upkeepReentrancy = true;
    const now = Number(this.upkeepNow());
    const lastUpkeep = Number(location.lastUpkeep);

    const upkeeps = Math.min(
      maxStoredUpkeeps,
      Math.max(0, Math.floor((now - lastUpkeep) / upkeepInterval)),
    );

    if (upkeeps < 1) {
      this.upkeepReentrancy = false;
      return location;
    }

    let canAffordUpkeep = true;
    let settlementDead = false;

    const hasRainCollection = this.hasUpgrade(
      location,
      PlayerLocationUpgrades.RainCollectionUnit,
    );
    const hasGarden = this.hasUpgrade(location, PlayerLocationUpgrades.Garden);
    const hasHelper = this.hasUpgrade(
      location,
      PlayerLocationUpgrades.HiredHelp,
    );

    const startingCattle =
      location.resources.find((r) => r.name === "cattle")?.value ?? 0;
    const startingHoney =
      location.resources.find((r) => r.name === "honey")?.value ?? 0;
    const startingBees =
      location.resources.find((r) => r.name === "bees")?.value ?? 0;
    const startingBonds =
      location.resources.find((r) => r.name === "bonds")?.value ?? 0;

    const startingMilitaryUnits = soldierTiers.map(
      (tier) => location.resources.find((r) => r.name === tier)?.value ?? 0,
    );
    const militaryGains = soldierTiers.map(() => 0);
    const totalMilitaryUnits = startingMilitaryUnits.reduce((a, b) => a + b);

    let isDecaying = false;
    let foodProduction = 0;
    const capital = await this.getHome(location.owner);
    const capitalPopulation =
      capital?.resources?.find?.((r) => r.name === "population")?.value ?? 0;

    if (
      location.type !== PlayerLocationType.Settlement &&
      location.type !== PlayerLocationType.Camp
    ) {
      // non-central building, like a farm or something
      // we are "decaying" if we don't have a capital
      isDecaying = !capital;

      if (capital) {
        const distance = await this.pathLengthToCapital(location, capital);
        if (!distance) {
          isDecaying = true;
        } else if (this.range(capital) < distance) {
          isDecaying = true;
        }
      }
    }

    for (let i = 0; i < upkeeps; ++i) {
      const upkeepCosts = this.calculateUpkeepCosts(location);
      const food =
        location.resources.find((r) => r.name === "food")?.value ?? 0;
      const population =
        location.resources.find((r) => r.name === "population")?.value ?? 0;
      const bees =
        location.resources.find((r) => r.name === "bees")?.value ?? 0;

      location.resources.forEach((resource) => {
        // handle military
        if (totalMilitaryUnits > 0) {
          // upkeep military
          // they cost nothing because upkeep costs are effectively "local"
          const currentResourceSoldierTier = soldierTiers.indexOf(
            resource.name,
          );
          if (currentResourceSoldierTier >= 0) {
            // this is a soldier unit
            const odds =
              0.001 *
              Math.pow(0.02, currentResourceSoldierTier) *
              (Math.random() * 0.5 + 0.5);
            if (currentResourceSoldierTier === 0) {
              const availableSlots =
                this.resourceStorage(location, resource.name) - resource.value;
              const amount = Math.min(
                availableSlots,
                Math.floor(odds * 0.5 * totalMilitaryUnits),
              );
              if (amount > 0) {
                militaryGains[currentResourceSoldierTier] += amount;
                resource.value += amount;
              }
            }
            if (currentResourceSoldierTier + 1 < soldierTiers.length) {
              const upgradeTarget = location.resources.find(
                (r) => r.name === soldierTiers[currentResourceSoldierTier + 1],
              );
              if (upgradeTarget) {
                const availableSlots =
                  this.resourceStorage(location, upgradeTarget.name) -
                  upgradeTarget.value;
                const amount = Math.min(
                  availableSlots,
                  Math.floor(odds * resource.value),
                );
                if (amount > 0) {
                  resource.value -= amount;
                  upgradeTarget.value += amount;
                  militaryGains[currentResourceSoldierTier + 1] += amount;
                }
              }
            }
          }
        }
        // upgrades
        if (resource.name === "water") {
          if (hasRainCollection) {
            resource.value += Math.floor(Math.random() * Math.random() * 10);
          }

          resource.value += Math.floor(population / 6);
          resource.value += Math.floor(
            resource.value * 0.005 * (population / (population + 500)),
          );
        } else if (resource.name === "bees") {
          resource.value += Math.floor(Math.random() * 1.1);
        } else if (resource.name === "bonds") {
          resource.value += Math.floor(resource.value * 0.01);
        } else if (resource.name === "honey") {
          resource.value += Math.floor(
            Math.random() *
              Math.random() *
              Math.random() *
              Math.random() *
              Math.log2(bees),
          );
        } else if (resource.name === "cattle") {
          // random between 1-3 per cattle
          foodProduction += Math.ceil(resource.value * 3 * Math.random());
          resource.value += Math.round(
            Math.random() * Math.random() * Math.log2(resource.value) +
              (Math.random() * Math.random() * resource.value) / 100,
          );
          if (resource.maximum) {
            if (resource.value > resource.maximum) {
              foodProduction += (resource.value - resource.maximum) * 10;
            }
          }
        } else if (resource.name === "food") {
          if (hasGarden) {
            resource.value += Math.floor(Math.random() * Math.random() * 10);
          }
          // bwahahahahaha why
          resource.value += Math.floor(
            (1 /
              (1 +
                Math.pow(
                  1.3,
                  // okay sure xD
                  1 - Math.log(population / 1000) / Math.log(16),
                ))) *
              (5000 * (population / (population + 10000))),
          );
        } else if (resource.name === "population") {
          const populationGrowth = Math.max(
            1,
            (2 * Math.log(resource.value)) / Math.log(1.4),
          );
          if (food < resource.value) {
            // food is low but people are fed
            resource.value -= Math.ceil((Math.random() * resource.value) / 100);
            if (resource.value < 1) {
              settlementDead = true;
            }
          } else if (food > upkeepCosts.food * 100) {
            resource.value += Math.floor(
              (Math.random() * 0.4 + 0.8) * populationGrowth,
            );
          } else if (food < upkeepCosts.food) {
            // people are starving
            resource.value = Math.floor(resource.value * 0.8);
          } else {
            resource.value += Math.floor(
              (Math.random() * Math.random() * 0.6 + 0.5) * populationGrowth,
            );
          }
        } else if (resource.name === "wood" || resource.name === "stone") {
          if (hasHelper) {
            resource.value += Math.floor(Math.random() * Math.random() * 20);
          }
          resource.value += Math.floor(population / 1000);
        }

        if (isDecaying) {
          // 10% decay on all resources when decaying
          resource.value -= Math.ceil(resource.value * 0.1);
        }

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

        resource.value = Math.max(
          0,
          Math.min(
            this.resourceStorage(location, resource.name),
            resource.value,
          ),
        );
      });
    }

    if (upkeeps > 0) {
      if (isDecaying) {
        io.sendNotification(location.owner, {
          message: `${location.location.x}, ${location.location.y} has no connection to your capital and is decaying`,
          type: "quest",
        });
      } else if (!canAffordUpkeep) {
        if (location.type === PlayerLocationType.Camp) {
          io.sendNotification(location.owner, {
            message: `Could not pay upkeep at ${location.location.x}, ${location.location.y}, the camp was lost`,
            type: "quest",
          });
          await this.del(location);
          return null;
        }
        if (location.type === PlayerLocationType.Settlement) {
          if (settlementDead) {
            io.sendNotification(location.owner, {
              message: `Your people at ${location.location.x}, ${location.location.y} have all starved to death`,
              type: "quest",
            });
            await this.del(location);
            return null;
          } else {
            io.sendNotification(location.owner, {
              message: `Your people at ${location.location.x}, ${location.location.y} are starving`,
              type: "quest",
            });
          }
        }
      } else {
        if (location.type === PlayerLocationType.Camp) {
          io.sendNotification(location.owner, {
            message: `Your camp at ${location.location.x}, ${location.location.y} paid upkeep.`,
            type: "quest",
          });
        }
        if (location.type === PlayerLocationType.Settlement) {
          io.sendNotification(location.owner, {
            message: `Your settlement at ${location.location.x}, ${location.location.y} paid upkeep.`,
            type: "quest",
          });
        }
        if (location.type === PlayerLocationType.Treasury) {
          const endingBonds =
            location.resources.find((r) => r.name === "bonds")?.value ?? 0;
          if (endingBonds > startingBonds) {
            io.sendNotification(location.owner, {
              message: `Your treasury at ${location.location.x}, ${
                location.location.y
              } gained ${(
                endingBonds - startingBonds
              ).toLocaleString()} bonds.`,
              type: "quest",
            });
          }
        }
        if (location.type === PlayerLocationType.Farm) {
          const endingCattle =
            location.resources.find((r) => r.name === "cattle")?.value ?? 0;
          if (foodProduction + (endingCattle - startingCattle) > 0) {
            const foodMsg =
              foodProduction > 0
                ? ` ${foodProduction.toLocaleString()} food`
                : null;
            const cattleMsg =
              endingCattle - startingCattle > 0
                ? ` ${(endingCattle - startingCattle).toLocaleString()} cattle`
                : null;
            io.sendNotification(location.owner, {
              message: `Your farm at ${location.location.x}, ${
                location.location.y
              } gained ${[cattleMsg, foodMsg]
                .filter((a) => !!a)
                .join(" and ")}.`,
              type: "quest",
            });
          }
          if (foodProduction > 0 && !isDecaying) {
            const capital = await this.getHome(location.owner);
            if (capital) {
              const food = capital.resources.find((res) => res.name === "food");
              if (food) {
                food.value = Math.min(
                  this.resourceStorage(capital, "food"),
                  Math.round(food.value + foodProduction),
                );
                await this.put(capital);
              }
            }
          }
        }
        if (location.type === PlayerLocationType.Apiary) {
          const endingBees =
            location.resources.find((r) => r.name === "bees")?.value ?? 0;

          const endingHoney =
            location.resources.find((r) => r.name === "honey")?.value ?? 0;

          const parts: string[] = [];

          if (endingBees - startingBees > 0) {
            parts.push(`${endingBees - startingBees} bees`);
          }
          if (endingHoney - startingHoney > 0) {
            parts.push(`${endingHoney - startingHoney} honey`);
          }
          if (parts.length) {
            io.sendNotification(location.owner, {
              message: `Your apiary at ${location.location.x}, ${
                location.location.y
              } gained ${parts.join(" and ")}.`,
              type: "quest",
            });
          }
        }
        if (location.type === PlayerLocationType.Barracks) {
          const parts: string[] = [];
          militaryGains.forEach((gains, index) => {
            if (gains > 0) {
              if (index === 0) {
                parts.push(
                  `recruited ${gains.toLocaleString()} ${soldierTiers[index]}`,
                );
              } else {
                parts.push(
                  `trained ${gains.toLocaleString()} ${soldierTiers[index]}`,
                );
              }
            }
          });
          if (parts.length) {
            io.sendNotification(location.owner, {
              message: `Your barracks at ${location.location.x}, ${
                location.location.y
              } ${parts.join(" and ")}.`,
              type: "quest",
            });
          }
        }
      }
      location.lastUpkeep = `${now}`;
      await this.put(location);
    }

    this.upkeepReentrancy = false;

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
    // can't get just do like a get all here?
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

    if (!data.version) {
      data.version = 1;
      const population = data.resources.find(
        (res) => res.name === "population",
      );
      if (population) {
        population.value = 2;
        console.log("Resetting population", data.location);
      }
    }
    if (data.version === 1) {
      data.health = this.buildingHealth(data.type);
      data.version = 2;
    }

    // construct real object to manipulate further will easier type checking...
    const playerLocation = data as PlayerLocation;

    const defaultResources: { [x in string]: number } = {};
    if (data.type === PlayerLocationType.Farm) {
      defaultResources.cattle = 10;
    }
    if (data.type === PlayerLocationType.Apiary) {
      defaultResources.bees = 5;
      defaultResources.honey = 0;
    }
    if (data.type === PlayerLocationType.Barracks) {
      soldierTiers.map((tier) => {
        defaultResources[tier] = 0;
      });
    }
    if (data.type === PlayerLocationType.Treasury) {
      defaultResources.bonds = 0;
    }
    if (data.type === PlayerLocationType.Garrison) {
      defaultResources.fortifications = 0;
    }
    if (
      data.type === PlayerLocationType.Camp ||
      data.type === PlayerLocationType.Settlement
    ) {
      defaultResources.wood = 5;
      defaultResources.food = 5;
      defaultResources.water = 5;
      defaultResources.stone = 5;
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
