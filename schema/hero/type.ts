import { gql } from "apollo-server";

export default gql`
  type Query {
    hello: String
  }

  type Mutation {
    heal: HealResponse! @auth @delay(delay: 800)
  }

  type HealResponse {
    account: BaseAccount!
    hero: Hero!
  }

  type Hero implements BaseModel {
    id: ID!
    name: String!

    level: Int!
    experience: Int!
    needed: Int!
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
