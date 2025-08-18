import { InventoryItemType, EnchantmentType } from "types/graphql";
import { Unit } from "../units/unit";
import { InventoryItem } from "./inventory-item";

describe("legacy inventory item", () => {
  it("counter spells add up", () => {
    const baseUnit = new Unit();
    new InventoryItem({
      level: 2,
      type: InventoryItemType.Quest,
      item: {
        level: 2,
        baseItem: "some-item",
        id: "some-item",
        name: "some-item",
        owner: "hero",
        type: InventoryItemType.Quest,
        enchantment: EnchantmentType.CounterSpell,
      },
      unit: baseUnit,
    });

    expect(baseUnit.stats.counterSpell).toBe(1);
    new InventoryItem({
      level: 2,
      type: InventoryItemType.Quest,
      item: {
        level: 2,
        baseItem: "some-item",
        id: "some-item",
        name: "some-item",
        owner: "hero",
        type: InventoryItemType.Quest,
        enchantment: EnchantmentType.CounterSpell,
      },
      unit: baseUnit,
    });

    expect(baseUnit.stats.counterSpell).toBe(2);
  });
  it("pulls enchantments from base items", () => {
    const baseUnit = new Unit();
    new InventoryItem({
      level: 2,
      type: InventoryItemType.Quest,
      item: {
        level: 2,
        baseItem: "naga-scale",
        id: "naga-scale",
        name: "naga-scale",
        owner: "hero",
        type: InventoryItemType.Quest,
      },
      unit: baseUnit,
    });

    expect(baseUnit.stats.counterSpell).toBe(1);
  });
});
