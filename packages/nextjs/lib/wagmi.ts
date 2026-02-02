import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { mainnet, hardhat } from "wagmi/chains";

export const config = getDefaultConfig({
  appName: "This Artwork Is Always On Sale",
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "",
  chains: [mainnet, hardhat],
  ssr: true,
});

// Contract addresses
export const CONTRACT_ADDRESSES = {
  v1Steward: "0xB602c0bBfaB973422B91C8dfc8302B7b47550fC0" as const,
  v2Steward: "0x595f2c4e9e3e35B0946394A714c2CD6875C04988" as const,
};

// The Graph configuration
export const GRAPH_API_URL = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PUBLIC_GRAPH_API_KEY}/subgraphs/id/2gV9hXscJvJX5AKRXXgKsUbGgt69ahdaB6Le16qfJ21a`;
