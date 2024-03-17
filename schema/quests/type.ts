import { gql } from "apollo-server";

export default gql`
  type Query {
    quest(quest: Quest!): QuestDescription! @auth
  }
  type Mutation {
    dismissQuest: LevelUpResponse! @auth
    rebirth: LevelUpResponse! @auth @delay(delay: 10000)
    talk: TalkResponse! @auth @delay(delay: 2000)
  }

  enum Quest {
    WashedUp # hero is on water but can't swim, gets message about washing ashore
    Rebirth # initial level cap progression
    DroopsQuest # kill hobgoblins to find a hidden location
    NagaScale # collect and combine a bunch of stuff
    MysteriousAutomation # automation!.... FORCED DOWN YOUR THROAT
    TavernChampion # beat all the big bois
    MinorClassUpgrades # 3 tier system with 5 tracks, ezpz basically free
    Settlements # governor's title and it's upgrades
    MeetTheQueen # queen stuff
    EssencePurification # tracking daily essense purges
  }

  type QuestLog {
    id: ID!

    washedUp: QuestProgress
    rebirth: QuestProgress
    droop: QuestProgress
    nagaScale: QuestProgress
    clockwork: QuestProgress
    tavernChampion: QuestProgress
    minorClassUpgrades: QuestProgress
    settlements: QuestProgress
    meetTheQueen: QuestProgress
    dailyPurification: QuestProgress
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

  type TalkResponse {
    hero: Hero!
    account: BaseAccount!
    message: String!
  }
`;
