import { InventoryItemType, EnchantmentType } from "types/graphql";
import { Unit } from "../units/unit";
import { InventoryItem } from "./inventory-item";

describe("legacy inventory item", () => {
  it("armor items apply a modifier", () => {
    const baseUnit = new Unit();
    const before = baseUnit.modifiers.length;
    const item = new InventoryItem({
      level: 2,
      baseItem: "some-item",
      type: InventoryItemType.BodyArmor,
      unit: baseUnit,
    });

    expect(baseUnit.modifiers.length).toBeGreaterThan(before);
  });
});
