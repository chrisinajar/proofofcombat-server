import { Adventure } from "types/graphql";
import DatabaseInterface from "../interface";

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
type PartialAdventure = Adventure; // Optional<Adventure, "banned" | "nextAllowedAction">;

export default class AdventureModel extends DatabaseInterface<Adventure> {
  constructor() {
    super("adventure");
  }

  upgrade(data: PartialAdventure): Adventure {
    return data as Adventure;
  }
}
