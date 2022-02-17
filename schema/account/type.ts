import { gql } from "apollo-server";

export default gql`
  type Query {
    login(name: String!, password: String!): LoginResponse!
  }

  type Mutation {
    createAccount(name: String!, password: String!): BaseAccount!
  }

  interface BaseModel {
    id: ID!
  }

  type BaseAccount implements BaseModel {
    id: ID!
    name: String!
    password: String!

    hero: Hero
  }

  type LoginResponse {
    account: BaseAccount!
    token: String!
  }
`;
