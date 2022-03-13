import { gql } from "apollo-server";

export default gql`
  type Query {
    accounts(filter: String): AccountListResponse! @auth @admin
    account(id: ID!): BaseAccount! @auth @admin
  }

  type AccountListResponse {
    count: Int!
    accounts: [BaseAccount!]!
  }
`;
