import { ForbiddenError, UserInputError } from "apollo-server";
import type { BaseContext } from "schema/context";
import { questEvents as graalText } from "../quests/text/graal-the-unbroken-text";
import { AttackType } from "types/graphql";
import { createHeroCombatant } from "../../combat/hero";
import { executeFight } from "../../combat/fight";

// Lightweight helpers
function isSameUTCDate(a: number, b: number): boolean {
  const ad = new Date(a);
  const bd = new Date(b);
  return (
    ad.getUTCFullYear() === bd.getUTCFullYear() &&
    ad.getUTCMonth() === bd.getUTCMonth() &&
    ad.getUTCDate() === bd.getUTCDate()
  );
}

async function getOrCreateLedger(context: BaseContext, heroId: string) {
  try {
    return await context.db.graal.get(heroId);
  } catch {
    const fresh = context.db.graal.createDefault(heroId);
    await context.db.graal.put(fresh);
    return fresh;
  }
}

function gateByTavernChampion(hero: any) {
  return !!hero?.questLog?.tavernChampion?.finished;
}

const resolvers: any = {
  Query: {
    async graalAvailable(
      _p: any,
      _a: any,
      context: BaseContext,
    ): Promise<boolean> {
      if (!context?.auth?.id) throw new ForbiddenError("Missing auth");
      const hero = await context.db.hero.get(context.auth.id);
      if (!gateByTavernChampion(hero)) return false;

      const ledger = await getOrCreateLedger(context, hero.id);
      if (!ledger.lastChallengedAt) return true;
      return !isSameUTCDate(ledger.lastChallengedAt, Date.now());
    },
    async graalLedger(_p: any, _a: any, context: BaseContext) {
      if (!context?.auth?.id) throw new ForbiddenError("Missing auth");
      const ledger = await getOrCreateLedger(context, context.auth.id);
      return {
        total: ledger.total,
        wins: ledger.wins,
        losses: ledger.losses,
        bestStreak: ledger.bestStreak,
        currentStreak: ledger.currentStreak,
        lastChallengedAt: ledger.lastChallengedAt
          ? new Date(ledger.lastChallengedAt).toISOString()
          : null,
        lastResult: ledger.lastResult ?? null,
      };
    },
  },
  Mutation: {
    async challengeGraal(_p: any, _a: any, context: BaseContext) {
      if (!context?.auth?.id) throw new ForbiddenError("Missing auth");
      const hero = await context.db.hero.get(context.auth.id);
      if (!gateByTavernChampion(hero)) {
        throw new UserInputError(
          "Graal ignores you. Become the Tavern Champion first.",
        );
      }

      const ledger = await getOrCreateLedger(context, hero.id);
      if (
        ledger.lastChallengedAt &&
        isSameUTCDate(ledger.lastChallengedAt, Date.now())
      ) {
        throw new UserInputError("You may only challenge Graal once per day.");
      }

      // Simulate a duel against an overtuned echo of the hero
      const seed = (hero.id.charCodeAt(0) + new Date().getUTCDate()) % 10;
      const attackType: AttackType = AttackType.Melee;
      const attacker = createHeroCombatant(hero, attackType);
      const victim = createHeroCombatant(hero, attackType);
      victim.name = "Graal's Echo";
      // Overtune + anti-build nudge: small global resistance/amp tweak
      try {
        victim.unit.stats.percentageDamageIncrease *= 1.05;
        victim.unit.stats.percentageDamageReduction *= 0.95;
        const resistKeys = [
          "physicalResistance",
          "magicalResistance",
          "fireResistance",
          "iceResistance",
          "lightningResistance",
          "holyResistance",
          "blightResistance",
        ] as const;
        for (const k of resistKeys) {
          // @ts-ignore indexed access on dynamic stat name
          victim.unit.stats[k] = Math.min(
            0.95,
            (victim.unit.stats[k] || 0) + 0.05,
          );
        }
        // Slight health bump
        victim.maxHealth = Math.round(victim.maxHealth * 1.05);
        victim.health = Math.min(
          victim.maxHealth,
          Math.round(victim.health * 1.05),
        );
      } catch (e) {
        // non-fatal; proceed with base mirror
      }
      const fight = executeFight(attacker, victim);
      const didWin = !!fight.victimDied && !fight.attackerDied;

      ledger.total += 1;
      ledger.lastChallengedAt = Date.now();
      ledger.lastResult = didWin ? "win" : "loss";
      if (didWin) {
        ledger.wins += 1;
        ledger.currentStreak += 1;
        ledger.bestStreak = Math.max(ledger.bestStreak, ledger.currentStreak);
        // Clear pending loss benefit
        ledger.lastChosenBenefit = null;
        ledger.benefitExpiresAt = undefined;
        ledger.benefitBossKillsRemaining = undefined;
      } else {
        ledger.losses += 1;
        ledger.currentStreak = 0;
        // Allow choosing a loss benefit (selection stored here; actual stat effect is handled elsewhere)
        ledger.lastChosenBenefit = null;
        ledger.benefitExpiresAt = undefined;
        ledger.benefitBossKillsRemaining = undefined;
      }

      await context.db.graal.put(ledger);

      // Reward scaffolding (cosmetic only; no stats applied here)
      let titleUnlocked: string | null = null;
      let auraUnlocked: string | null = null;
      let trophyAwarded = false;
      if (didWin) {
        trophyAwarded = true;
        if (ledger.currentStreak >= 1) titleUnlocked = "Worthy";
        if (ledger.currentStreak >= 3) titleUnlocked = "Ironblooded";
        if (ledger.currentStreak >= 7) titleUnlocked = "Name of Stone";
        // rotate simple aura set
        const auras = ["Ember", "Stone", "Aurora"];
        auraUnlocked = auras[ledger.wins % auras.length];
      }

      // Hint flavor for loss; pick simple generic now
      const hint = didWin
        ? graalText.victory.lines[
            (seed + ledger.wins) % graalText.victory.lines.length
          ]
        : (Object.values(graalText.loss.hints) as string[])[
            seed % Object.keys(graalText.loss.hints).length
          ];

      return {
        outcome: didWin ? "win" : "loss",
        hint,
        titleUnlocked,
        auraUnlocked,
        trophyAwarded,
        log: fight.log,
        ledger: {
          total: ledger.total,
          wins: ledger.wins,
          losses: ledger.losses,
          bestStreak: ledger.bestStreak,
          currentStreak: ledger.currentStreak,
          lastChallengedAt: new Date(ledger.lastChallengedAt).toISOString(),
          lastResult: ledger.lastResult,
        },
      };
    },
    async chooseGraalLossBenefit(
      _p: any,
      args: { benefit: "ShameForged" | "Scabsteel" },
      context: BaseContext,
    ) {
      if (!context?.auth?.id) throw new ForbiddenError("Missing auth");
      const ledger = await getOrCreateLedger(context, context.auth.id);
      if (ledger.lastResult !== "loss") {
        throw new UserInputError("No recent loss to temper from.");
      }
      // Record selection; duration/counters stored for future effect application
      const now = Date.now();
      if (args.benefit === "ShameForged") {
        ledger.lastChosenBenefit = "ShameForged";
        ledger.benefitBossKillsRemaining = 10;
        ledger.benefitExpiresAt = undefined;
      } else {
        ledger.lastChosenBenefit = "Scabsteel";
        ledger.benefitBossKillsRemaining = undefined;
        ledger.benefitExpiresAt = now + 60 * 60 * 1000; // 1 hour
      }
      await context.db.graal.put(ledger);

      return {
        total: ledger.total,
        wins: ledger.wins,
        losses: ledger.losses,
        bestStreak: ledger.bestStreak,
        currentStreak: ledger.currentStreak,
        lastChallengedAt: ledger.lastChallengedAt
          ? new Date(ledger.lastChallengedAt).toISOString()
          : null,
        lastResult: ledger.lastResult ?? null,
      };
    },
  },
};

export default resolvers;
