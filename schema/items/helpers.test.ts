import { Hero, ArtifactItem } from "types/graphql";
import { BaseContext } from "../context";
import { giveHeroArtifact } from "./helpers";

describe("giveHeroArtifact", () => {
  it("should store artifact in pending slot and send notification", () => {
    // Mock hero
    const hero = {
      id: "test-hero",
      pendingArtifact: null,
    } as Hero;

    // Mock artifact
    const artifact = {
      id: "test-artifact",
      name: "Test Artifact",
    } as ArtifactItem;

    // Mock context
    const context = {
      io: {
        sendNotification: jest.fn(),
      },
    } as unknown as BaseContext;

    // Call helper
    const result = giveHeroArtifact(context, hero, artifact);

    // Verify artifact was stored
    expect(result.pendingArtifact).toBe(artifact);

    // Verify notification was sent
    expect(context.io.sendNotification).toHaveBeenCalledWith(
      hero.id,
      {
        type: "artifact",
        artifactItem: artifact,
        message: `You found ${artifact.name}. Compare it with your current artifact and choose which to keep.`,
      }
    );
  });

  it("should use custom message when provided", () => {
    const hero = { id: "test-hero" } as Hero;
    const artifact = { name: "Test Artifact" } as ArtifactItem;
    const customMessage = "Custom message";
    const context = {
      io: {
        sendNotification: jest.fn(),
      },
    } as unknown as BaseContext;

    giveHeroArtifact(context, hero, artifact, customMessage);

    expect(context.io.sendNotification).toHaveBeenCalledWith(
      hero.id,
      {
        type: "artifact",
        artifactItem: artifact,
        message: customMessage,
      }
    );
  });
}); 