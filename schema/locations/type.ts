import { gql } from "apollo-server";

export default gql`
  type Query {
    locationDetails(location: LocationInput): LocationDetails! @auth
    docks(map: String): [SpecialLocation!]! @auth
  }
  type Mutation {
    sail(x: Int!, y: Int!): MoveResponse! @auth @delay(delay: 5000)
    move(direction: MoveDirection!): MoveResponse! @auth @delay(delay: 250)
  }

  type LocationDetails {
    location: Location!
    specialLocations: [SpecialLocation!]!
    terrain: TerrainData!
  }
  type SpecialLocation {
    location: Location!
    name: String!
    type: String!
  }
  type TerrainData {
    terrain: String!
  }

  type Location {
    x: Int!
    y: Int!
    map: ID!
  }
  input LocationInput {
    x: Int!
    y: Int!
    map: ID!
  }
`;
