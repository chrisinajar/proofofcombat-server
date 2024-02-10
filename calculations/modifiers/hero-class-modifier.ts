import { HeroClasses, AttackType } from "types/graphql";

import { Modifier, ModifierOptions } from "./modifier";

import { attributesForAttack } from "../../combat/constants";

import { Hero } from "../units/hero";

export class HeroClassModifier extends Modifier<undefined> {
  parent: Hero;

  constructor(options: ModifierOptions<undefined>) {
    super(options);

    const { parent } = options;

    if (!Hero.isHero(parent)) {
      throw new Error(
        `Hero class modifier applied to non-hero unit: ${parent.toString()}`,
      );
    }
    this.parent = parent;
  }

  getBonus(prop: string): number | void {
    if (prop === "bonusWeaponTiers") {
      switch (this.parent.class) {
        case HeroClasses.Daredevil:
          return Math.round(Math.random() * 3);

        case HeroClasses.EnragedBerserker:
        case HeroClasses.MasterWarlock:
        case HeroClasses.Gladiator:
        case HeroClasses.DemonHunter:
        case HeroClasses.MasterWizard:
        case HeroClasses.Zealot:
        case HeroClasses.Ranger:
          return 1;

        case HeroClasses.Archer:
          return 2;

        // everyone else
        default:
          break;
      }
      return;
    }
  }
  getMultiplier(prop: string): number | void {
    switch (this.parent.class) {
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
          return 1.7;
        }
        if (prop === "intelligence") {
          return 3 * 2;
        }
        if (prop === "wisdom") {
          return 1.7;
        }
        if (prop === "willpower") {
          return 1.5;
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
          return 1.7;
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
          return 3;
        }
        break;

      case HeroClasses.Ranger:
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
        (this.parent.class === HeroClasses.BattleMage ||
          this.parent.class === HeroClasses.DemonHunter))
    ) {
      if (
        prop === attackAttributes.toHit &&
        this.parent.hero.skills.attackingAccuracy
      ) {
        return Math.pow(1.05, this.parent.hero.skills.attackingAccuracy);
      }
      if (
        prop === attackAttributes.damage &&
        this.parent.hero.skills.attackingDamage
      ) {
        return Math.pow(1.05, this.parent.hero.skills.attackingDamage);
      }
    }

    if (
      this.parent.attackType === AttackType.Cast ||
      this.parent.attackType === AttackType.Smite ||
      this.parent.attackType === AttackType.Blood ||
      (this.parent.attackType === AttackType.Melee &&
        (this.parent.class === HeroClasses.BattleMage ||
          this.parent.class === HeroClasses.DemonHunter))
    ) {
      if (
        prop === attackAttributes.toHit &&
        this.parent.hero.skills.castingAccuracy
      ) {
        return Math.pow(1.05, this.parent.hero.skills.castingAccuracy);
      }
      if (
        prop === attackAttributes.damage &&
        this.parent.hero.skills.castingDamage
      ) {
        return Math.pow(1.05, this.parent.hero.skills.castingDamage);
      }
    }

    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}
