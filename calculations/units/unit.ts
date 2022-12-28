import { AttackType } from "types/graphql";

import "../modifiers/basic-hero-modifier";
import "../modifiers/basic-unit-modifier";

import { getModifierByName } from "../modifiers";

import type { Modifier } from "../modifiers/modifier";

declare global {
  interface ProxyConstructor {
    new <TSource extends object, TTarget extends object>(
      target: TSource,
      handler: ProxyHandler<TSource>
    ): TTarget;
  }
}

// order values are calculated
// base value
// add flat "bonus" values
// multiply by "amp" values
// filter

type BaseValues = {
  [x in string]: number;
};

type PotentialGetter =
  | undefined
  | {
      reentrancy?: {
        [x in string]?: boolean;
      };
      (name: string): number;
    };

export class Unit {
  modifiers: Modifier[] = [];
  baseValues: BaseValues = {};
  attackType: AttackType = AttackType.Melee;

  constructor() {
    this.baseValues = {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      willpower: 1,
      luck: 1,

      health: 1,
    };

    this.applyModifier("BasicUnitModifier");
  }

  applyModifier(name: string, source?: Unit) {
    if (!source) {
      source = this;
    }
    const ModifierType = getModifierByName(name);
    if (!ModifierType) {
      console.error("Tried to apply undefined modifier", name);
      return;
    }
    const modifier = new ModifierType({ parent: this, source, options: {} });
  }

  reduceModifiers(
    methodName: "getBonus" | "getMultiplier" | "getExtraBonus",
    propName: string,
    startingValue: number,
    combiner: (memo: number, val: number) => number
  ): number {
    return this.modifiers.reduce<number>((memo, val) => {
      const getter = val[methodName] as PotentialGetter;
      if (!getter) {
        return memo;
      }
      if (!getter.reentrancy || !getter.reentrancy[propName]) {
        getter.reentrancy = getter.reentrancy || {};
        getter.reentrancy[propName] = true;
        try {
          const result = Number(getter(propName));
          delete getter.reentrancy[propName];
          if (Number.isFinite(result) && !Number.isNaN(result)) {
            return combiner(memo, result);
          }
          // console.error("Reducing method", methodName, "failed!", result);
        } catch (e) {
          console.error("Reducing method", methodName, "failed!", e);
        } finally {
          delete getter.reentrancy[propName];
        }
      } else {
        console.error("Skipping getter for reentrancy", methodName, propName);
      }

      return memo;
    }, startingValue);
  }

  reduceModifiersAdditively(
    methodName: "getBonus" | "getMultiplier" | "getExtraBonus",
    propName: string,
    startingValue: number
  ): number {
    return this.reduceModifiers(
      methodName,
      propName,
      startingValue,
      (memo, val) => memo + val
    );
  }

  reduceModifiersMultiplicatively(
    methodName: "getBonus" | "getMultiplier" | "getExtraBonus",
    propName: string,
    startingValue: number
  ): number {
    return this.reduceModifiers(
      methodName,
      propName,
      startingValue,
      (memo, val) => memo * val
    );
  }

  getBaseValue(name: string): number {
    return this.reduceModifiersAdditively(
      "getBonus",
      name,
      this.baseValues[name] || 0
    );
  }

  getMultiplierValue(name: string): number {
    return this.reduceModifiersMultiplicatively("getMultiplier", name, 1);
  }

  getBonusValue(name: string): number {
    return this.reduceModifiersAdditively("getExtraBonus", name, 0);
  }

  getModifiedValue(name: string): number {
    const baseValue = this.getBaseValue(name);
    const bonusValue = this.getBonusValue(name);
    const amplitude = this.getMultiplierValue(name);

    const subValue = baseValue * amplitude + bonusValue;

    return subValue;
  }

  get stats() {
    // hero.combat.health = Math.round(
    //   (hero.stats.constitution * 20 + hero.level * 20) * bonusHealth
    // );
    return new Proxy<Unit, BaseValues>(this, {
      get(obj, prop: string) {
        return obj.getModifiedValue(prop);
      },
      set(obj, prop: string, value) {
        console.log("What are you trying to do?", prop);
        return false;
      },
    });
  }
}
