import {
  ArtifactAttributeType,
  AttackType,
  HeroClasses,
  InventoryItem as InventoryItemData,
  ArtifactItem as ArtifactItemType,
  EnchantmentType,
  InventoryItemType,
} from "types/graphql";

import { BasicUnitModifier } from "../modifiers/basic-unit-modifier";
import { ModifierClass } from "../modifiers";
import {
  ModifierDefinition,
  applyAttackModifiers,
  applyCounterSpells,
} from "../modifiers/enchantments";
import { createStatStealModifiers } from "../modifiers/stat-steal-modifier";

import { InventoryItem } from "../items/inventory-item";
import { ArtifactItem } from "../items/artifact-item";

import type { Item } from "../items/item";
import type {
  Modifier,
  ModifierOptions,
  ModifierPersistancyData,
  OptionsForModifier,
} from "../modifiers/modifier";
import { attributesForAttack } from "../../combat/constants";
import { getItemPassiveUpgradeTier } from "../../combat/item-helpers";
import { calculateRating } from "../../maths";
import { weaponDamageWithBuiltIns } from "../../schema/items/helpers";

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
type ClampsMap = {
  [x in string]: [number, number];
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
  clamps: ClampsMap = {};
  equipment: Item[] = [];
  opponent?: Unit;

  constructor() {
    this.baseValues = {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      willpower: 1,
      luck: 1,

      strengthSteal: 1,
      dexteritySteal: 1,
      constitutionSteal: 1,
      intelligenceSteal: 1,
      wisdomSteal: 1,
      willpowerSteal: 1,
      luckSteal: 1,

      strengthMultiplier: 0,
      dexterityMultiplier: 0,
      constitutionMultiplier: 0,
      intelligenceMultiplier: 0,
      wisdomMultiplier: 0,
      willpowerMultiplier: 0,
      luckMultiplier: 0,

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
      // legacy: previously used to randomize ranged "second attack" chance
      rangedSecondAttackChance: 1, // inverse percent (unused for combat now)
      // new: multiplicative speed factor for ranged single-attack cadence
      // 1 = base, higher = faster (clamped by combat to not exceed base cadence)
      rangedAttackSpeedMultiplier: 1,

      health: 0, // calculated by basic unit/hero modifier

      counterSpell: 0,

      // Blight = 'Blight',
      // Enchantment = 'Enchantment',
      // Fire = 'Fire',
      // Holy = 'Holy',
      // Ice = 'Ice',
      // Lightning = 'Lightning',
      // Magical = 'Magical',
      // Physical = 'Physical'

      // damage conversion
      damageAsBlight: 0,
      damageAsFire: 0,
      damageAsHoly: 0,
      damageAsIce: 0,
      damageAsLightning: 0,
      damageAsMagical: 0,
      damageAsPhysical: 0,

      // damage resistance
      blightResistance: 0,
      fireResistance: 0,
      holyResistance: 0,
      iceResistance: 0,
      lightningResistance: 0,
      magicalResistance: 0,
      physicalResistance: 0,

      maxPhysicalResistance: 0.8,
      maxMagicalResistance: 0.8,
      maxFireResistance: 0.8,
      maxIceResistance: 0.8,
      maxLightningResistance: 0.8,
      maxHolyResistance: 0.8,
      maxBlightResistance: 0.8,

      // armor manipulation
      percentageArmorReduction: 1,

      // base damage shenanigans
      increasedBaseDamage: 20,
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

      attackRating: 1,
      evasionRating: 1,
      armor: 1,
    };

    this.clamps = {
      strength: [1, Infinity],
      dexterity: [1, Infinity],
      constitution: [1, Infinity],
      intelligence: [1, Infinity],
      wisdom: [1, Infinity],
      willpower: [1, Infinity],
      luck: [1, Infinity],
      health: [1, Infinity],

      strengthSteal: [0, 1],
      dexteritySteal: [0, 1],
      constitutionSteal: [0, 1],
      intelligenceSteal: [0, 1],
      wisdomSteal: [0, 1],
      willpowerSteal: [0, 1],
      luckSteal: [0, 1],

      physicalResistance: [-Infinity, 1],
      magicalResistance: [-Infinity, 1],
      fireResistance: [-Infinity, 1],
      iceResistance: [-Infinity, 1],
      lightningResistance: [-Infinity, 1],
      holyResistance: [-Infinity, 1],
      blightResistance: [-Infinity, 1],

      maxPhysicalResistance: [0, 1],
      maxMagicalResistance: [0, 1],
      maxFireResistance: [0, 1],
      maxIceResistance: [0, 1],
      maxLightningResistance: [0, 1],
      maxHolyResistance: [0, 1],
      maxBlightResistance: [0, 1],

      // ensure speed multiplier stays sane
      rangedAttackSpeedMultiplier: [1, Infinity],
    };

    this.applyModifier(BasicUnitModifier, undefined);
  }

  getPersistentModifiers(): ModifierPersistancyData<any>[] {
    return this.modifiers
      .map((modifier) => modifier.isPersistent())
      .filter(
        (
          persistency: false | ModifierPersistancyData<any>,
        ): persistency is ModifierPersistancyData<any> => !!persistency,
      );
  }

  enterCombat(victim: Unit) {
    this.opponent = victim;
    victim.opponent = this;

    // we call of these in both directions to make sure all buffs/debuffs are applied
    createStatStealModifiers(this, victim);
    createStatStealModifiers(victim, this);

    applyAttackModifiers(this, victim);
    applyAttackModifiers(victim, this);

    // this one has built in symmetry so we only need to call it once
    applyCounterSpells(this, victim);
  }

  equipArtifact(
    artifact: ArtifactItemType | null | undefined,
    enabledAffixes?: ArtifactAttributeType[] | undefined,
  ) {
    if (!artifact) {
      return;
    }
    const itemInstance = new ArtifactItem({
      level: artifact.level,
      name: artifact.name,
      unit: this,
      attributes: artifact.attributes,
      enabledAffixes,
    });
  }

  equipItem(item: InventoryItemData | null | undefined) {
    if (!item) {
      return;
    }

    const itemInstance = new InventoryItem({
      level: item.level,
      name: item.name,
      type: item.type,
      item,
      unit: this,
    });

    this.equipment.push(itemInstance);
  }

  applyModifier<T extends Modifier<O>, O>(
    modifierDefinition: ModifierDefinition<T>,
    source?: Unit | Item,
    _unused?: void,
    _unused2?: void,
  ): T;
  applyModifier<T extends Modifier<O>, O>(
    ModifierType: new (o: ModifierOptions<O>) => T,
    options: O,
    source?: Unit | Item,
    enchantment?: EnchantmentType,
  ): T;

  applyModifier<T extends Modifier<O>, O>(
    definitionOrClass: unknown,
    sourceOrOptions: unknown,
    voidOrSource: unknown,
    voidOrEnchantment: unknown,
  ): Modifier<O> {
    if (typeof definitionOrClass === "function") {
      const ModifierType = definitionOrClass as new (
        o: ModifierOptions<O>,
      ) => T;
      const options = sourceOrOptions as O;
      let source = voidOrSource as Unit | Item | undefined;
      const enchantment = voidOrEnchantment as EnchantmentType | undefined;

      if (!source) {
        source = this;
      }
      if (!ModifierType) {
        throw new Error("Tried to apply undefined modifier");
      }
      const modifier = new ModifierType({
        parent: this,
        source,
        options,
        enchantment,
      });
      // this.modifiers.push(modifier);
      // not needed because modifier constructor calls `this.attachToUnit(options.parent);`
      return modifier;
    }

    const modifierDefinition = definitionOrClass as ModifierDefinition<T>;
    const source = sourceOrOptions as Unit | Item | undefined;

    return this.applyModifier(
      modifierDefinition.type,
      modifierDefinition.options,
      source,
      modifierDefinition.enchantment,
    );
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
    return this.modifiers
      .filter((modifier) => !modifier.isDisabled())
      .reduce<number>((memo, val) => {
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

  getBaseDamage(isSecondAttack: boolean = false): number {
    let hasFoundFirstWeapon = false;
    const weapon = this.equipment.find((item) => {
      if (!item.isWeapon()) {
        return false;
      }
      if (!isSecondAttack) {
        return true;
      } else if (!hasFoundFirstWeapon) {
        hasFoundFirstWeapon = true;
        return false;
      }

      // is second attack and has found first weapon
      return true;
    });

    const increasedBaseDamage = this.stats.increasedBaseDamage;

    if (!weapon || !(weapon instanceof InventoryItem)) {
      if (isSecondAttack) {
        return 0;
      }
      return 1 + increasedBaseDamage;
    }

    return weaponDamageWithBuiltIns(weapon.item, increasedBaseDamage) ?? 0;
  }

  getBaseValue(name: string): number {
    switch (name) {
      case "attackRating":
        const accuracyStatName = attributesForAttack(this.attackType).toHit;
        let accuracyStat = this.stats[accuracyStatName];
        if (
          this.class === HeroClasses.DemonHunter ||
          this.class === HeroClasses.BattleMage
        ) {
          let otherAccStat = 0;
          if (this.attackType === AttackType.Melee) {
            const otherAttackAttributes = attributesForAttack(AttackType.Cast);
            otherAccStat = this.stats[otherAttackAttributes.toHit];
          } else if (this.attackType === AttackType.Cast) {
            const otherAttackAttributes = attributesForAttack(AttackType.Melee);
            otherAccStat = this.stats[otherAttackAttributes.toHit];
          }
          accuracyStat += 0.5 * otherAccStat;
        }

        if (
          this.class === HeroClasses.Gambler ||
          this.class === HeroClasses.Daredevil
        ) {
          accuracyStat += Math.random() * this.stats.luck;
        }

        return calculateRating(accuracyStat);

      case "evasionRating":
        const attackType = this.opponent
          ? this.opponent.attackType
          : this.attackType;

        const evasionStatName = attributesForAttack(attackType).dodge;
        let evasionStat = this.stats[evasionStatName];

        if (
          this.class === HeroClasses.Gambler ||
          this.class === HeroClasses.Daredevil
        ) {
          evasionStat += Math.random() * this.stats.luck;
        }

        return calculateRating(evasionStat);
    }

    return this.baseValues[name] ?? 0;
  }

  getBonusValue(name: string): number {
    return this.reduceModifiersAdditively(
      "getBonus",
      name,
      this.getBaseValue(name),
    );
  }

  getMultiplierModifier(name: string): number {
    return this.reduceModifiersMultiplicatively("getMultiplier", name, 1);
  }

  getBonusModifier(name: string): number {
    return this.reduceModifiersAdditively("getExtraBonus", name, 0);
  }

  getMultiplierValue(name: string): number {
    const baseValue = this.getBonusValue(name);
    const amplitude = this.getMultiplierModifier(name);

    let subValue = baseValue * amplitude;

    return this.roundModifiedValue(name, subValue);
  }

  getModifiedValue(name: string): number {
    const baseValue = this.getBonusValue(name);
    const amplitude = this.getMultiplierModifier(name);
    const bonusValue = this.getBonusModifier(name);

    let subValue = baseValue * amplitude + bonusValue;

    return this.roundModifiedValue(name, subValue);
  }

  roundModifiedValue(name: string, value: number): number {
    if (this.precisions[name]) {
      value = Math.round(value / this.precisions[name]) * this.precisions[name];
    }

    if (this.clamps[name]) {
      return Math.min(
        this.clamps[name][1],
        Math.max(this.clamps[name][0], value),
      );
    }
    return value;
  }

  get stats() {
    // hero.combat.health = Math.round(
    //   (hero.stats.constitution * 20 + hero.level * 20) * bonusHealth
    // );
    const unit = this;
    return new Proxy<{}, BaseValues>(
      {},
      {
        get(obj, prop: string) {
          return unit.getModifiedValue(prop);
        },
        set(obj, prop: string, value) {
          console.log("What are you trying to do?", prop);
          return false;
        },
      },
    );
  }
}
