import { gql } from "apollo-server";

export default gql`
  type Query {
    shopItems: [ShopItem!]! @auth
    baseItem(item: ID!): ShopItem!
    leaderboard: [LeadboardEntry!]!
  }

  type Mutation {
    heal: HealResponse! @auth @delay(delay: 2000)
    move(direction: MoveDirection!): MoveResponse! @auth @delay(delay: 1000)
    increaseAttribute(attribute: AttributeType!): LevelUpResponse!
      @auth
      @delay(delay: 1000)

    buy(baseItem: ID!): LevelUpResponse! @auth @delay(delay: 200)
    sell(item: ID!): LevelUpResponse! @auth @delay(delay: 200)
    equip(item: ID!, slot: String!): LevelUpResponse! @auth @delay(delay: 200)
  }

  type Hero implements BaseModel {
    id: ID!
    version: Int!
    name: String!

    level: Int!
    experience: Int!
    needed: Int!
    gold: Int!
    location: Location!
    attributePoints: Int!

    combat: HeroCombatStats!
    stats: HeroStats!

    inventory: [InventoryItem!]!
    equipment: EquipmentSlots!
    currentQuest: QuestEvent
    questLog: QuestLog!
  }

  type LeadboardEntry {
    id: ID!
    name: String!
    gold: Int!
    level: Int!
  }

  type LevelUpResponse {
    hero: Hero!
    account: BaseAccount!
  }

  enum AttributeType {
    strength
    dexterity
    constitution
    intelligence
    wisdom
    charisma
    luck
  }

  enum MoveDirection {
    NORTH
    SOUTH
    EAST
    WEST
  }

  type MoveResponse {
    hero: Hero!
    account: BaseAccount!
    monsters: [MonsterInstance!]!
  }

  type HealResponse {
    account: BaseAccount!
    hero: Hero!
  }

  type EquipmentSlots {
    id: ID
    leftHand: InventoryItem
    rightHand: InventoryItem
    bodyArmor: InventoryItem
    handArmor: InventoryItem
    legArmor: InventoryItem
    headArmor: InventoryItem
    footArmor: InventoryItem
    accessories: [InventoryItem!]!
  }

  type ShopItem {
    id: ID!
    name: String!
    type: InventoryItemType!
    cost: Int
  }

  type InventoryItem implements BaseModel {
    id: ID!
    owner: ID!
    baseItem: ID!

    name: String!
    type: InventoryItemType!
    level: Int!
    enchantment: EnchantmentType
  }

  enum EnchantmentType {
    BonusStrength
    BonusDexterity
    BonusConstitution
    BonusIntelligence
    BonusWisdom
    BonusCharisma
    BonusLuck

    BonusPhysical
    BonusMental
    BonusAllStats
  }

  enum InventoryItemType {
    Quest
    MeleeWeapon
    RangedWeapon
    Shield
    SpellFocus
    BodyArmor
    HandArmor
    LegArmor
    HeadArmor
    FootArmor
    Accessory
  }

  type HeroCombatStats implements ComatStats {
    health: Int!
    maxHealth: Int!
  }

  type HeroStats implements Attributes {
    strength: Int!
    dexterity: Int!
    constitution: Int!

    intelligence: Int!
    wisdom: Int!
    charisma: Int!

    luck: Int!
  }

  type Location {
    x: Int!
    y: Int!
    map: ID!
  }
`;
