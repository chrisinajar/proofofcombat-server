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
      case "health":
        if (!this.parent.stats.vitality) {
          return;
        }
        return Math.pow(1.08, this.parent.stats.vitality);
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
