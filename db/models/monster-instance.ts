import { MonsterInstance, Location } from "types/graphql";

import DatabaseInterface from "../interface";
import { hash } from "../../hash";

export type MonsterInstanceInput = Omit<MonsterInstance, "id">;

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
      ].join("\n")
    );

    return this.put({
      ...data,
      id,
    });
  }

  async getInLocation(location: Location): Promise<MonsterInstance[]> {
    return this.db.iterateFilter((value, key) => {
      return (
        value.location.x === location.x &&
        value.location.y === location.y &&
        value.location.map === location.map
      );
    });
  }
}
