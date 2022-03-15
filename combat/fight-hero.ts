import { AttackType, Hero, HeroClasses } from "types/graphql";
import { CombatResult } from "./types";
import { createHeroCombatant } from "./hero";
import { executeFight } from "./fight";

export async function fightHero(
  attacker: Hero,
  victim: Hero,
  attackType: AttackType
): Promise<CombatResult> {
  const attackerCombatant = createHeroCombatant(attacker, attackType);
  let victimAttackType = AttackType.Melee;

  switch (victim.class) {
    case HeroClasses.EnragedBerserker:
    case HeroClasses.Berserker:
    case HeroClasses.Gladiator:
    case HeroClasses.Fighter:
      victimAttackType = AttackType.Melee;
      break;
    case HeroClasses.Ranger:
    case HeroClasses.Archer:
      victimAttackType = AttackType.Ranged;
      break;
    case HeroClasses.Wizard:
    case HeroClasses.MasterWizard:
    case HeroClasses.Warlock:
    case HeroClasses.MasterWarlock:
      victimAttackType = AttackType.Cast;
      break;
    case HeroClasses.Paladin:
    case HeroClasses.Zealot:
      victimAttackType = AttackType.Smite;
      break;
    case HeroClasses.BattleMage:
    case HeroClasses.DemonHunter:
      victimAttackType = AttackType.Cast;
      break;
    case HeroClasses.BloodMage:
    case HeroClasses.Vampire:
      victimAttackType = AttackType.Blood;
      break;
  }
  const victimCombatant = createHeroCombatant(victim, victimAttackType);

  return executeFight(attackerCombatant, victimCombatant);
}
