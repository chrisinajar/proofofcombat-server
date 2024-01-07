import { AttackType, HeroClasses } from "types/graphql";

import { BasicUnitModifier } from "../modifiers/basic-unit-modifier";

import { getModifierByName, ModifierClass } from "../modifiers";

import type { Modifier, ModifierOptions } from "../modifiers/modifier";
import type { Item } from "../items/item";

declare global {
  interface ProxyConstructor {
    new <TSource extends object, TTarget extends object>(
      target: TSource,
      handler: ProxyHandler<TSource>,
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
type PrecisionMap = {
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
  // list of currently applied modifiers
  modifiers: Modifier<any>[] = [];
  // unmodified "base" values
  baseValues: BaseValues = {};
  // all units attack, so all units have an attack type
  attackType: AttackType = AttackType.Melee;
  // class of the unit, anything that isn't a hero is a "monster"
  // though in the future i may make aberations their own class as well
  class: HeroClasses = HeroClasses.Monster;
  // a map of rounding precisions for any values
  precisions: PrecisionMap = {};

  constructor() {
    this.baseValues = {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      willpower: 1,
      luck: 1,

      percentageDamageIncrease: 1,
      percentageDamageReduction: 1,
      percentageEnchantmentDamageReduction: 1,
      bonusDodge: 1, // percent
      bonusAccuracy: 1, // percent
      bonusWeaponTiers: 0,
      bonusArmorTiers: 0,
      bonusShieldTiers: 0,
      mesmerizeChance: 1, // inverse percent
      focusChance: 1, // inverse percent
      lifesteal: 0,

      health: 0, // calculated by basic unit/hero modifier
    };

    this.precisions = {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      willpower: 1,
      luck: 1,

      health: 1, // calculated by basic unit/hero modifier
    };

    this.applyModifier(BasicUnitModifier, undefined);
  }

  applyModifier<T extends Modifier<O>, O>(
    ModifierType: new (o: ModifierOptions<O>) => T,
    options: O,
    source?: Unit | Item,
  ): T {
    if (!source) {
      source = this;
    }
    if (!ModifierType) {
      throw new Error("Tried to apply undefined modifier");
    }
    const modifier = new ModifierType({ parent: this, source, options });
    // this.modifiers.push(modifier);
    // not needed because modifier constructor calls `this.attachToUnit(options.parent);`
    return modifier;
  }

  removeModifier<T extends Modifier<O>, O>(modifier: T) {
    this.modifiers = this.modifiers.filter((m) => m !== modifier);
  }

  reduceModifiers(
    methodName: "getBonus" | "getMultiplier" | "getExtraBonus",
    propName: string,
    startingValue: number,
    combiner: (memo: number, val: number) => number,
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
    startingValue: number,
  ): number {
    return this.reduceModifiers(
      methodName,
      propName,
      startingValue,
      (memo, val) => memo + val,
    );
  }

  reduceModifiersMultiplicatively(
    methodName: "getBonus" | "getMultiplier" | "getExtraBonus",
    propName: string,
    startingValue: number,
  ): number {
    return this.reduceModifiers(
      methodName,
      propName,
      startingValue,
      (memo, val) => memo * val,
    );
  }

  getBaseValue(name: string): number {
    return this.reduceModifiersAdditively(
      "getBonus",
      name,
      this.baseValues[name] || 0,
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

    let subValue = baseValue * amplitude + bonusValue;

    if (this.precisions[name]) {
      subValue =
        Math.round(subValue / this.precisions[name]) * this.precisions[name];
    }

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
