import { AttackType, MonsterInstance, Hero } from "types/graphql";
import { CombatResult } from "./types";
import { createHeroCombatant } from "./hero";
import { executeFight } from "./fight";
import { createMonsterCombatant } from "./monster";

export async function fightMonster(
  attacker: Hero,
  monsterInstance: MonsterInstance,
  attackType: AttackType,
): Promise<CombatResult> {
  const { monster, equipment } = monsterInstance;
  const attackerAttackType = attackType;
  const attackerCombatant = createHeroCombatant(attacker, attackerAttackType);

  const victimCombatant = createMonsterCombatant(monsterInstance, equipment);

  return executeFight(attackerCombatant, victimCombatant);
}
