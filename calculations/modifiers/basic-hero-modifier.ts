import { HeroClasses, AttackType } from "types/graphql";

import { Modifier, ModifierOptions } from "./modifier";
import { registerModifier } from "./index";

import { attributesForAttack } from "../../combat/helpers";

import type { Hero } from "../units/hero";

class BasicHeroModifier extends Modifier {
  parent: Hero;

  constructor(options: ModifierOptions) {
    super(options);

    this.parent = options.parent as Hero;
  }

  getBonus(prop: string): number | void {
    return;
  }

  getMultiplier(prop: string): number | void {
    // vitality: 0,
    switch (prop) {
      case "health":
        if (!this.parent.stats.vitality) {
          return;
        }
        return Math.pow(1.08, this.parent.stats.vitality);
    }

    switch (this.parent.hero.class) {
      case HeroClasses.Adventurer:
        break;
      case HeroClasses.JackOfAllTrades:
        if (prop === "strength") {
          return 1.5;
        }
        if (prop === "dexterity") {
          return 1.5;
        }
        if (prop === "constitution") {
          return 1.5;
        }
        if (prop === "intelligence") {
          return 1.5;
        }
        if (prop === "wisdom") {
          return 1.5;
        }
        if (prop === "willpower") {
          return 1.5;
        }
        break;

      case HeroClasses.Daredevil:
        if (prop === "strength") {
          return 1.1 + Math.random();
        }
        if (prop === "dexterity") {
          return 1.2 + Math.random();
        }
        if (prop === "constitution") {
          return 1.1 + Math.random();
        }
        if (prop === "intelligence") {
          return 1.1 + Math.random();
        }
        if (prop === "wisdom") {
          return 1.2 + Math.random();
        }
        if (prop === "willpower") {
          return 1.1 + Math.random();
        }
        if (prop === "luck") {
          return 1.2 + Math.random();
        }
        if (prop === "bonusAccuracy") {
          return 2;
        }
        break;

      case HeroClasses.Gambler:
        if (prop === "strength") {
          return 1.1;
        }
        if (prop === "dexterity") {
          return 1.2;
        }
        if (prop === "constitution") {
          return 1.1;
        }
        if (prop === "intelligence") {
          return 1.1;
        }
        if (prop === "wisdom") {
          return 1.2;
        }
        if (prop === "willpower") {
          return 1.1;
        }
        if (prop === "luck") {
          return 1.2;
        }
        break;

      // melee
      case HeroClasses.EnragedBerserker:
        if (prop === "strength") {
          return 2 * 2;
        }
        if (prop === "dexterity") {
          return 2 * 1.3;
        }
        if (prop === "bonusAccuracy") {
          return 2;
        }
        break;

      case HeroClasses.Berserker:
        if (prop === "strength") {
          return 2;
        }
        if (prop === "dexterity") {
          return 1.3;
        }
        break;

      case HeroClasses.Gladiator:
        if (prop === "strength") {
          return 2 * 1.5;
        }
        if (prop === "dexterity") {
          return 2 * 1.3;
        }
        if (prop === "willpower") {
          return 1.2;
        }
        if (prop === "bonusAccuracy") {
          return 2;
        }
        break;

      case HeroClasses.Fighter:
        if (prop === "strength") {
          return 1.5;
        }
        if (prop === "dexterity") {
          return 1.3;
        }
        if (prop === "willpower") {
          return 1.2;
        }
        break;

      // casters
      case HeroClasses.MasterWizard:
        if (prop === "intelligence") {
          return 2 * 2;
        }
        if (prop === "wisdom") {
          return 2 * 1.3;
        }
        if (prop === "bonusAccuracy") {
          return 2;
        }
        break;

      case HeroClasses.Wizard:
        if (prop === "intelligence") {
          return 2;
        }
        if (prop === "wisdom") {
          return 1.3;
        }
        break;

      case HeroClasses.MasterWarlock:
        if (prop === "intelligence") {
          return 2 * 1.5;
        }
        if (prop === "wisdom") {
          return 2 * 1.3;
        }
        if (prop === "willpower") {
          return 1.2;
        }
        if (prop === "bonusAccuracy") {
          return 2;
        }
        break;

      case HeroClasses.Warlock:
        if (prop === "intelligence") {
          return 1.5;
        }
        if (prop === "wisdom") {
          return 1.3;
        }
        if (prop === "willpower") {
          return 1.2;
        }
        break;

      // mixed
      case HeroClasses.DemonHunter:
        if (prop === "strength") {
          return 3 * 2;
        }
        if (prop === "dexterity") {
          return 1.3 * 1.3;
        }
        if (prop === "intelligence") {
          return 3 * 2;
        }
        if (prop === "wisdom") {
          return 1.3 * 1.3;
        }
        if (prop === "willpower") {
          return 1.2 * 1.2;
        }
        if (prop === "bonusAccuracy") {
          return 2;
        }
        break;

      case HeroClasses.BattleMage:
        if (prop === "strength") {
          return 2;
        }
        if (prop === "dexterity") {
          return 1.3;
        }
        if (prop === "intelligence") {
          return 2;
        }
        if (prop === "wisdom") {
          return 1.3;
        }
        if (prop === "willpower") {
          return 1.2;
        }
        break;

      case HeroClasses.Zealot:
        if (prop === "willpower") {
          return 1.3 * 1.3;
        }
        if (prop === "wisdom") {
          return 2;
        }
        if (prop === "bonusAccuracy") {
          return 2;
        }
        break;

      case HeroClasses.Paladin:
        if (prop === "willpower") {
          return 1.3;
        }
        break;

      case HeroClasses.Archer:
        if (prop === "dexterity") {
          return 4 * 2;
        }
        break;

      case HeroClasses.Ranger:
        if (prop === "dexterity") {
          return 2;
        }
        break;

      case HeroClasses.Vampire:
        if (prop === "constitution") {
          return 1.5 * 1.2;
        }
        if (prop === "willpower") {
          return 1.5;
        }
        break;

      case HeroClasses.BloodMage:
        if (prop === "constitution") {
          return 1.2;
        }
        break;
    }

    const attackAttributes = attributesForAttack(this.parent.attackType);

    if (
      this.parent.attackType === AttackType.Melee ||
      this.parent.attackType === AttackType.Ranged ||
      (this.parent.attackType === AttackType.Cast &&
        (this.parent.hero.class === HeroClasses.BattleMage ||
          this.parent.hero.class === HeroClasses.DemonHunter))
    ) {
      if (
        prop === attackAttributes.toHit &&
        this.parent.stats.attackingAccuracy
      ) {
        return Math.pow(1.05, this.parent.stats.attackingAccuracy);
      }
      if (
        prop === attackAttributes.damage &&
        this.parent.stats.attackingDamage
      ) {
        return Math.pow(1.05, this.parent.stats.attackingDamage);
      }
    }

    if (
      this.parent.attackType === AttackType.Cast ||
      this.parent.attackType === AttackType.Smite ||
      this.parent.attackType === AttackType.Blood ||
      (this.parent.attackType === AttackType.Melee &&
        (this.parent.hero.class === HeroClasses.BattleMage ||
          this.parent.hero.class === HeroClasses.DemonHunter))
    ) {
      if (
        prop === attackAttributes.toHit &&
        this.parent.stats.castingAccuracy
      ) {
        return Math.pow(1.05, this.parent.stats.castingAccuracy);
      }
      if (prop === attackAttributes.damage && this.parent.stats.castingDamage) {
        return Math.pow(1.05, this.parent.stats.castingDamage);
      }
    }

    // resilience: 0,
    // regeneration: 0,
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}

registerModifier("BasicHeroModifier", BasicHeroModifier);
