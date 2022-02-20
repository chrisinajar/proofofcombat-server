import { gql } from "apollo-server";

export default gql`
  type Query {
    hello: String
  }

  type Mutation {
    heal: HealResponse! @auth @delay(delay: 1000)
    move(direction: MoveDirection!): MoveResponse! @auth @delay(delay: 1000)
    increaseAttribute(attribute: AttributeType!): LevelUpResponse!
      @auth
      @delay(delay: 1000)
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
