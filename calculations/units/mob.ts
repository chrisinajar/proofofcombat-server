import { HeroClasses, AttackType, HeroStats } from "types/graphql";
import { Unit } from "./unit";

type MonsterData = {
  class: HeroClasses;
  attackType: AttackType;
  level: number;
  name?: string;
  attributes: HeroStats;
  maxHealth: number;
};

export class Mob extends Unit {
  constructor(monsterData: MonsterData) {
    super();

    this.class = monsterData.class;
    this.attackType = monsterData.attackType;
    this.baseValues = {
      ...this.baseValues,
      ...monsterData.attributes,
      level: monsterData.level,
      health: monsterData.maxHealth,
    };
    // class: HeroClasses.Monster,
    // attackType: monster.attackType,
    // level: monster.level,
    // name: monster.name,
    // equipment: equipment
    //   ? createMonsterEquipment({ level: monster.level }, equipment)
    //   : createMonsterEquipment({ level: monster.level }),
    // damageReduction: monsterAttributes.constitution / 2,
    // attributes: monsterAttributes,
    // luck: createLuck(monsterAttributes.luck),
    // health: monster.combat.health,
    // maxHealth: monster.combat.maxHealth,
  }
}
