import { MonsterInstance, Location } from "types/graphql";

import DatabaseInterface from "../interface";
import { hash } from "../../hash";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

export type MonsterInstanceInput = Omit<MonsterInstance, "id">;

// Define PartialMonsterInstance type where lastActive is optional since it's new
type PartialMonsterInstance = Optional<MonsterInstance, "lastActive">;

export default class MonsterInstanceModel extends DatabaseInterface<MonsterInstance> {
  constructor() {
    super("monsters");
  }

  // there can never be more than 1 of a given monster ID in a given location
  // monsters that can stack must have dynamic unique ID's in order to exist in the same location
  async create(data: MonsterInstanceInput) {
    const id: string = hash(
      [
        data.location.x,
        data.location.y,
        data.location.map,
        data.monster.id,
      ].join("\n"),
    );

    return this.put(
      this.upgrade({
        ...data,
        id,
      }),
    );
  }

  // Convert old monster instance data to current format
  upgrade(data: PartialMonsterInstance): MonsterInstance {
    if (!data.lastActive) {
      data.lastActive = Date.now();
    }
    const monsterInstance = data as MonsterInstance;

    return monsterInstance;
  }

  // Override get to handle upgrading old data
  async get(id: string): Promise<MonsterInstance> {
    const data = await super.get(id);
    return this.upgrade(data);
  }

  async getInLocation(location: Location): Promise<MonsterInstance[]> {
    const monsters = await this.db.iterateFilter((value, key) => {
      return (
        value.location.x === location.x &&
        value.location.y === location.y &&
        value.location.map === location.map
      );
    });
    return monsters.map((monster) => this.upgrade(monster));
  }
}
