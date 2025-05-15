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

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 },
    );
    const result = createStatStealModifiers(attacker, victim);

    expect(attacker.getModifiedValue("strength")).toBeGreaterThan(
      victim.getModifiedValue("strength"),
    );
  });

  it("stacks", () => {
    const attacker = new Unit();
    const victim = new Unit();

    attacker.baseValues.strength = 1000;
    victim.baseValues.strength = 1000;
    attacker.baseValues.dexterity = 1000;
    victim.baseValues.dexterity = 1000;

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 },
    );
    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.2 },
    );
    const result = createStatStealModifiers(attacker, victim);

    expect(attacker.getModifiedValue("strength")).toBeGreaterThan(
      victim.getModifiedValue("strength"),
    );
  });

  it("steals with diminishing returns", () => {
    const attacker = new Unit();
    const victim = new Unit();

    attacker.baseValues.strength = 1000;
    victim.baseValues.strength = 1000;
    attacker.baseValues.dexterity = 1000;
    victim.baseValues.dexterity = 1000;

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    // make sure 60% + 60% is not greater than 100%
    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.6 },
    );
    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.6 },
    );
    const result = createStatStealModifiers(attacker, victim);

    expect(victim.getModifiedValue("strength")).toBeGreaterThan(10);
  });

  it("applies symetrically", () => {
    const attacker = new Unit();
    const victim = new Unit();

    attacker.baseValues.strength = 1000;
    victim.baseValues.strength = 1000;
    attacker.baseValues.dexterity = 1000;
    victim.baseValues.dexterity = 1000;

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 },
    );
    victim.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 },
    );
    const victimModifier = createStatStealModifiers(attacker, victim);
    const attackerModifier = createStatStealModifiers(victim, attacker);

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );
  });

  it("applies symetrically even when its complicated", () => {
    const attacker = new Unit();
    const victim = new Unit();

    attacker.baseValues.strength = 1000;
    victim.baseValues.strength = 1000;
    attacker.baseValues.dexterity = 1000;
    victim.baseValues.dexterity = 1000;

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 },
    );
    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.15 },
    );
    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 },
    );
    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.35 },
    );
    victim.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.35 },
    );
    victim.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 },
    );
    victim.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.15 },
    );
    victim.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.1 },
    );
    const attackerModifier = createStatStealModifiers(victim, attacker);
    const victimModifier = createStatStealModifiers(attacker, victim);

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );
  });

  it("never fully drains a stat", () => {
    const attacker = new Unit();
    const victim = new Unit();

    attacker.baseValues.strength = 1000;
    victim.baseValues.strength = 1000;
    attacker.baseValues.dexterity = 1000;
    victim.baseValues.dexterity = 1000;

    expect(attacker.getModifiedValue("strength")).toEqual(
      victim.getModifiedValue("strength"),
    );

    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.99 },
    );
    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.99 },
    );
    attacker.applyModifier<StatStealModifier, StatStealModifierOptions>(
      StatStealModifier,
      { strength: 0.99 },
    );
    const result = createStatStealModifiers(attacker, victim);

    expect(victim.getModifiedValue("strength")).toBeGreaterThanOrEqual(200);
  });
});

// createStatStealModifiers
