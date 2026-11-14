import { gql } from "@apollo/client";
import { stewardGraphId } from "./artworks";

const STEWARD_FIELDS = gql`
  fragment StewardFields on Steward {
    id
    currentPrice
    currentDeposit
    timeAcquired
    timeLastCollected
    totalCollected
    foreclosureTime
    currentPatron {
      id
      stewards(patron: id) {
        id
        timeHeld
      }
    }
  }
`;

export const STEWARDS_QUERY = gql`
  ${STEWARD_FIELDS}
  query GetStewards($v1: ID!, $v2: ID!) {
    v1: steward(id: $v1) {
      ...StewardFields
    }
    v2: steward(id: $v2) {
      ...StewardFields
    }
  }
`;

export const STEWARDS_QUERY_VARIABLES = { v1: stewardGraphId("v1"), v2: stewardGraphId("v2") };

export const STEWARD_QUERY = gql`
  ${STEWARD_FIELDS}
  query GetSteward($id: ID!) {
    steward(id: $id) {
      ...StewardFields
    }
  }
`;

export interface StewardData {
  id: string;
  currentPrice: string;
  currentDeposit: string;
  timeAcquired: string;
  timeLastCollected: string;
  totalCollected: string;
  foreclosureTime: string;
  currentPatron: {
    id: string;
    stewards: Array<{
      id: string;
      timeHeld: string;
    }>;
  };
}

export function totalTimeHeld(steward: StewardData | undefined, now: number): number {
  if (!steward) return 0;
  const timeHeld = parseInt(steward.currentPatron?.stewards?.[0]?.timeHeld || "0");
  return timeHeld + (now - parseInt(steward.timeLastCollected));
}
