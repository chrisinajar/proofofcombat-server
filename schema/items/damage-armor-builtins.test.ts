import { ArtifactAttributeType, InventoryItemType } from "types/graphql";
import {
  weaponDamageWithBuiltIns,
  armorWithBuiltIns,
  computeBaseWeaponDamage,
  computeBaseArmor,
} from "./helpers";

describe("server helpers: built-ins apply correctly", () => {
  it("weaponDamageWithBuiltIns matches curve + built-ins", () => {
    const level = 12;
    const base = computeBaseWeaponDamage(level);
    const item: any = {
      level,
      type: InventoryItemType.MeleeWeapon,
      builtIns: [
        { type: ArtifactAttributeType.ItemBonusDamage, magnitude: 0.15 },
        { type: ArtifactAttributeType.ItemFlatDamage, magnitude: 9 },
      ],
    };
    const expected = Math.round(base * (1 + 0.15) + 9);
    const actual = weaponDamageWithBuiltIns(item);
    expect(actual).toBe(expected);
  });

  it("armorWithBuiltIns matches curve + built-ins for body armor", () => {
    const level = 14;
    const base = computeBaseArmor(level, "BodyArmor");
    const item: any = {
      level,
      type: InventoryItemType.BodyArmor,
      builtIns: [
        { type: ArtifactAttributeType.ItemBonusArmor, magnitude: 0.2 },
        { type: ArtifactAttributeType.ItemFlatArmor, magnitude: 7 },
      ],
    };
    const expected = Math.round(base * (1 + 0.2) + 7);
    const actual = armorWithBuiltIns(item);
    expect(actual).toBe(expected);
  });
});

