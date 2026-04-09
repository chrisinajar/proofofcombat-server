import { gql } from "apollo-server";

export default gql`
  type Query {
    quest(quest: Quest!): QuestDescription! @auth
  }
  type Mutation {
    dismissQuest: LevelUpResponse! @auth
    rebirth: LevelUpResponse! @auth @delay(delay: 10000)
    talk: TalkResponse! @auth @delay(delay: 2000)
    readMap(itemId: ID!): TalkResponse! @auth @delay(delay: 3300)
  }

  enum Quest {
    TasteForBusiness # deliver packages for a shopkeeper
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

  # Field names are camelCase of the Quest enum EXCEPT:
  #   DroopsQuest        → droop             (shortened; "Droop" is the NPC)
  #   MysteriousAutomation → clockwork       (in-game flavour rename)
  #   EssencePurification  → dailyPurification (tracks the daily cooldown)
  # Canonical map: QUEST_LOG_FIELD in schema/quests/helpers.ts
  type QuestLog {
    id: ID!

    tasteForBusiness: QuestProgress     # Quest.TasteForBusiness
    washedUp: QuestProgress             # Quest.WashedUp
    rebirth: QuestProgress              # Quest.Rebirth
    droop: QuestProgress                # Quest.DroopsQuest
    nagaScale: QuestProgress            # Quest.NagaScale
    clockwork: QuestProgress            # Quest.MysteriousAutomation
    tavernChampion: QuestProgress       # Quest.TavernChampion
    minorClassUpgrades: QuestProgress   # Quest.MinorClassUpgrades
    settlements: QuestProgress          # Quest.Settlements
    meetTheQueen: QuestProgress         # Quest.MeetTheQueen
    dailyPurification: QuestProgress    # Quest.EssencePurification
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
    eventHistory: [QuestEvent!]
  }

  type TalkResponse {
    hero: Hero!
    account: BaseAccount!
    message: String!
  }
`;
