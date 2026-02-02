import { gql } from "@apollo/client";

export const STEWARDS_QUERY = gql`
  query GetStewards {
    v1: steward(id: "0xb602c0bbfab973422b91c8dfc8302b7b47550fc0") {
      id
      currentPrice
      timeAcquired
      timeLastCollected
      currentPatron {
        id
        stewards(patron: id) {
          id
          timeHeld
        }
      }
    }
    v2: steward(id: "0x595f2c4e9e3e35b0946394a714c2cd6875c04988") {
      id
      currentPrice
      timeAcquired
      timeLastCollected
      currentPatron {
        id
        stewards(patron: id) {
          id
          timeHeld
        }
      }
    }
  }
`;

export const STEWARD_V1_QUERY = gql`
  query GetStewardV1 {
    steward(id: "0xb602c0bbfab973422b91c8dfc8302b7b47550fc0") {
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
  }
`;

export const STEWARD_V2_QUERY = gql`
  query GetStewardV2 {
    steward(id: "0x595f2c4e9e3e35b0946394a714c2cd6875c04988") {
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
  }
`;

export interface StewardData {
  id: string;
  currentPrice: string;
  currentDeposit?: string;
  timeAcquired: string;
  timeLastCollected: string;
  totalCollected?: string;
  foreclosureTime?: string;
  currentPatron: {
    id: string;
    stewards: Array<{
      id: string;
      timeHeld: string;
    }>;
  };
}
