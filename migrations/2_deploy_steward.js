/* globals artifacts */
var ArtSteward = artifacts.require("./ArtSteward.sol");
var Artwork = artifacts.require("./ERC721Full.sol");

const deploymentAccount =  '0x09b67b74fb050a35304a6447dfa41b1a9d6afa3a'; //[0] address from mnemonic
const artistAccount = '0x0CaCC6104D8Cd9d7b2850b4f35c65C1eCDEECe03'; // artist account [on mainnet & rinkeby]

module.exports = function(deployer, network, accounts) {
  if(network === "rinkeby" || network === "rinkeby-fork" || network === "mainnet" || network === "mainnet-fork") {
    // deploy with mnemonic provider
    deployer.deploy(Artwork, "This Artwork Is Always OnSale", "TAIAOS").then((deployedArtwork) => {
      console.log(deployedArtwork.address);
      return deployer.deploy(ArtSteward, artistAccount, deployedArtwork.address);
    });
  } else {
    // development deploy
    deployer.deploy(Artwork, "ThisArtworkIsAlwaysOnSale", "TAIAOS").then((deployedArtwork) => {
      return deployer.deploy(ArtSteward, accounts[0], deployedArtwork.address);
    });
  }

};