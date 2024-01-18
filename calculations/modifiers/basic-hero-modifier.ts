import { HeroClasses, AttackType } from "types/graphql";

import { Modifier, ModifierOptions } from "./modifier";

import { attributesForAttack } from "../../combat/constants";

import type { Hero } from "../units/hero";

export class BasicHeroModifier extends Modifier<undefined> {
  parent: Hero;

  constructor(options: ModifierOptions<undefined>) {
    super(options);

    this.parent = options.parent as Hero;
  }

  getBonus(prop: string): number | void {
    switch (prop) {
      case "health":
        // old code:
        // hero.combat.health = Math.round(
        //   (hero.stats.constitution * 20 + hero.level * 20) * bonusHealth
        // );
        return (
          (this.parent.stats.constitution + this.parent.stats.level) * 20 -
          this.parent.baseValues.health
        );
      // Math.pow(1.08, this.parent.stats.vitality)
      case "regeneration":
        // asympotically approach 0.0 -> 1.0
        return 1 - Math.pow(0.99, this.parent.hero.skills.regeneration);
        break;
    }
    return;
  }

  getMultiplier(prop: string): number | void {
    const attackAttributes = attributesForAttack(this.parent.attackType);

    if (this.parent.opponent) {
      const victimAttributes = attributesForAttack(
        this.parent.opponent.attackType,
      );

      if (prop === victimAttributes.damageReduction) {
        return Math.pow(1.05, this.parent.hero.skills.resilience);
      }
    }
    if (
      this.parent.attackType === AttackType.Melee ||
      this.parent.attackType === AttackType.Ranged ||
      (this.parent.attackType === AttackType.Cast &&
        (this.parent.class === HeroClasses.BattleMage ||
          this.parent.class === HeroClasses.DemonHunter))
    ) {
      if (prop === attackAttributes.toHit) {
        return Math.pow(1.05, this.parent.hero.skills.attackingAccuracy);
      }
      if (prop === attackAttributes.damage) {
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
      if (prop === attackAttributes.toHit) {
        return Math.pow(1.05, this.parent.hero.skills.castingAccuracy);
      }
      if (prop === attackAttributes.damage) {
        return Math.pow(1.05, this.parent.hero.skills.castingDamage);
      }
    }

    // vitality: 0,
    switch (prop) {
      case "health":
        if (!this.parent.stats.vitality) {
          return;
        }
        return Math.pow(1.08, this.parent.stats.vitality);
    }

    // resilience: 0,
    // regeneration: 0,
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}
