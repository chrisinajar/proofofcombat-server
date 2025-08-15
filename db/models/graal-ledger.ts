import DatabaseInterface from "../interface";

export type GraalResult = "win" | "loss" | null;
export type GraalLossBenefit = "ShameForged" | "Scabsteel" | null;

export type GraalLedgerModel = {
  id: string; // heroId
  total: number;
  wins: number;
  losses: number;
  bestStreak: number;
  currentStreak: number;
  lastChallengedAt?: number; // epoch ms
  lastResult?: GraalResult;
  // Optional ephemeral benefit tracking (no stat effects applied here)
  lastChosenBenefit?: GraalLossBenefit;
  benefitExpiresAt?: number; // epoch ms if time-based
  benefitBossKillsRemaining?: number; // if kill-count-based
};

export default class GraalLedgerDB extends DatabaseInterface<GraalLedgerModel> {
  constructor() {
    super("graal");
  }

  upgrade(data: GraalLedgerModel): GraalLedgerModel {
    // future migrations
    return data;
  }

  createDefault(heroId: string): GraalLedgerModel {
    return {
      id: heroId,
      total: 0,
      wins: 0,
      losses: 0,
      bestStreak: 0,
      currentStreak: 0,
      lastChallengedAt: undefined,
      lastResult: null,
      lastChosenBenefit: null,
      benefitExpiresAt: undefined,
      benefitBossKillsRemaining: undefined,
    };
  }
}

