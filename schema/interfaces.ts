import { gql } from "apollo-server";

export default gql`
  interface BaseModel {
    id: ID!
  }

  interface ComatStats {
    health: Float!
    maxHealth: Float!
  }

  interface Attributes {
    strength: Float!
    dexterity: Float!
    constitution: Float!

    intelligence: Float!
    wisdom: Float!
    willpower: Float!

    luck: Float!
  }
`;
