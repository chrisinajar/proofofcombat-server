import { HeroClasses, AttackType, HeroStance } from "types/graphql";

import { Modifier, ModifierOptions } from "./modifier";

import { attributesForAttack } from "../../combat/constants";
import type { Hero } from "../units/hero";

export class HeroStanceModifier extends Modifier<undefined> {
  parent: Hero;

  constructor(options: ModifierOptions<undefined>) {
    super(options);

    this.parent = options.parent as Hero;
  }

  getBonus(prop: string): number | void {
    const { activeStance } = this.parent.hero;

    switch (activeStance) {
      case HeroStance.Sunder:
        if (prop === "damageAsPhysical") {
          return 0.5;
        }
        break;

      // spells
      case HeroStance.Fire:
        if (prop === "damageAsFire") {
          return 0.2;
        }
        break;
      case HeroStance.Ice:
        if (prop === "damageAsIce") {
          return 0.2;
        }
        break;
      case HeroStance.Lightning:
        if (prop === "damageAsLightning") {
          return 0.2;
        }
        break;
    }
  }

  getMultiplier(prop: string): number | void {
    const victimAttributes = attributesForAttack(
      this.parent.opponent?.attackType ?? this.parent.attackType,
    );
    const attackAttributes = attributesForAttack(this.parent.attackType);
    const { activeStance } = this.parent.hero;

    switch (activeStance) {
      case HeroStance.Normal:
        break;
      case HeroStance.Reckless:
        if (prop === "bonusAccuracy") {
          return 2;
        }
        if (prop === "bonusDodge") {
          return 0.5;
        }
        break;
    }
  }
  getExtraBonus(prop: string): number | void {}
}
