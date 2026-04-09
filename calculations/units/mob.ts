import {
  HeroClasses,
  AttackType,
  HeroStats,
  InventoryItemType,
} from "types/graphql";
import { Unit } from "./unit";
import { BasicMobModifier } from "../modifiers/basic-mob-modifier";
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

    this.applyModifier(BasicMobModifier, undefined);

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
    const level = "level" in item ? item.level : 0;
    return this.equipItem({
      owner: `mob${this.stats.level}`,
      id:
        "baseItem" in item && item.baseItem
          ? item.baseItem
          : `${type}-${level ?? 0}`,
      level,
      baseItem: "",
      name: "",
      type,
      imbue: "imbue" in item ? item.imbue : undefined,
      ...item,
    });
  }
}
