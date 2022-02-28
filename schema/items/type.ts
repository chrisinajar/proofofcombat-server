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

    # crafting
    destroyItem(item: ID!): LevelUpResponse! @auth @delay(delay: 200)
    disenchantItem(item: ID!): LevelUpResponse! @auth @delay(delay: 200)
    enchantItem(item: ID!, enchantment: EnchantmentType!): LevelUpResponse!
      @auth
      @delay(delay: 200)
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

    # Quest reward enchantments
    FishermansStrength
    FishermansDexterity
    FishermansConstitution
    FishermansIntelligence
    FishermansWisdom
    FishermansWillpower
    FishermansLuck

    CanRebirth
    CanCraft
    AutoBattle # probably shoulda been "CanAutoBattle" but whatever
    DoubleExperience # 2x xp, stacks
    DoubleLeveling # get 2 levels for every level, stacks
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
`;
