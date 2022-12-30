import { Hero as HeroData, HeroClasses, AttackType } from "types/graphql";

import "../modifiers/basic-hero-modifier";
import "../modifiers/hero-class-modifier";

import { Unit } from "./unit";

export class Hero extends Unit {
  hero: HeroData;

  constructor(hero: HeroData) {
    super();

    this.baseValues = {
      ...this.baseValues,
      ...hero.stats,
      ...hero.skills,
      health: hero.combat.maxHealth,
      level: hero.level,
    };

    this.hero = hero;
    this.class = hero.class;

    switch (hero.class) {
      case HeroClasses.Zealot:
      case HeroClasses.Paladin:
        this.attackType = AttackType.Smite;
        break;

      case HeroClasses.Vampire:
      case HeroClasses.BloodMage:
        this.attackType = AttackType.Blood;
        break;

      case HeroClasses.Ranger:
      case HeroClasses.Archer:
        this.attackType = AttackType.Ranged;
        break;

      case HeroClasses.Warlock:
      case HeroClasses.MasterWarlock:
      case HeroClasses.Wizard:
      case HeroClasses.MasterWizard:
      case HeroClasses.DemonHunter:
      case HeroClasses.BattleMage:
        this.attackType = AttackType.Cast;
        break;

      case HeroClasses.Monster:
      case HeroClasses.Gladiator:
      case HeroClasses.JackOfAllTrades:
      case HeroClasses.Gambler:
      case HeroClasses.Fighter:
      case HeroClasses.EnragedBerserker:
      case HeroClasses.Daredevil:
      case HeroClasses.Berserker:
      case HeroClasses.Adventurer:
        this.attackType = AttackType.Melee;
        break;
    }

    this.applyModifier("BasicHeroModifier");
    this.applyModifier("HeroClassModifier");

    // console.log("hero creator!", this.hero.class, this.attackType);
  }
}
