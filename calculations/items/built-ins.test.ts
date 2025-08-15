import { ArtifactAttributeType, InventoryItemType } from "types/graphql";

import { Unit } from "../units/unit";
import { InventoryItem } from "./inventory-item";

describe("item built-ins", () => {
  it("applies flat and percent damage only to the specific weapon", () => {
    const unit = new Unit();

    // Weapon A with built-ins
    new InventoryItem({
      level: 10,
      baseItem: "weapon-a",
      type: InventoryItemType.MeleeWeapon,
      unit,
      builtIns: [
        { type: ArtifactAttributeType.ItemFlatDamage, magnitude: 10 },
        { type: ArtifactAttributeType.ItemBonusDamage, magnitude: 0.2 }, // +20%
      ],
    });

    // Weapon B without built-ins
    new InventoryItem({
      level: 10,
      baseItem: "weapon-b",
      type: InventoryItemType.MeleeWeapon,
      unit,
    });

    const baseA = unit.getBaseDamage(false);
    const baseB = unit.getBaseDamage(true);

    // With identical level, baseA should be strictly greater due to built-ins
    expect(baseA).toBeGreaterThan(baseB);
  });

  it("applies built-in armor modifiers to that piece only", () => {
    const unit = new Unit();
    const startingArmor = unit.stats.armor;

    new InventoryItem({
      level: 10,
      baseItem: "armor-a",
      type: InventoryItemType.BodyArmor,
      unit,
      builtIns: [
        { type: ArtifactAttributeType.ItemFlatArmor, magnitude: 25 },
        { type: ArtifactAttributeType.ItemBonusArmor, magnitude: 0.1 }, // +10%
      ],
    });

    const afterArmor = unit.stats.armor;
    expect(afterArmor).toBeGreaterThan(startingArmor);
  });
});

