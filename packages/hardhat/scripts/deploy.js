async function main() {

    // first deploy ERC721
    // it has no constructor, but requires setup() after deployment
    const ERC721 = await ethers.getContractFactory("ERC721");
    const artwork = await ERC721.deploy();
    await artwork.deployed();
    const artAddress = await artwork.address;

    // then deploy Steward that internally sets up the ERC721.
    const ArtSteward = await ethers.getContractFactory("ArtSteward");

    // constructor(address payable _artist, address _artwork)

    const steward = await ArtSteward.deploy("0x0CaCC6104D8Cd9d7b2850b4f35c65C1eCDEECe03", artAddress);
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