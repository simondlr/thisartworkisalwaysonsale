async function main() {

    const Restorer = await ethers.getContractFactory("Restorer");

    // constructor(address _oldV1Address, address _oldStewardAddress, address payable _artist) {

    const restorer = await Restorer.deploy("0x6d7C26F2E77d0cCc200464C8b2040c0B840b28a2", "0x74E6Ab057f8a9Fd9355398a17579Cd4c90aB2B66","0x0CaCC6104D8Cd9d7b2850b4f35c65C1eCDEECe03");
    await restorer.deployed();
    const restorerAddress = await restorer.address;

    console.log("Restorer deployed to: ", restorerAddress);
  }
  
  main()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });