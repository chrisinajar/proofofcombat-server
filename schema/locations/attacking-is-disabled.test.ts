import { attackingIsDisabled } from "./resolvers";
import { upkeepInterval, maxStoredUpkeeps } from "db/models/player-location";

describe("local development settings", () => {
  it("should have attacking disabled before going to prod", () => {
    expect(attackingIsDisabled).toBe(true);
  });
  it("should have settlement tick times set correctly before going to prod", () => {
    expect(upkeepInterval).toBe(1000 * 60 * 60);
    expect(maxStoredUpkeeps).toBe(24);
  });
});
