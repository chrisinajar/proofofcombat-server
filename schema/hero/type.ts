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
  }
`;
