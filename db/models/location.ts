import { PlayerLocation, AccessRole } from "types/graphql";
import DatabaseInterface from "../interface";

import { hash } from "../../hash";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type PartialLocation = PlayerLocation;

export default class LocationsModel extends DatabaseInterface<PlayerLocation> {
  constructor() {
    super("locations");
  }

  upgrade(data: PartialLocation): PlayerLocation {
    return data as PlayerLocation;
  }
}
