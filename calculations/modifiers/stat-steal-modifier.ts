import { Modifier, ModifierOptions } from "./modifier";
import { Unit } from "../units/unit";

export function createStatStealModifiers(
  attacker: Unit,
  victim: Unit,
): {
  victimModifier: StatStealVictimModifier;
} {
  const existingVictimMod = victim.modifiers.find(
    (mod) => mod instanceof StatStealVictimModifier,
  );

  if (existingVictimMod) {
    existingVictimMod.remove();
  }

  const victimModifier = victim.applyModifier(
    StatStealVictimModifier,
    { isDebuff: true },
    attacker,
  );

  return {
    victimModifier,
  };
}

export type StatStealVictimModifierOptions = { isDebuff: boolean };

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
    if (!stolenAmount || stolenAmount <= 1) {
      return;
    }

    const multipliedValue = attacker.getMultiplierValue(prop);
    const preStealAmount = multipliedValue / stolenAmount;
    // preStealAmount is what the value would be if it weren't boosted from steals
    // backwards because we actually want the negative number
    return preStealAmount - multipliedValue;
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
    // give boost here..?
    if (this.options[prop]) {
      return 1 + this.options[prop];
    }
    if (!prop.endsWith("Steal")) {
      return;
    }
    const withoutSteal = prop.substr(0, prop.length - 5);
    if (this.options[withoutSteal]) {
      return 1 + this.options[withoutSteal];
    }
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}
