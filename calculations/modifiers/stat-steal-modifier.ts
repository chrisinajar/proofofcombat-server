import { Modifier, ModifierOptions } from "./modifier";
import { Unit } from "../units/unit";

export function createStatStealModifiers(
  attacker: Unit,
  victim: Unit,
): {
  attackerModifier: StatStealAttackerModifier;
  victimModifier: StatStealVictimModifier;
} {
  const existingAttackerMod = attacker.modifiers.find(
    (mod) => mod instanceof StatStealAttackerModifier,
  );
  const existingVictimMod = victim.modifiers.find(
    (mod) => mod instanceof StatStealVictimModifier,
  );

  if (existingAttackerMod) {
    existingAttackerMod.remove();
  }
  if (existingVictimMod) {
    existingVictimMod.remove();
  }

  const victimModifier = victim.applyModifier(
    StatStealVictimModifier,
    {},
    attacker,
  );
  const attackerModifier = attacker.applyModifier(
    StatStealAttackerModifier,
    { victimModifier },
    attacker,
  );

  return {
    attackerModifier,
    victimModifier,
  };
}

export type StatStealVictimModifierOptions = {};

export class StatStealVictimModifier extends Modifier<StatStealVictimModifierOptions> {
  options: StatStealVictimModifierOptions;

  constructor(options: ModifierOptions<StatStealVictimModifierOptions>) {
    super(options);

    this.options = options.options;
  }

  getBonus(prop: string): number | void {
    return;
  }
  getMultiplier(prop: string): number | void {
    return;
  }
  getExtraBonus(prop: string): number | void {
    if (prop.endsWith("Steal")) {
      return;
    }
    const stealName = `${prop}Steal`;
    const attacker = this.source;
    if (!("getModifiedValue" in attacker)) {
      return;
    }
    const stolenAmount = attacker.getModifiedValue(stealName);
    if (!stolenAmount || stolenAmount === 1) {
      return;
    }

    const multipliedValue = attacker.getMultiplierValue(prop);
    return 0 - multipliedValue * (1 - stolenAmount);
    return;
  }
}

export type StatStealAttackerModifierOptions = {
  victimModifier: StatStealVictimModifier;
};

export class StatStealAttackerModifier extends Modifier<StatStealAttackerModifierOptions> {
  options: StatStealAttackerModifierOptions;

  constructor(options: ModifierOptions<StatStealAttackerModifierOptions>) {
    super(options);

    this.options = options.options;
  }

  getBonus(prop: string): number | void {
    return;
  }
  getMultiplier(prop: string): number | void {
    return;
  }
  getExtraBonus(prop: string): number | void {
    if (prop.endsWith("Steal")) {
      return;
    }
    const victimStolenAmount = this.options.victimModifier.getExtraBonus(prop);
    if (victimStolenAmount && victimStolenAmount < 0) {
      return 0 - victimStolenAmount;
    }
    return;
  }
}

export type StatStealModifierOptions = {
  [x in string]: number;
};

export class StatStealModifier extends Modifier<StatStealModifierOptions> {
  options: StatStealModifierOptions;

  constructor(options: ModifierOptions<StatStealModifierOptions>) {
    super(options);

    this.options = options.options;
    Object.keys(this.options).forEach((prop) => {
      const stealName = `${prop}Steal`;
      if (!this.parent.baseValues[stealName]) {
        this.parent.baseValues[stealName] = 1;
      }
    });
  }

  getBonus(prop: string): number | void {
    return;
  }
  getMultiplier(prop: string): number | void {
    if (!prop.endsWith("Steal")) {
      return;
    }
    const withoutSteal = prop.substr(0, prop.length - 5);
    if (this.options[withoutSteal]) {
      return 1 - this.options[withoutSteal];
    }
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}
