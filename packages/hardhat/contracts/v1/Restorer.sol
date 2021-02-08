// SPDX-License-Identifier: MIT

pragma solidity >=0.6.0 <0.8.0;

import "./ArtSteward.sol";
import "./ERC721.sol";

// import "hardhat/console.sol";

/*
Symbolic Restoration.

- On deploy, creates new canvas (ERC721) + New Steward.
- On deploy, takes snapshot of damanged v1.
- New Steward is blocked from transferral unless damaged v1 has been joined into the new canvas.
- To Restore():
    - New TAIAOS can only be bought if Restoration contract is the owner of old v1.
    - Thus: Buys old v1 at snapshot price and blocks it from being sold with the Restoration contract (effectively forever).
    - Snapshot owner then buys restored v1 with a deposit of 0.5 eth.
    - The restoration contract thus irrevocably binds the old artwork into the new one, effectively restoring an artwork that's always on sale.
*/

interface IOldSteward {

    // old steward has the buy function with only one parameter
    function buy(uint256 _newPrice) external payable;
    function price() external view returns (uint256); // mimics fetching the variable
}

contract Restorer {
    // mainnet
    // oldv1 address: 0x6d7C26F2E77d0cCc200464C8b2040c0B840b28a2
    // oldv1Steward address: 0x74E6Ab057f8a9Fd9355398a17579Cd4c90aB2B66
    ERC721 oldV1;
    IOldSteward oldArtSteward;

    address public snapshotOwner;
    uint256 public snapshotPrice;
    uint256 public snapshotBlockNumber; // block checkpoint for transition

    // artist: 0x0CaCC6104D8Cd9d7b2850b4f35c65C1eCDEECe03;
    address payable public artist;

    ERC721 public newV1;
    ArtSteward public newArtSteward;

    bool public restored = false;

    constructor(address _oldV1Address, address _oldStewardAddress, address payable _artist) {
        oldV1 = ERC721(_oldV1Address);
        oldArtSteward = IOldSteward(_oldStewardAddress);
        artist = _artist;

        snapshotPrice = oldArtSteward.price();
        snapshotOwner = oldV1.ownerOf(42);
        snapshotBlockNumber = block.number; // for record keeping

        // deploy new canvas
        newV1 = new ERC721();

        // deploy new steward
        // artist, artwork, snapshotPrice, snapshotOwner, oldV1Address
        newArtSteward = new ArtSteward(artist, address(newV1), snapshotPrice, snapshotOwner, address(oldV1));
    }

    function restore() public payable virtual {
        require(msg.sender == snapshotOwner, 'Only snapshot owner may restore artwork');
        // 0,00000000001 ETH for old steward deposit.
        uint256 valueToSend = snapshotPrice + 10000000 wei; // no need to safemath

        require(msg.value >= (valueToSend + 0.5 ether), 'Not enough ETH for restoration');
        require(restored == false, "Can only restore once.");

        // buy oldV1
        // this will block it, effectively forever, due to this contract not being able to receive ETH from a transfer.
        // Damanged v1 has an open deposit function, so it can effectively be locked in perpetuity. 
        oldArtSteward.buy{value: valueToSend}(100 wei);
        // NOTE: will last 2 million years with 10000000 wei deposit at 100 wei price.

        newArtSteward.restore{value: 0.5 ether}();

        //send back any excess ETH
        if(msg.value > (valueToSend + 0.5 ether)) {
            msg.sender.transfer(msg.value - valueToSend - 0.5 ether);
        }

        restored = true;
    }

}