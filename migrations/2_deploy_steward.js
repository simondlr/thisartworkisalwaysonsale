/* globals artifacts */
var ArtSteward = artifacts.require("./ArtSteward.sol");
var Artwork = artifacts.require("./ERC721Full.sol");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Artwork, "ThisArtworkIsAlwaysOnSale", "TAIAOS").then((deployedArtwork) => {
    return deployer.deploy(ArtSteward, accounts[0], deployedArtwork.address);
  });
};