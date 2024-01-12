import { Modifier, ModifierOptions } from "./modifier";
import { Unit } from "../units/unit";

export function createStatStealModifiers(
  attacker: Unit,
  victim: Unit,
  attribute: string,
  percent: number,
): {
  attackerModifier: {
    type: StatStealAttackerModifier;
    options: StatStealAttackerModifierOptions;
  };
  victimModifier: {
    type: StatStealVictimModifier;
    options: StatStealVictimModifierOptions;
  };
} {
  const attackerModifier = new StatStealAttackerModifier();
  const victimModifier = new StatStealVictimModifier();

  return {
    attackerModifier: {
      type: StatStealAttackerModifier,
      options: {
        attribute,
        percent,
      },
    },
    victimModifier: {
      type: StatStealVictimModifier,
      options: {
        attribute,
        percent,
      },
    },
  };
}

export type StatStealVictimModifierOptions = {};

export class StatStealVictimModifier extends Modifier<StatStealVictimModifierOptions> {
  options: StatStealVictimModifierOptions;

  constructor(options: ModifierOptions<StatStealVictimModifierOptions>) {
    super(options);

    this.options = options;
  }
}

export type StatStealAttackerModifierOptions = {};

export class StatStealAttackerModifier extends Modifier<StatStealAttackerModifierOptions> {
  constructor(options: ModifierOptions<StatStealAttackerModifierOptions>) {
    super(options);
  }
}
