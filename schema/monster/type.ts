import { gql } from "apollo-server";

export default gql`
  type Query {
    monster(id: ID!): Monster!
    monsters: [MonsterInstance!]! @auth
    challenges: [Monster!]! @auth
  }

  type Mutation {
    challenge(monster: ID!): MonsterInstance! @auth
    fight(
      monster: ID!
      attackType: AttackType
      stance: HeroStance
    ): MonsterFightResult! @auth @delay(delay: 800)
  }

  type MonsterFightResult {
    account: BaseAccount!
    hero: Hero!
    monster: MonsterInstance!
    log: [CombatEntry!]!
    victory: Boolean!
    experience: Int
    gold: Float
    drop: InventoryItem
    didLevel: Boolean
  }

  type MonsterInstance implements BaseModel {
    id: ID!

    location: Location!
    monster: Monster!
    equipment: MonsterEquipment
    lastActive: Int
  }

  type Monster {
    id: ID!
    name: String!
    level: Float!

    combat: MonsterCombatStats!
    attackType: AttackType!
    terrain: String
  }

  type MonsterEquipment {
    leftHand: MonsterItem!
    rightHand: MonsterItem!
    bodyArmor: MonsterItem!
    handArmor: MonsterItem!
    legArmor: MonsterItem!
    headArmor: MonsterItem!
    footArmor: MonsterItem!
  }

  type MonsterItem {
    level: Float!
    enchantment: EnchantmentType
    imbue: InventoryItemImbue
  }

  type MonsterCombatStats implements ComatStats {
    health: Float!
    maxHealth: Float!
  }

  type CombatEntry {
    damage: Float!
    attackType: AttackType!
    damageType: DamageType
    isEnchantment: Boolean!
    success: Boolean!
    from: String!
    to: String!
    critical: Boolean!
    isMesmerize: Boolean
  }

  enum AttackType {
    MELEE
    RANGED
    CAST
    SMITE
    BLOOD
  }

  enum DamageType {
    Physical
    Magical
    Enchantment

    Fire
    Ice
    Lightning

    Holy
    Blight
  }
`;
