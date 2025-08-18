import { InventoryItemType, ArtifactAttributeType } from "types/graphql";

import { Unit } from "./unit";
import { InventoryItem } from "../items/inventory-item";

function baseCurve(level: number): number {
  const increasedBaseDamage = 20;
  return Math.round(
    Math.max(1, Math.pow(1.05, level) * level * 8 + increasedBaseDamage),
  );
}

describe("Unit.getBaseDamage applies weapon built-ins exactly once", () => {
  it("no built-ins -> base curve only", () => {
    const unit = new Unit();
    const level = 10;
    const item = new InventoryItem({
      unit,
      level,
      type: InventoryItemType.MeleeWeapon,
      item: {
        level,
        id: "dummy",
        name: "dummy",
        owner: "dummy",
        baseItem: "dummy",
        type: InventoryItemType.MeleeWeapon,
        builtIns: [],
      },
    });
    unit.equipment.push(item);

    const expected = baseCurve(level);
    const actual = unit.getBaseDamage(false);
    expect(actual).toBeCloseTo(expected, 10);
  });

  it("flat only", () => {
    const unit = new Unit();
    const level = 10;
    const flat = 7;
    const item = new InventoryItem({
      level,
      unit,
      type: InventoryItemType.MeleeWeapon,

      item: {
        level,
        id: "dummy",
        name: "dummy",
        owner: "dummy",
        baseItem: "dummy",
        type: InventoryItemType.MeleeWeapon,
        builtIns: [
          { type: ArtifactAttributeType.ItemFlatDamage, magnitude: flat },
        ],
      },
    });
    unit.equipment.push(item);

    const expected = Math.max(1, baseCurve(level) + flat);
    const actual = unit.getBaseDamage(false);
    expect(actual).toBeCloseTo(expected, 10);
  });

  it("bonus only (as percent)", () => {
    const unit = new Unit();
    const level = 10;
    const bonus = 0.2;
    const item = new InventoryItem({
      level,
      unit,
      type: InventoryItemType.MeleeWeapon,
      item: {
        level,
        id: "dummy",
        name: "dummy",
        owner: "dummy",
        baseItem: "dummy",
        type: InventoryItemType.MeleeWeapon,
        builtIns: [
          { type: ArtifactAttributeType.ItemBonusDamage, magnitude: bonus },
        ],
      },
    });
    unit.equipment.push(item);

    const expected = Math.max(1, baseCurve(level) * (1 + bonus));
    const actual = unit.getBaseDamage(false);
    expect(actual).toBeCloseTo(expected, 10);
  });

  it("bonus + flat (applied once)", () => {
    const unit = new Unit();
    const level = 10;
    const bonus = 0.1;
    const flat = 5;
    const item = new InventoryItem({
      level,
      unit,
      type: InventoryItemType.MeleeWeapon,
      item: {
        level,
        id: "dummy",
        name: "dummy",
        owner: "dummy",
        baseItem: "dummy",
        type: InventoryItemType.MeleeWeapon,
        builtIns: [
          { type: ArtifactAttributeType.ItemBonusDamage, magnitude: bonus },
          { type: ArtifactAttributeType.ItemFlatDamage, magnitude: flat },
        ],
      },
    });
    unit.equipment.push(item);

    const expected = Math.max(1, baseCurve(level) * (1 + bonus) + flat);
    const actual = unit.getBaseDamage(false);
    expect(actual).toBeCloseTo(expected, 10);
  });
});
