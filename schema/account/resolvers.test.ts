import resolvers from "./resolvers";

function makeChatContext(overrides: { banned?: boolean } = {}) {
  return {
    auth: { id: "test-id" },
    db: {
      account: {
        get: jest.fn().mockResolvedValue({
          id: "test-id",
          banned: overrides.banned ?? false,
        }),
      },
      hero: {
        get: jest.fn().mockResolvedValue({ name: "TestHero" }),
      },
    },
  } as any;
}

describe("chat query", () => {
  const chatResolver = (resolvers.Query as any).chat;

  test("returns a token for a non-banned user", async () => {
    const context = makeChatContext();
    const result = await chatResolver({}, {}, context);
    expect(result).toHaveProperty("token");
    expect(typeof result.token).toBe("string");
  });

  test("throws for a banned user", async () => {
    const context = makeChatContext({ banned: true });
    await expect(chatResolver({}, {}, context)).rejects.toThrow();
    expect(context.db.hero.get).not.toHaveBeenCalled();
  });
});

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

