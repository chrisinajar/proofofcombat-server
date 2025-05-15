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
    if (prop.endsWith("Multiplier")) {
      return;
    }
    const stealName = `${prop}Steal`;
    const attacker = this.source;
    if (!("getModifiedValue" in attacker)) {
      return;
    }
    // even though we get this as a modified value, it's a multiplier
    // the "steal" part is a percentage of the value being stolen
    // it's stored inversely, so a steal value of 10% is 0.9, 20% is 0.8, etc
    // it stacks diminishingly, so two 10% steals would be 0.9 * 0.9 = 0.81, not 0.8
    // this means steal can never reach 100%, and it's impossible to steal more than the original value
    const stolenAmount = attacker.getModifiedValue(stealName);
    if (!stolenAmount || stolenAmount >= 1) {
      return;
    }

    // (1 - stolenAmount) * 0.8;

    // get the value of the stat before any steals or other extra bonuses
    const attackerBaseValue = attacker.getMultiplierValue(prop);
    const myBaseValue = this.parent.getMultiplierValue(prop);
    // apply the steal percent to both and return the lesser one
    // we're returning a fixed negative number here, because the value is being stolen
    // the steal is a percent from 0 to 1, where 1 is nothing stolen and 0 is 100% steal
    return (
      0 - (1 - stolenAmount) * 0.8 * Math.min(attackerBaseValue, myBaseValue)
    );

    // return 0 - (1 - stolenAmount) * attackerBaseValue;
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
    if (prop.endsWith("Multiplier")) {
      const baseProp = prop.slice(0, -"Multiplier".length);
      if (this.options[baseProp]) {
        return this.options[baseProp];
      }
    }
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
