import { Hero, ArtifactItem, BaseAccount, Resolvers, MutationResolvers } from "types/graphql";
import { BaseContext } from "../context";
import { ForbiddenError, UserInputError } from "apollo-server";
import resolvers from "./resolvers";

describe("Artifact mutations", () => {
  const mockContext = {
    auth: { id: "test-hero" },
    io: {
      sendNotification: jest.fn(),
    },
    db: {
      hero: {
        get: jest.fn(),
        put: jest.fn(),
      },
      account: {
        get: jest.fn(),
      },
    },
  } as unknown as BaseContext;

  const { acceptArtifact, rejectArtifact } = resolvers.Mutation as MutationResolvers;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("acceptArtifact", () => {
    it("should throw if no pending artifact", async () => {
      (mockContext.db.hero.get as jest.Mock).mockResolvedValue({
        id: "test-hero",
        pendingArtifact: null,
      });

      await expect(
        acceptArtifact({}, {}, mockContext)
      ).rejects.toThrow(UserInputError);
    });

    it("should equip pending artifact and clear pending slot", async () => {
      const oldArtifact = { name: "Old Artifact" } as ArtifactItem;
      const newArtifact = { name: "New Artifact" } as ArtifactItem;
      const hero = {
        id: "test-hero",
        equipment: { artifact: oldArtifact },
        pendingArtifact: newArtifact,
      } as Hero;

      (mockContext.db.hero.get as jest.Mock).mockResolvedValue(hero);
      (mockContext.db.account.get as jest.Mock).mockResolvedValue({ id: "test-hero" });

      await acceptArtifact({}, {}, mockContext);

      expect(hero.equipment.artifact).toBe(newArtifact);
      expect(hero.pendingArtifact).toBeNull();
      expect(mockContext.io.sendNotification).toHaveBeenCalledWith(
        hero.id,
        expect.objectContaining({
          type: "artifact",
          artifactItem: oldArtifact,
          message: expect.stringContaining("replaced"),
        })
      );
    });
  });

  describe("rejectArtifact", () => {
    it("should throw if no pending artifact", async () => {
      (mockContext.db.hero.get as jest.Mock).mockResolvedValue({
        id: "test-hero",
        pendingArtifact: null,
      });

      await expect(
        rejectArtifact({}, {}, mockContext)
      ).rejects.toThrow(UserInputError);
    });

    it("should clear pending artifact and keep current artifact", async () => {
      const currentArtifact = { name: "Current Artifact" } as ArtifactItem;
      const pendingArtifact = { name: "Pending Artifact" } as ArtifactItem;
      const hero = {
        id: "test-hero",
        equipment: { artifact: currentArtifact },
        pendingArtifact: pendingArtifact,
      } as Hero;

      (mockContext.db.hero.get as jest.Mock).mockResolvedValue(hero);
      (mockContext.db.account.get as jest.Mock).mockResolvedValue({ id: "test-hero" });

      await rejectArtifact({}, {}, mockContext);

      expect(hero.equipment.artifact).toBe(currentArtifact);
      expect(hero.pendingArtifact).toBeNull();
      expect(mockContext.io.sendNotification).toHaveBeenCalledWith(
        hero.id,
        expect.objectContaining({
          type: "artifact",
          artifactItem: pendingArtifact,
          message: expect.stringContaining("rejected"),
        })
      );
    });
  });
}); 
