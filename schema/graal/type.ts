import { gql } from "apollo-server";

export default gql`
  extend type Query {
    graalAvailable: Boolean! @auth
    graalLedger: GraalLedger! @auth
  }

  extend type Mutation {
    challengeGraal: GraalDuelResult! @auth @delay(delay: 1000)
    chooseGraalLossBenefit(benefit: GraalLossBenefit!): GraalLedger! @auth
  }

  type GraalLedger {
    total: Int!
    wins: Int!
    losses: Int!
    bestStreak: Int!
    currentStreak: Int!
    lastChallengedAt: String
    lastResult: String
  }

  enum GraalLossBenefit {
    ShameForged
    Scabsteel
  }

  type GraalDuelResult {
    outcome: String! # "win" | "loss"
    hint: String
    titleUnlocked: String
    auraUnlocked: String
    trophyAwarded: Boolean!
    log: [CombatEntry!]!
    ledger: GraalLedger!
  }
`;
