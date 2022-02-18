import { gql } from "apollo-server";

export default gql`
  interface BaseModel {
    id: ID!
  }

  interface ComatStats {
    health: Int!
    maxHealth: Int!
  }
`;
