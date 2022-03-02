import { gql } from "apollo-server";

export default gql`
  type Query {
    leaderboard: [LeadboardEntry!]!
  }

  type Mutation {
    heal: HealResponse! @auth @delay(delay: 2000)
    increaseAttribute(
      attribute: AttributeType!
      spendAll: Boolean
    ): LevelUpResponse! @auth @delay(delay: 1000)
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
    enchantingDust: Int!
    location: Location!
    attributePoints: Int!

    combat: HeroCombatStats!
    stats: HeroStats!

    enchantments: [EnchantmentType!]!
    inventory: [InventoryItem!]!
    equipment: EquipmentSlots!
    currentQuest: QuestEvent
    questLog: QuestLog!

    combatStats: ExtendedCombatStats
    incomingTrades: [TradeOffer!]!
    outgoingTrades: [TradeOffer!]!
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
    JackOfAllTrades # special all stats
    # base classes
    Gambler # high luck
    Fighter # melee shield
    Berserker # melee melee
    Wizard # spell spell
    Warlock # spell shield
    BattleMage # spell melee
    Paladin # shield shield
    Ranger # ranged
    BloodMage # con / ench vamp
    # upgraded calsses
    Daredevil # <- Gambler <- high luck
    Gladiator # <- Fighter <- melee shield
    EnragedBerserker # <- Berserker <- melee melee
    MasterWizard # <- Wizard <- spell spell
    MasterWarlock # <- Warlock <- spell shield
    DemonHunter # <- BattleMage <- spell melee
    Zealot # <- Paladin <- shield shield
    Archer # <- Ranger <- ranged
    Vampire # <- BloodMage <- con / ench vamp
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
