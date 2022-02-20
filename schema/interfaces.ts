import { gql } from "apollo-server";

export default gql`
  interface BaseModel {
    id: ID!
  }

  interface ComatStats {
    health: Int!
    maxHealth: Int!
  }

  interface Attributes {
    strength: Int!
    dexterity: Int!
    constitution: Int!

    intelligence: Int!
    wisdom: Int!
    charisma: Int!
  }
`;
