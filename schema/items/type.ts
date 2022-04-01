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
    CounterSpell
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
    # settlements
    UpgradedSettlement
    # End quest reward enchantments

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
