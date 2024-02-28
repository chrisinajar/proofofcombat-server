import { attackingIsDisabled } from "./ resolvers";

describe("attacking being disabled", () => {
  it("didn't get left enabled by accident while i was testing stuff", () => {
    expect(attackingIsDisabled).toBe(true);
  });
});
