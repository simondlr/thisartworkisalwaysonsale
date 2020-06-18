const defaultAccounts = require("./scripts/wallet-utils.js");
const { usePlugin } = require('@nomiclabs/buidler/config');
usePlugin("@nomiclabs/buidler-waffle");
usePlugin("@nomiclabs/buidler-web3");

module.exports = {
  defaultNetwork: 'localhost',
  networks: {
    localhost: {
      url: 'http://localhost:8545',
    },
    buidlerevm: {
      accounts: defaultAccounts(),
      gas: 9500000,
    }
  },
  solc: {
    version : "0.6.6",
  }
}
