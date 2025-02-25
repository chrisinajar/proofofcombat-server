import { gql } from "apollo-server";

export default gql`
  type Query {
    accounts(filter: String): AccountListResponse! @auth @admin
    account(id: ID!): BaseAccount! @auth @admin
  }

  type Mutation {
    createItem(
      id: ID!
      baseItem: String!
      enchantment: EnchantmentType
    ): BaseAccount! @auth @admin

    giveGold(id: ID!, amount: Float!): BaseAccount! @auth @admin
    setSkill(id: ID!, skill: HeroSkill!, level: Int!): BaseAccount! @auth @admin
    addLevels(id: ID!, levels: Int!): BaseAccount! @auth @admin

    banAccount(id: ID!): AdminActionResponse! @auth @admin
    unbanAccount(id: ID!): AdminActionResponse! @auth @admin
    deleteAccount(id: ID!): AdminActionResponse! @auth @admin

    spawnRandomBoss: AdminActionResponse! @auth @admin

    # Generate an artifact for testing
    generateArtifact(id: ID!, level: Float!): BaseAccount! @auth @admin
  }

  type AccountListResponse {
    count: Int!
    accounts: [BaseAccount!]!
  }
  type AdminActionResponse {
    success: Boolean!
    account: BaseAccount
  }
`;
