import ArtSteward from "./contracts/ArtSteward.json";
import ERC721Full from "./contracts/ERC721Full.json";

// todo: read env var for fallback
const fallbackUrl = "ws://127.0.0.1:8545";

const options = {
  web3: {
    block: false,
    fallback: {
      type: "ws",
      url: fallbackUrl,
    },
  },
  contracts: [
    ArtSteward, 
    ERC721Full
  ],
  syncAlways: true,
  polls: {
    accounts: 1500,
  },
};

export default options;
