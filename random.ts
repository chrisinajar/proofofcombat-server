import seedrandom from "seedrandom";
import { hiddenHash } from "./hash";

export function getRandomizer(seed: string) {
  return seedrandom(hiddenHash(seed));
}
