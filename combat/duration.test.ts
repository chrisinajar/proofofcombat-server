import { executeFight } from "./fight";
import { createHeroCombatant } from "./hero";
import { createMonsterCombatant } from "./monster";
import { AttackType } from "types/graphql";
import Databases from "../db";

describe("combat duration tracking", () => {
  test("durationRemaining is 0 when duration exhausted", () => {
    const hero = Databases.hero.upgrade({ id: "h", name: "h" });
    const attacker = createHeroCombatant(hero, AttackType.Melee);
    const victim = createMonsterCombatant({
      id: "m",
      monster: {
        id: "mx",
        name: "mx",
        level: 1,
        attackType: AttackType.Melee,
        combat: { health: 10, maxHealth: 10 },
      },
      attackSpeedRemainder: 0,
    } as any);

    const result = executeFight(attacker, victim, 0);
    expect(result.durationRemaining).toBe(0);
  });
});
