import { gql } from "apollo-server";

export default gql`
  type Query {
    shopItems: [ShopItem!]! @auth
    baseItem(item: ID!): ShopItem!
  }

  type Mutation {
    buy(baseItem: ID!): LevelUpResponse! @auth @delay(delay: 200)
    sell(item: ID!): LevelUpResponse! @auth @delay(delay: 200)
    equip(item: ID!, slot: String!): LevelUpResponse! @auth @delay(delay: 200)

    offerTrade(offer: TradeOfferInput!): TradeOfferReply!
      @auth
      @delay(delay: 1000)
    dismissTrade(offer: ID!): LevelUpResponse @auth @delay(delay: 100)
    acceptTrade(offer: ID!): LevelUpResponse @auth @delay(delay: 500)

    # crafting
    destroyItem(item: ID!): LevelUpResponse! @auth @delay(delay: 200)
    disenchantItem(item: ID!): LevelUpResponse! @auth @delay(delay: 300)
    enchantItem(item: ID!, enchantment: EnchantmentType!): LevelUpResponse!
      @auth
      @delay(delay: 1000)
    imbueItem(
      item: String!
      artifact: String!
      affixes: [ArtifactAttributeType!]!
    ): LevelUpResponse! @auth @delay(delay: 1000)
  }

  type ShopItem {
    id: ID!
    alias: String!
    name: String!
    type: InventoryItemType!
    cost: Int
    level: Int!
  }

  type InventoryItem implements BaseModel {
    id: ID!
    owner: ID!
    baseItem: ID!

    name: String!
    type: InventoryItemType!
    level: Int!
    enchantment: EnchantmentType
    imbue: InventoryItemImbue
    builtIns: [ArtifactAttribute!]
  }

  type InventoryItemImbue {
    artifact: ArtifactItem!
    affixes: [ArtifactAttributeType!]!
  }

  # artifacts are uniquely different than other items
  # you only get to use 1 at a time ever (for now but probably forever)
  # there have a series of random attributes assigned to them
  # each attribute has a magnitude
  # while these items are purely passive, they will have a big impact
  type ArtifactItem implements BaseModel {
    id: ID! # unique id
    owner: ID! # owner id
    name: String!
    # "base item level"
    # can level up?
    level: Int!

    attributes: ArtifactAttributes!
  }

  type ArtifactAttributes {
    namePrefix: ArtifactAttribute!
    namePostfix: ArtifactAttribute!
    titlePrefix: ArtifactAttribute
    titlePostfix: ArtifactAttribute

    bonusAffixes: [ArtifactAttribute!]!
  }

  type ArtifactAttribute {
    type: ArtifactAttributeType!
    magnitude: Float!
  }

  enum ArtifactAttributeType {
    # combat stats
    BonusStrength
    BonusDexterity
    BonusConstitution
    BonusIntelligence
    BonusWisdom
    BonusWillpower
    BonusLuck

    # normy stuff
    DamageReduction
    EnhancedDamage
    BonusHealth

    # global stuff that's hard to get
    ReducedDelay
    BonusExperience
    BonusSkillChance
    Lifesteal

    # stun / stun dodge
    Mesmerize
    Focus

    # resistances
    AllResistances

    # damage type specific values
    DamageAsPhysical
    DamageAsMagical
    DamageAsFire
    DamageAsIce
    DamageAsLightning
    DamageAsHoly
    DamageAsBlight

    PhysicalResistance
    MagicalResistance
    FireResistance
    IceResistance
    LightningResistance
    HolyResistance
    BlightResistance

    BonusPhysicalDamage
    BonusMagicalDamage
    BonusFireDamage
    BonusIceDamage
    BonusLightningDamage
    BonusHolyDamage
    BonusBlightDamage

    EnemyPhysicalResistance
    EnemyMagicalResistance
    EnemyFireResistance
    EnemyIceResistance
    EnemyLightningResistance
    EnemyHolyResistance
    EnemyBlightResistance

    # item specific modifiers, these only affect the item they're attached to
    ItemBonusArmor
    ItemFlatArmor
    ItemBonusDamage
    ItemFlatDamage
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
    CounterSpell
    BigCounterSpell
    SuperCounterSpell
    Mesmerize
    Focus
    # minus enemy stats
    MinusEnemyStrength
    MinusEnemyDexterity
    MinusEnemyConstitution
    MinusEnemyIntelligence
    MinusEnemyWisdom
    MinusEnemyWillpower
    # steal enemy stats
    StrengthSteal
    DexteritySteal
    ConstitutionSteal
    IntelligenceSteal
    WisdomSteal
    WillpowerSteal
    LuckSteal
    # group stats
    MinusEnemyPhysical
    MinusEnemyMental
    MinusEnemyAllStats
    WisDexWill
    # tier 3 enchantments
    AllStatsSteal
    Vampirism
    BigMelee
    BigCaster

    # End droppable enchantments

    # tier 4's, not droppable, only craftable
    SuperDexterity
    SuperWillpower
    SuperWisdom
    SuperMelee
    SuperCaster
    SuperMeleeVamp
    SuperSorcVamp
    SuperVamp
    SuperVampMelee
    SuperVampSorc
    SuperBattleMage
    SuperAllStats

    # parts of tier 4's
    TierFourCommon
    SuperDexterityStats
    SuperWillpowerStats
    SuperWisdomStats
    SuperVampStats
    SuperMeleeStats
    SuperCasterStats
    SuperVampMeleeStats
    SuperVampSorcStats
    SuperMeleeVampStats
    SuperBattleMageStats
    SuperSorcVampStats
    TwentyLifeSteal
    ThirtyLifeSteal

    # Quest reward enchantments
    # brewconia quest
    FishermansStrength
    FishermansDexterity
    FishermansConstitution
    FishermansIntelligence
    FishermansWisdom
    FishermansWillpower
    FishermansLuck
    # rebirth / gating / leveling bonuses
    CanRebirth
    CanCraft
    AutoBattle # probably shoulda been "CanAutoBattle" but whatever
    DoubleExperience # 2x xp, stacks
    DoubleLeveling # get 2 levels for every level, stacks
    BonusDust
    IncreasedGoldCap
    # class quests
    MeleeUpgrade
    CasterUpgrade
    ArcherUpgrade
    VampireUpgrade
    GamblerUpgrade
    BattleMageUpgrade
    SmiterUpgrade
    # random
    DoubleAccuracy
    DoubleDodge
    ImprovedAutomation
    DoubleAllStats
    BonusWeaponTier
    BonusArmorTier
    RangedSecondAttackChance
    BonusMeleeWeaponTier
    BonusCasterWeaponTier
    BonusSmiteWeaponTier
    BonusRangedWeaponTier
    RangedArmorPiercing
    MeleeArmorPiercing
    CasterArmorPiercing
    SmiteArmorPiercing
    VampireArmorPiercing

    # travel
    ReduceTeleportCost
    AncientKey
    CanTravelOnWater
    CanTravelOnForbidden
    VoidTravel
    # settlements
    UpgradedSettlement
    # End quest reward enchantments

    # altar blessings
    RubyBlessing
    EmeraldBlessing
    SapphireBlessing
    DiamondBlessing

    # MOB ONLY enchantments
    CanOnlyTakeOneDamage
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

  input TradeOfferInput {
    to: ID!
    item: String!
    gold: Float!
  }

  type TradeOffer {
    id: ID!
    fromId: ID!
    fromName: String!
    toId: ID!
    toName: String!
    item: InventoryItem!
    gold: Float!
  }

  type TradeOfferReply {
    hero: Hero!
    account: BaseAccount!
    trade: TradeOffer!
  }
`;
