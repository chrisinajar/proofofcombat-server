import { AttackType, MonsterInstance, Hero } from "types/graphql";
import { CombatResult, Combatant } from "./types";
import { createHeroCombatant } from "./hero";
import { executeFight } from "./fight";
import { createMonsterCombatant } from "./monster";

export async function fightMonster(
  attacker: Hero,
  monsterInstance: MonsterInstance,
  attackType: AttackType,
  modifier?: (args: { attacker: Combatant; victim: Combatant }) => void,
): Promise<CombatResult> {
  const { monster, equipment } = monsterInstance;
  const attackerAttackType = attackType;
  const attackerCombatant = createHeroCombatant(attacker, attackerAttackType);

  const victimCombatant = createMonsterCombatant(monsterInstance);

  if (modifier) {
    modifier({ attacker: attackerCombatant, victim: victimCombatant });
  }

  return executeFight(attackerCombatant, victimCombatant);
}
