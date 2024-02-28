import { attackingIsDisabled } from "./resolvers";

describe("attacking being disabled", () => {
  it("didn't get let enabled by accident while i was testing stuff", () => {
    expect(attackingIsDisabled).toBe(true);
  });
});
