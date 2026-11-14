import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  frameWallet,
  injectedWallet,
  metaMaskWallet,
  rainbowWallet,
  safeWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { fallback, http } from "wagmi";
import { mainnet, hardhat } from "wagmi/chains";

const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID || "";

// Mainnet RPC, as in the original Web3Modal app: WalletConnect's RPC (keyed by the project ID) first,
// then a public RPC. viem's default (eth.merkle.io) rejects browser requests with CORS errors.
// Only used for the few reads the subgraph can't cover (tx confirmations, the admin artistFund read).
const PUBLIC_MAINNET_RPC = "https://ethereum-rpc.publicnode.com";
const mainnetTransport = projectId
  ? fallback([http(`https://rpc.walletconnect.org/v1/?chainId=eip155:${mainnet.id}&projectId=${projectId}`), http(PUBLIC_MAINNET_RPC)])
  : http(PUBLIC_MAINNET_RPC);

export const config = getDefaultConfig({
  appName: "This Artwork Is Always On Sale",
  projectId,
  // RainbowKit's defaults leave out Frame and generic browser wallets; the original Web3Modal app supported both.
  wallets: [
    {
      groupName: "Popular",
      wallets: [metaMaskWallet, frameWallet, rainbowWallet, coinbaseWallet, walletConnectWallet],
    },
    {
      groupName: "Other",
      wallets: [injectedWallet, safeWallet],
    },
  ],
  chains: process.env.NODE_ENV === "development" ? [mainnet, hardhat] : [mainnet],
  transports: {
    [mainnet.id]: mainnetTransport,
    [hardhat.id]: http(),
  },
  ssr: true,
});

// The Graph configuration
export const GRAPH_API_URL = `https://gateway-arbitrum.network.thegraph.com/api/${process.env.NEXT_PUBLIC_GRAPH_API_KEY}/subgraphs/id/2gV9hXscJvJX5AKRXXgKsUbGgt69ahdaB6Le16qfJ21a`;
