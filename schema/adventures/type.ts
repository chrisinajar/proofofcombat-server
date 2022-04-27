import { gql } from "apollo-server";

export default gql`
  Query {
    currentAdventure: Adventure @auth
  }

  type Adventure {
    id: ID!
    mapId: ID!
    adventureQuest: AdventureQuests!

    adventureQuestDescription: AdventureQuestDescription
  }

  enum AdventureQuests {
    GlowingAberration
  }

  type AdventureQuestDescription {
    id: AdventureQuests!
    name: String!
    description: String!
  }
`;
