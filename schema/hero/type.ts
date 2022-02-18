import { gql } from "apollo-server";

export default gql`
  type Query {
    hello: String
  }

  type Mutation {
    fight(monster: ID!): FightResult!
  }

  type FightResult {
    victory: Boolean
  }

  type Hero implements BaseModel {
    id: ID!
    name: String!

    level: Int!
    experience: Int!
    gold: Int!
    location: Location!

    combat: HeroCombatStats!
    stats: HeroStats!
  }

  type HeroCombatStats implements ComatStats {
    health: Int!
    maxHealth: Int!
  }

  type HeroStats {
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
