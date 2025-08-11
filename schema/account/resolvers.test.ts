import resolvers from "./resolvers";

describe("BaseAccount delay fields", () => {
  test("nextAllowedAction prefers context.auth.delay", async () => {
    const now = Date.now();
    const parent = { nextAllowedAction: `${now + 5000}` } as any;
    const context = { auth: { delay: `${now + 1234}` } } as any;

    // @ts-ignore
    const val = await resolvers.BaseAccount.nextAllowedAction(
      parent,
      {},
      context,
    );
    expect(val).toBe(`${now + 1234}`);
  });

  test("timeRemaining uses context.auth.delay when present", async () => {
    const now = Date.now();
    const parent = { nextAllowedAction: `${now + 5000}` } as any;
    const context = { auth: { delay: `${now + 1000}` } } as any;

    // @ts-ignore
    const remaining = await resolvers.BaseAccount.timeRemaining(
      parent,
      {},
      context,
    );
    // allow some jitter for execution time
    expect(remaining).toBeGreaterThanOrEqual(900);
    expect(remaining).toBeLessThanOrEqual(1100);
  });
});

