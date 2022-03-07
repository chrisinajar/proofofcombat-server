import { gql } from "apollo-server";

export default gql`
  type Query {
    locationDetails(location: LocationInput): LocationDetails! @auth
    docks(map: String): [SpecialLocation!]! @auth
  }
  type Mutation {
    teleport(x: Int!, y: Int!): MoveResponse! @auth @delay(delay: 5000)
    sail(x: Int!, y: Int!): MoveResponse! @auth @delay(delay: 10000)
    move(direction: MoveDirection!): MoveResponse! @auth @delay(delay: 500)
    npcTrade(trade: ID!): NpcShopTradeResponse! @auth @delay(delay: 2000)
  }

  type LocationDetails {
    location: Location!
    specialLocations: [SpecialLocation!]!
    terrain: TerrainData!
    shop: NpcShop
  }
  type SpecialLocation {
    location: Location!
    name: String!
    type: String!
    description: [String!]
  }
  type NpcShop {
    name: String!
    trades: [NpcShopTrade!]!
  }
  type NpcShopTrade {
    id: ID!
    price: NpcShopItems!
    offer: NpcShopItems!
  }
  type NpcShopItems {
    gold: Int
    dust: Int
    baseItems: [String!]
    enchantments: [EnchantmentType!]
    questItems: [String!]
    description: String
  }
  type NpcShopTradeResponse {
    success: Boolean!
    message: String!
    hero: Hero!
    account: BaseAccount!
  }

  type TerrainData {
    terrain: String!
  }

  type Location {
    x: Int!
    y: Int!
    map: ID!
  }
  input LocationInput {
    x: Int!
    y: Int!
    map: ID!
  }

  type MoveResponse {
    hero: Hero!
    account: BaseAccount!
    monsters: [MonsterInstance!]!
  }
`;
