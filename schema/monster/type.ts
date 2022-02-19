import { gql } from "apollo-server";

export default gql`
  type Query {
    monster(id: ID!): Monster!
    monsters: [MonsterInstance!]! @auth
    challenges: [Monster!]! @auth
  }

  type Mutation {
    challenge(monster: ID!): MonsterInstance! @auth
    fight(monster: ID!): FightResult! @auth @delay(delay: 200)
  }

  type FightResult {
    account: BaseAccount!
    hero: Hero!
    monster: MonsterInstance!
    log: [CombatEntry!]!
    victory: Boolean!
    experience: Int
    didLevel: Boolean
  }

  type MonsterInstance implements BaseModel {
    id: ID!

    location: Location!
    monster: Monster!
  }

  type Monster {
    id: ID!
    name: String!
    level: Int!

    combat: MonsterCombatStats!
  }

  type MonsterCombatStats implements ComatStats {
    health: Int!
    maxHealth: Int!
  }

  type CombatEntry {
    damage: Int!
    attackType: AttackType!
    success: Boolean!
    from: String!
    to: String!
  }

  enum AttackType {
    MELEE
  }
`;
