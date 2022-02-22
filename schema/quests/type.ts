import { gql } from "apollo-server";

export default gql`
  type Query {
    quest(quest: Quest!): QuestDescription!
  }
  type Mutation {
    dismissQuest: LevelUpResponse! @auth
  }

  enum Quest {
    WashedUp # hero is on water but can't swim, gets message about washing ashore
  }

  type QuestEvent {
    id: ID!
    message: [String!]
    quest: Quest!
  }

  type QuestDescription {
    id: Quest!
    description: String
  }

  type QuestLog {
    id: ID!

    washedUp: QuestProgress
  }

  type QuestProgress {
    id: ID!
    started: Boolean!
    finished: Boolean!
    progress: Int!
    lastEvent: QuestEvent
  }
`;
