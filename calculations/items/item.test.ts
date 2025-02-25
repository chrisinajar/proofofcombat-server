import { Item } from "./item";
import { Unit } from "../units/unit";
import { AttackType, HeroClasses } from "types/graphql";

describe("item base class", () => {
  it("creates an item with a properly initialized unit", () => {
    const unit = new Unit();
    
    // The Unit constructor already initializes base stats
    // We can override specific values if needed for testing
    unit.baseValues.level = 1;
    unit.baseValues.gold = 0;
    unit.baseValues.experience = 0;

    // Set attack type and class
    unit.attackType = AttackType.Melee;
    unit.class = HeroClasses.Monster;

    const item = new Item({
      level: 3,
      unit,
    });

    expect(item).toBeTruthy();
    expect(item.level).toBe(3);
    expect(item.unit).toBe(unit);
  });
});
