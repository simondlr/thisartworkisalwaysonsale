export const ARTWORKS = {
  v1: {
    steward: "0xB602c0bBfaB973422B91C8dfc8302B7b47550fC0",
    image: "/artwork-v1.png",
    title: "V1",
    rateLabel: "5%",
    subtitle: "Original (2019). Restored (2021).",
    // patronageNumerator / patronageDenominator, as set in ArtSteward.sol
    patronageNumerator: 50_000_000_000n,
  },
  v2: {
    steward: "0x595f2c4e9e3e35B0946394A714c2CD6875C04988",
    image: "/artwork-v2.png",
    title: "V2",
    rateLabel: "100%",
    subtitle: "(2020)",
    // ArtStewardV2.sol sets numerator == denominator (100%)
    patronageNumerator: 1_000_000_000_000n,
  },
} as const;

export const PATRONAGE_DENOMINATOR = 1_000_000_000_000n;

// The artist's address: can use /admin, and sees a preview of the patron actions on the artwork pages.
export const ADMIN_ADDRESS = "0x0CaCC6104D8Cd9d7b2850b4f35c65C1eCDEECe03";

export function isAdminAddress(address?: string): boolean {
  return !!address && address.toLowerCase() === ADMIN_ADDRESS.toLowerCase();
}

export type Version = keyof typeof ARTWORKS;

// The Graph indexes entities by lowercased address.
export function stewardGraphId(version: Version): string {
  return ARTWORKS[version].steward.toLowerCase();
}
