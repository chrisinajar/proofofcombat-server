import {
  createStatStealModifiers,
  StatStealModifier,
} from "./stat-steal-modifier";
import { Unit } from "../units/unit";

describe("createStatStealModifiers", () => {
  it("works", () => {
    const attacker = new Unit();
    const victim = new Unit();

    attacker.baseValues.strength = 1000;
    victim.baseValues.strength = 1000;
    attacker.baseValues.dexterity = 1000;
    victim.baseValues.dexterity = 1000;
    attacker.baseValues.dexteritySteal = 1;

    attacker.name = "attacker";
    victim.name = "victim";

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    attacker.applyModifier(StatStealModifier, { strength: 0.1 });
    const result = createStatStealModifiers(attacker, victim);

    // console.log(result);

    expect(attacker.getModifiedValue("strength")).toBeGreaterThan(
      victim.getModifiedValue("strength"),
    );

    expect(attacker.getModifiedValue("strength")).toEqual(1100);
    expect(victim.getModifiedValue("strength")).toEqual(900);

    expect(attacker.getModifiedValue("dexterity")).toEqual(1000);
    expect(victim.getModifiedValue("dexterity")).toEqual(1000);
  });

  it("stacks multiplicitively for boost but diminishingly for reduction", () => {
    const attacker = new Unit();
    const victim = new Unit();

    attacker.baseValues.strength = 1000;
    victim.baseValues.strength = 1000;

    attacker.name = "attacker";
    victim.name = "victim";

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    attacker.applyModifier(StatStealModifier, { strength: 0.1 });
    attacker.applyModifier(StatStealModifier, { strength: 0.2 });
    const result = createStatStealModifiers(attacker, victim);

    // console.log(result);

    expect(attacker.getModifiedValue("strength")).toBeGreaterThan(
      victim.getModifiedValue("strength"),
    );

    const stealAmount = 320;
    expect(attacker.getModifiedValue("strength")).toEqual(
      Math.round(1000 * 1.1 * 1.2),
    );
    expect(victim.getModifiedValue("strength")).toEqual(
      Math.round(1000 * 0.9 * 0.8),
    );
  });
});

// createStatStealModifiers
