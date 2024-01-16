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
  it("counter spells add up", () => {
    const baseUnit = new Unit();
    new InventoryItem({
      level: 2,
      baseItem: "some-item",
      type: InventoryItemType.Quest,
      enchantment: EnchantmentType.CounterSpell,
      unit: baseUnit,
    });

    expect(baseUnit.stats.counterSpell).toBe(1);
    new InventoryItem({
      level: 2,
      baseItem: "some-item",
      type: InventoryItemType.Quest,
      enchantment: EnchantmentType.CounterSpell,
      unit: baseUnit,
    });

    expect(baseUnit.stats.counterSpell).toBe(2);
  });
  it("pulls enchantments from base items", () => {
    const baseUnit = new Unit();
    new InventoryItem({
      level: 2,
      baseItem: "naga-scale",
      type: InventoryItemType.Quest,
      unit: baseUnit,
    });

    expect(baseUnit.stats.counterSpell).toBe(1);
  });
});
