import { gql } from "apollo-server";

export default gql`
  type Query {
    leaderboard: [LeadboardEntry!]!
  }

  type Mutation {
    heal: HealResponse! @auth @delay(delay: 3000)
    increaseAttribute(
      attribute: AttributeType!
      spendAll: Boolean
      amount: Int
    ): LevelUpResponse! @auth @delay(delay: 1000)

    attackHero(
      id: ID!
      attackType: AttackType
      stance: HeroStance
    ): HeroFightResult! @auth @delay(delay: 1000)

    # settings
    changeMinimumStat(name: String!, value: Int!): LevelUpResponse! @auth
    changeAutoDust(value: Int!): LevelUpResponse! @auth

    changeActiveSkill(skill: HeroSkill!): LevelUpResponse! @auth
    changeSkillPercent(percent: Int!): LevelUpResponse! @auth
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
    gold: Float!
    enchantingDust: Int!
    location: Location!
    home: PlayerLocation
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
    settings: HeroSettings!

    skills: HeroSkills!
    skillPercent: Int!
    activeSkill: HeroSkill!

    activeStance: HeroStance!
    availableStances: [HeroStance!]!

    buffs: HeroBuffs!
  }

  # various buffs like blessings, curses, etc not bound to quest items
  # effectively "buff slots" of sorts
  type HeroBuffs {
    blessing: EnchantmentType
  }

  enum HeroStance {
    Normal

    # berserler
    Reckless

    # wizard
    Fire
    Ice
    Lightning
  }

  enum HeroSkill {
    attackingAccuracy
    castingAccuracy
    attackingDamage
    castingDamage
    vitality
    resilience
    regeneration
  }
  type HeroSkills {
    attackingAccuracy: Int!
    castingAccuracy: Int!
    attackingDamage: Int!
    castingDamage: Int!
    vitality: Int!

    resilience: Int!
    regeneration: Int!
  }

  type PublicHero {
    id: ID!
    name: String!
    level: Int!
    class: HeroClasses!
    local: Boolean!
    combat: HeroCombatStats!
  }

  type HeroFightResult {
    account: BaseAccount!
    hero: Hero!
    otherHero: PublicHero!
    log: [CombatEntry!]!
    victory: Boolean!
  }

  type HeroSettings {
    minimumStats: HeroStats!
    autoDust: Int!
  }

  type ExtendedCombatStats {
    damageAmplification: Float!
    damageReduction: Float!
    armorReduction: Float!

    enemyStats: HeroStats!
    stats: HeroStats!

    physicalResistance: Float!
    magicalResistance: Float!

    fireResistance: Float!
    iceResistance: Float!
    lightningResistance: Float!
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
    Monk # no weapon ??? stats
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
    gold: Float!
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

    artifact: ArtifactItem
  }

  type HeroCombatStats implements ComatStats {
    health: Float!
    maxHealth: Float!
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
