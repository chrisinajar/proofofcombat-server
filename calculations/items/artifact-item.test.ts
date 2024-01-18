import { ArtifactAttributeType } from "types/graphql";
import { ArtifactItem } from "./artifact-item";
import { Unit } from "../units/unit";

describe("artifact items", () => {
  it("should apply buufs", () => {
    const baseUnit = new Unit();
    baseUnit.baseValues.strength = 100;
    baseUnit.baseValues.dexterity = 100;
    const artifactItem = new ArtifactItem({
      unit: baseUnit,
      name: "Artifact Item",
      level: 4,
      attributes: {
        namePrefix: {
          type: ArtifactAttributeType.BonusDexterity,
          magnitude: 1.2,
        },
        namePostfix: {
          type: ArtifactAttributeType.BonusStrength,
          magnitude: 1.2,
        },
        titlePrefix: undefined,
        titlePostfix: undefined,

        bonusAffixes: [],
      },
    });
    expect(baseUnit.stats.strength).toEqual(
      Math.round(baseUnit.baseValues.strength * 1.2),
    );
  });
});
