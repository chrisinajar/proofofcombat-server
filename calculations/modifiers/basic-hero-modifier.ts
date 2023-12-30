import { HeroClasses, AttackType } from "types/graphql";

import { Modifier, ModifierOptions } from "./modifier";
import { registerModifier } from "./index";

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
    }
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

    // resilience: 0,
    // regeneration: 0,
    return;
  }
  getExtraBonus(prop: string): number | void {
    return;
  }
}

registerModifier("BasicHeroModifier", BasicHeroModifier);
