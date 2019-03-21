const path = require("path");
const HDWalletProvider = require('truffle-hdwallet-provider');
const mnemonic = ''; // 12 word mnemonic 
const mainnetProviderUrl = 'https://mainnet.infura.io/v3/e811479f4c414e219e7673b6671c2aba'; 
const rinkebyProviderUrl = 'https://rinkeby.infura.io/v3/e811479f4c414e219e7673b6671c2aba';

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // to customize your Truffle configuration!
  plugins: [ "truffle-security" ],
  contracts_build_directory: path.join(__dirname, "app/src/contracts"),
  networks: {
    mainnet: {
      network_id: 1,
      provider: new HDWalletProvider(mnemonic, mainnetProviderUrl, 0),
      gas: 4700000,
      gasPrice: 20000000000, // 20 gwei
    },
    rinkeby: {
      network_id: 4,
      provider: new HDWalletProvider(mnemonic, rinkebyProviderUrl, 0),
      gas: 4700000,
      gasPrice: 10000000000, // 10 gwei
      skipDryRun: true,
    },
    development: {
      host: "127.0.0.1",     // Localhost (default: none)
      port: 8545,            // Standard Ethereum port (default: none)
      network_id: "*",       // Any network (default: none)
      gasPrice: 1000000000, // 1 gwei
    },
  },
  mocha: {
    reporter: 'eth-gas-reporter',
    reporterOptions: {
      currency: 'USD',
      gasPrice: 5, //in gwei
    },
  },
};
