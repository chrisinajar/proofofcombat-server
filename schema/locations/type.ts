import { gql } from "apollo-server";

export default gql`
  type Query {
    locationDetails(location: LocationInput): LocationDetails! @auth
    docks(map: String): [SpecialLocation!]! @auth
    availableUpgrades: [PlayerLocationUpgradeDescription!]! @auth
    settlementManager: SettlementManager! @auth
  }
  type Mutation {
    teleport(x: Int!, y: Int!): MoveResponse! @auth @delay(delay: 5000)
    sail(x: Int!, y: Int!): MoveResponse! @auth @delay(delay: 10000)
    move(direction: MoveDirection!): MoveResponse! @auth @delay(delay: 500)
    npcTrade(trade: ID!): NpcShopTradeResponse! @auth @delay(delay: 2000)

    voidTravel: MoveResponse! @auth @delay(delay: 5000)

    # camps
    settleCamp: ExtendedCampResponse! @auth @delay(delay: 10000)
    buyResource(resource: String!, amount: Int!): LevelUpResponse!
      @auth
      @delay(delay: 1000)
    sellResource(resource: String!, amount: Int!): LevelUpResponse!
      @auth
      @delay(delay: 1000)
    upgradeCamp(upgrade: PlayerLocationUpgrades!): ExtendedCampResponse!
      @auth
      @delay(delay: 1000)
    buildBuilding(
      type: PlayerLocationType!
      location: LocationInput!
    ): ExtendedSettlementResponse! @auth @delay(delay: 2000)
    destroyBuilding(location: LocationInput!): LevelUpResponse!
      @auth
      @delay(delay: 2000)

    purchaseBonds(
      location: LocationInput!
      amount: Int!
    ): PlayerLocationResponse! @auth @delay(delay: 800)

    # military
    recruit(location: LocationInput!, amount: Int!): PlayerLocationResponse!
      @auth
      @delay(delay: 800)
    attack(
      source: LocationInput!
      target: LocationInput!
      units: MilitaryUnitInput!
    ): AttackResponse!
    # @auth @delay(delay: 5000)
  }

  type ExtendedCampResponse {
    account: BaseAccount!
    hero: Hero!
    camp: PlayerLocation
  }

  type ExtendedSettlementResponse {
    account: BaseAccount!
    hero: Hero!
    settlement: SettlementManager!
  }

  type PlayerLocationUpgradeDescription {
    type: PlayerLocationUpgrades!
    name: String!
    cost: [CampResources!]!
  }

  type SettlementManager {
    id: ID!
    capital: PlayerLocation!
    range: Int!
    availableUpgrades: [PlayerLocationUpgradeDescription!]!
    availableBuildings: [PlayerLocationBuildingDescription!]!
  }

  type PlayerLocationBuildingDescription {
    type: PlayerLocationType!
    name: String!
    cost: [CampResources!]!
    description: String!
  }

  # camps have the hero id as the id
  # buildings (anything mutually exclusive) id is location
  type PlayerLocation {
    id: ID!
    location: Location!
    owner: ID!
    publicOwner: PublicHero
    type: PlayerLocationType!
    upgrades: [PlayerLocationUpgrades!]!
    resources: [CampResources!]!
    upkeep: UpkeepCosts!
    lastUpkeep: String
    connections: [PlayerLocation!]!
    availableUpgrades: [PlayerLocationUpgradeDescription!]!
  }

  type UpkeepCosts {
    stone: Int!
    wood: Int!
    food: Int!
    water: Int!
  }

  type CampResources {
    name: String!
    value: Float!
    maximum: Float
  }

  enum PlayerLocationUpgrades {
    Tent
    FirePit
    ChoppingBlock
    RainCollectionUnit
    WoodStorage
    StoneStorage
    ImprovedCamp
    Garden
    HiredHelp
    TradingPost
    StorageCache
    Settlement

    # post-settlement upgrades
    HasBuiltFarm
  }

  enum PlayerLocationType {
    Camp
    Settlement

    Treasury
    Farm
    Shrine
    Apiary
    Barracks
    Garrison
  }

  type LocationDetails {
    location: Location!
    specialLocations: [SpecialLocation!]!
    terrain: TerrainData!
    shop: NpcShop
    players: [PublicHero!]
    playerLocations: [PlayerLocation!]

    voidTravel: Boolean

    neighborTerrain: NeighborTerrainData!
  }
  type NeighborTerrainData {
    north: TerrainData
    south: TerrainData
    east: TerrainData
    west: TerrainData
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
    gold: Float
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

  input MilitaryUnitInput {
    enlisted: Int
    soldier: Int
    veteran: Int
    ghost: Int
  }

  type AttackResponse {
    source: PlayerLocation!
    target: PlayerLocation!
  }

  type PlayerLocationResponse {
    location: PlayerLocation!
    account: BaseAccount
  }
`;
