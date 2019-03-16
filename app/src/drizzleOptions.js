import ArtSteward from "./contracts/ArtSteward.json";
import ERC721Full from "./contracts/ERC721Full.json";


const options = {
  web3: {
    block: false,
    fallback: {
      type: "ws",
      url: "ws://127.0.0.1:9545",
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
