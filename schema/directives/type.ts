import { gql } from "apollo-server";

export default gql`
  directive @auth on FIELD_DEFINITION
  directive @admin on FIELD_DEFINITION
  directive @proof(level: Int!) on FIELD_DEFINITION
  directive @delay(delay: Int!) on FIELD_DEFINITION
`;
