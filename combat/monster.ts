import {
  Monster,
  HeroStats,
  AttackType,
  HeroClasses,
  MonsterInstance,
  MonsterEquipment,
  InventoryItemType,
  CombatEntry,
} from "types/graphql";
import { CombatantGear, Combatant } from "./types";
import { createLuck, attributesForAttack } from "./helpers";

import { Mob } from "../calculations/units/mob";

function createMonsterStatsByLevel(level: number): HeroStats {
  return {
    strength: Math.ceil(Math.pow(1.37, level - 1) * 8) - 5,
    dexterity: Math.ceil(Math.pow(1.37, level - 1) * 8) - 5,
    constitution: Math.ceil(Math.pow(1.37, level - 1) * 8) - 5,
    intelligence: Math.ceil(Math.pow(1.37, level - 1) * 8) - 5,
    wisdom: Math.ceil(Math.pow(1.37, level - 1) * 8) - 5,
    willpower: Math.ceil(Math.pow(1.37, level - 1) * 8) - 5,
    luck: Math.ceil(Math.pow(1.37, level - 1) * 8) - 5,
  };
}

function createMonsterLuck(monster: Monster) {
  // damage spread
  const smallModifier =
    monster.combat.maxHealth / (monster.combat.maxHealth + 20);
  // critical
  const largeModifier =
    monster.combat.maxHealth / (monster.combat.maxHealth + 100);
  // super crit
  const ultraModifier =
    monster.combat.maxHealth / (monster.combat.maxHealth + 500);

  return { smallModifier, largeModifier, ultraModifier };
}

export function createMonsterEquipment(
  monster: Partial<Monster> & Pick<Monster, "level">,
  equipmentOverride?: MonsterEquipment | null,
): CombatantGear {
  if (equipmentOverride) {
    return {
      armor: [
        {
          level: equipmentOverride.bodyArmor.level,
          enchantment: equipmentOverride.bodyArmor.enchantment,
          type: InventoryItemType.BodyArmor,
          imbue: equipmentOverride.bodyArmor.imbue
        }, // bodyArmor
        {
          level: equipmentOverride.handArmor.level,
          enchantment: equipmentOverride.handArmor.enchantment,
          type: InventoryItemType.HandArmor,
          imbue: equipmentOverride.handArmor.imbue
        }, // handArmor
        {
          level: equipmentOverride.legArmor.level,
          enchantment: equipmentOverride.legArmor.enchantment,
          type: InventoryItemType.LegArmor,
          imbue: equipmentOverride.legArmor.imbue
        }, // legArmor
        {
          level: equipmentOverride.headArmor.level,
          enchantment: equipmentOverride.headArmor.enchantment,
          type: InventoryItemType.HeadArmor,
          imbue: equipmentOverride.headArmor.imbue
        }, // headArmor
        {
          level: equipmentOverride.footArmor.level,
          enchantment: equipmentOverride.footArmor.enchantment,
          type: InventoryItemType.FootArmor,
          imbue: equipmentOverride.footArmor.imbue
        }, // footArmor
      ],
      weapons: [
        {
          level: equipmentOverride.leftHand.level,
          enchantment: equipmentOverride.leftHand.enchantment,
        }, // leftHand
        {
          level: equipmentOverride.rightHand.level,
          enchantment: equipmentOverride.rightHand.enchantment,
        }, // rightHand
      ],
      quests: [],
    };
  }
  return {
    armor: [
      { level: monster.level * 1, type: InventoryItemType.BodyArmor }, // bodyArmor
      { level: monster.level * 1, type: InventoryItemType.HandArmor }, // handArmor
      { level: monster.level * 1, type: InventoryItemType.LegArmor }, // legArmor
      { level: monster.level * 1, type: InventoryItemType.HeadArmor }, // headArmor
      { level: monster.level * 1, type: InventoryItemType.FootArmor }, // footArmor
    ],
    weapons: [
      { level: monster.level * 1 }, // leftHand
      { level: monster.level * 1 }, // rightHand
    ],
    quests: [],
  };
}

export function createMonsterCombatant(
  monster: Omit<
    Partial<Monster>,
    "level" | "combat" | "name" | "attackType"
  > & {
    level: number;
    combat: { health: number; maxHealth: number };
    name: string;
    attackType: AttackType;
  },
  equipment?: MonsterEquipment | null,
): Combatant {
  const monsterAttributes = createMonsterStatsByLevel(monster.level);

  const combatData = {
    class: HeroClasses.Monster,
    attackType: monster.attackType,
    level: monster.level,
    name: monster.name,
    equipment: equipment
      ? createMonsterEquipment({ level: monster.level }, equipment)
      : createMonsterEquipment({ level: monster.level }),
    damageReduction: monsterAttributes.constitution / 2,
    attributes: monsterAttributes,
    luck: createLuck(monsterAttributes.luck),
    health: monster.combat.health,
    maxHealth: monster.combat.maxHealth,
  };

  const unit = new Mob(combatData);
  return {
    // pointless spread, why did i do that?
    ...combatData,
    unit,
  };
}
