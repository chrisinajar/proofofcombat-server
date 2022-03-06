import { gql } from "apollo-server";

export default gql`
  type Query {
    quest(quest: Quest!): QuestDescription!
  }
  type Mutation {
    dismissQuest: LevelUpResponse! @auth
    rebirth: LevelUpResponse @auth @delay(delay: 10000)
  }

  enum Quest {
    WashedUp # hero is on water but can't swim, gets message about washing ashore
    Rebirth # initial level cap progression
    DroopsQuest # kill hobgoblins to find a hidden location
    NagaScale # collect and combine a bunch of stuff
  }
  type QuestLog {
    id: ID!

    washedUp: QuestProgress
    rebirth: QuestProgress
    droop: QuestProgress
    nagaScale: QuestProgress
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

  type QuestProgress {
    id: ID!
    started: Boolean!
    finished: Boolean!
    progress: Int!
    lastEvent: QuestEvent
  }
`;
