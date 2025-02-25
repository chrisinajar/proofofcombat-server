import {
  createStatStealModifiers,
  StatStealModifier,
  StatStealModifierOptions,
} from "./stat-steal-modifier";
import { Unit } from "../units/unit";
import { ModifierDefinition } from "./enchantments";

describe("createStatStealModifiers", () => {
  it("works", () => {
    const attacker = new Unit();
    const victim = new Unit();

    attacker.baseValues.strength = 1000;
    victim.baseValues.strength = 1000;
    attacker.baseValues.dexterity = 1000;
    victim.baseValues.dexterity = 1000;
    attacker.baseValues.dexteritySteal = 1;

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 }
    );
    const result = createStatStealModifiers(attacker, victim);

    expect(attacker.getModifiedValue("strength")).toBeGreaterThan(
      victim.getModifiedValue("strength")
    );
  });

  it("stacks", () => {
    const attacker = new Unit();
    const victim = new Unit();

    attacker.baseValues.strength = 1000;
    victim.baseValues.strength = 1000;
    attacker.baseValues.dexterity = 1000;
    victim.baseValues.dexterity = 1000;
    attacker.baseValues.dexteritySteal = 1;

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 }
    );
    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.2 }
    );
    const result = createStatStealModifiers(attacker, victim);

    expect(attacker.getModifiedValue("strength")).toBeGreaterThan(
      victim.getModifiedValue("strength")
    );
  });
});

// createStatStealModifiers
