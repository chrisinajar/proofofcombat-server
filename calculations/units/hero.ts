import { Hero as HeroData, HeroClasses, AttackType } from "types/graphql";

import { BasicHeroModifier } from "../modifiers/basic-hero-modifier";
import { HeroClassModifier } from "../modifiers/hero-class-modifier";
import { GenericArmorModifier } from "../modifiers/generic-armor-modifier";

import { Unit } from "./unit";

export class Hero extends Unit {
  hero: HeroData;

  constructor(hero: HeroData) {
    super();

    Object.assign(this.baseValues, hero.stats, hero.skills, {
      health: hero.combat.maxHealth,
      level: hero.level,
    });

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

    this.applyModifier(BasicHeroModifier, undefined);
    this.applyModifier(HeroClassModifier, undefined);

    // this.applyModifier(GenericArmorModifier, { tier: 3 });
    ///@TODO iterate over equipment and quest items to apply appropriate modifiers, apply class based modifiers to change all their things

    console.log("hero creator!", this.hero.class, this.attackType);
    console.log(this.hero.equipment);
  }
}
