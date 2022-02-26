import { gql } from "apollo-server";

export default gql`
  type Query {
    shopItems: [ShopItem!]! @auth
    baseItem(item: ID!): ShopItem!
    leaderboard: [LeadboardEntry!]!
  }

  type Mutation {
    heal: HealResponse! @auth @delay(delay: 2000)
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
    class: HeroClasses!

    level: Int!
    levelCap: Int!
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

    combatStats: ExtendedCombatStats
  }

  type ExtendedCombatStats {
    damageAmplification: Float!
    damageReduction: Float!
    armorReduction: Float!

    enemyStats: HeroStats!
    stats: HeroStats!
  }

  enum HeroClasses {
    Monster # non-player
    Adventurer # low level
    Gambler # high luck
    JackOfAllTrades # special all stats
    Fighter # melee shield
    Berserker # melee melee
    Wizard # spell spell
    Warlock # spell shield
    BattleMage # spell melee
    Paladin # shield shield
    Ranger # ranged
    BloodMage # con / ench vamp
  }

  type LeadboardEntry {
    id: ID!
    name: String!
    gold: Int!
    level: Int!
    class: String!
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
    willpower
    luck
    all
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
    # Droppable enchantments
    # base stats
    BonusStrength
    BonusDexterity
    BonusConstitution
    BonusIntelligence
    BonusWisdom
    BonusWillpower
    BonusLuck
    # group stats
    BonusPhysical
    BonusMental
    BonusAllStats
    # vamp / damage
    LifeHeal
    LifeDamage
    LifeSteal
    # non-stats
    MinusEnemyArmor
    BonusArmor
    # minus enemy stats
    MinusEnemyStrength
    MinusEnemyDexterity
    MinusEnemyConstitution
    MinusEnemyIntelligence
    MinusEnemyWisdom
    MinusEnemyWillpower
    # group stats
    MinusEnemyPhysical
    MinusEnemyMental
    MinusEnemyAllStats

    # End droppable enchantments

    # Quest reward enchantments
    FishermansStrength
    FishermansDexterity
    FishermansConstitution
    FishermansIntelligence
    FishermansWisdom
    FishermansWillpower
    FishermansLuck

    CanRebirth
    DoubleStatGain
    AutoBattle
    # End quest reward enchantments
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
    strength: Float!
    dexterity: Float!
    constitution: Float!

    intelligence: Float!
    wisdom: Float!
    willpower: Float!

    luck: Float!
  }
`;
