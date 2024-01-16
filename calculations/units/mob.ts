import {
  HeroClasses,
  AttackType,
  HeroStats,
  InventoryItemType,
} from "types/graphql";
import { Unit } from "./unit";
import { CombatantGear, CombatGear, QuestItem } from "../../combat/types";

type MonsterData = {
  class: HeroClasses;
  attackType: AttackType;
  level: number;
  name?: string;
  attributes: HeroStats;
  maxHealth: number;
  equipment: CombatantGear;
};

export class Mob extends Unit {
  constructor(monsterData: MonsterData) {
    super();

    this.class = monsterData.class;
    this.attackType = monsterData.attackType;

    Object.assign(this.baseValues, monsterData, monsterData.attributes);

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

    /*
        {
      armor: [
        { level: 32, type: 'BodyArmor' },
        { level: 32, type: 'HandArmor' },
        { level: 32, type: 'LegArmor' },
        { level: 32, type: 'HeadArmor' },
        { level: 32, type: 'FootArmor' }
      ],
      weapons: [ { level: 32 }, { level: 32 } ],
      quests: []
    }
    */

    monsterData.equipment.armor.forEach((armor) =>
      this.equipMonsterItem(armor, InventoryItemType.BodyArmor),
    );
    monsterData.equipment.weapons.forEach((weapon) =>
      this.equipMonsterItem(weapon, InventoryItemType.MeleeWeapon),
    );
    monsterData.equipment.quests.forEach((quest) =>
      this.equipMonsterItem(quest, InventoryItemType.Quest),
    );
  }

  equipMonsterItem(item: CombatGear | QuestItem, type: InventoryItemType) {
    return this.equipItem({
      level: 0,
      baseItem: "",
      name: "",
      type,
      ...item,
    });
  }
}
