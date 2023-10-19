async function main() {

    // first deploy ERC721
    // it has no constructor, but requires setup() after deployment
    const ERC721 = await ethers.getContractFactory("ERC721");
    const artwork = await ERC721.deploy();
    await artwork.deployed();
    const artAddress = await artwork.address;

    // then deploy Steward that internally sets up the ERC721.
    const ArtSteward = await ethers.getContractFactory("ArtStewardV2");

    // constructor(address payable _artist, address _artwork)

    const steward = await ArtSteward.deploy("0x4F3e91d2CaCd82FffD1f33A0d26d4078401986e9", artAddress);
    await steward.deployed();
    const stewardAddress = await steward.address;

    console.log("ERC721 deployed to: ", artAddress);
    console.log("Steward deployed to: ", stewardAddress);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });