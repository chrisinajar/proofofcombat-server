import { ArtifactAttributeType } from "types/graphql";
import { ArtifactItem } from "./artifact-item";
import { Unit } from "../units/unit";

describe("ArtifactItem", () => {
  let mockUnit: Unit;

  beforeEach(() => {
    mockUnit = new Unit();
  });

  describe("constructor", () => {
    it("should handle artifact with empty bonusAffixes", () => {
      expect(() => {
        new ArtifactItem({
          level: 40,
          name: "Test Artifact",
          unit: mockUnit,
          attributes: {
            namePrefix: {
              type: ArtifactAttributeType.DamageAsLightning,
              magnitude: 0.5
            },
            namePostfix: {
              type: ArtifactAttributeType.DamageAsFire,
              magnitude: 0.5
            },
            bonusAffixes: []
          }
        });
      }).not.toThrow();
    });

    it("should handle artifact with bonusAffixes", () => {
      expect(() => {
        new ArtifactItem({
          level: 40,
          name: "Test Artifact",
          unit: mockUnit,
          attributes: {
            namePrefix: {
              type: ArtifactAttributeType.DamageAsLightning,
              magnitude: 0.5
            },
            namePostfix: {
              type: ArtifactAttributeType.DamageAsFire,
              magnitude: 0.5
            },
            bonusAffixes: [{
              type: ArtifactAttributeType.DamageAsLightning,
              magnitude: 0.5
            }]
          }
        });
      }).not.toThrow();
    });

    it("should handle artifact with all attribute types", () => {
      expect(() => {
        new ArtifactItem({
          level: 40,
          name: "Test Artifact",
          unit: mockUnit,
          attributes: {
            namePrefix: {
              type: ArtifactAttributeType.DamageAsLightning,
              magnitude: 0.5
            },
            namePostfix: {
              type: ArtifactAttributeType.DamageAsFire,
              magnitude: 0.5
            },
            titlePrefix: {
              type: ArtifactAttributeType.BonusStrength,
              magnitude: 1.2
            },
            titlePostfix: {
              type: ArtifactAttributeType.BonusIntelligence,
              magnitude: 1.2
            },
            bonusAffixes: [{
              type: ArtifactAttributeType.DamageAsLightning,
              magnitude: 0.5
            }]
          }
        });
      }).not.toThrow();
    });

    it("should handle artifact with undefined optional attributes", () => {
      expect(() => {
        new ArtifactItem({
          level: 40,
          name: "Test Artifact",
          unit: mockUnit,
          attributes: {
            namePrefix: {
              type: ArtifactAttributeType.DamageAsLightning,
              magnitude: 0.5
            },
            namePostfix: {
              type: ArtifactAttributeType.DamageAsFire,
              magnitude: 0.5
            },
            bonusAffixes: []
          }
        });
      }).not.toThrow();
    });
  });
});
