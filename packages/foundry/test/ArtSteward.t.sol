// SPDX-License-Identifier: MIT
pragma solidity >=0.6.0 <0.8.0;
pragma experimental ABIEncoderV2;

import "forge-std/Test.sol";
import "../src/v1/ArtSteward.sol";
import "../src/v1/ERC721.sol";
import "../src/v1/oldArtSteward.sol";
import "../src/v1/Restorer.sol";
import "../src/v1/BlockReceiver.sol";
import "../src/v1/Router.sol";

contract ArtStewardTest is Test {
    ERC721 public artwork;
    ERC721 public oldArtwork;
    ArtSteward public steward;
    oldArtSteward public oldSteward;
    Restorer public restorer;
    BlockReceiver public blocker;
    Router public router;

    address public artist = address(0x1);
    address public patron1 = address(0x2);
    address public patron2 = address(0x3);
    address public patron3 = address(0x4);

    uint256 constant ETH1 = 1 ether;
    uint256 constant ETH2 = 2 ether;
    uint256 constant ETH3 = 3 ether;
    uint256 constant ETH150 = 150 ether;

    // 5% patronage constants
    uint256 constant NUMERATOR = 50000000000; // 5%
    uint256 constant DENOMINATOR = 1000000000000;
    uint256 constant YEAR = 31536000; // 365 days

    // 10 min due at 1 ETH price with 5% patronage
    uint256 constant TenMinDue = 951293759512;
    uint256 constant TenMinOneSecDue = 952879249112;

    function setUp() public {
        // Give ETH to test accounts
        vm.deal(artist, 100 ether);
        vm.deal(patron1, 100 ether);
        vm.deal(patron2, 100 ether);
        vm.deal(patron3, 100 ether);

        // Deploy old artwork and steward
        oldArtwork = new ERC721();
        oldSteward = new oldArtSteward(artist, address(oldArtwork));

        // Patron1 buys old artwork
        vm.prank(patron1);
        oldSteward.buy{value: ETH1}(ETH150);

        // Deploy restorer
        restorer = new Restorer(address(oldArtwork), address(oldSteward), artist);

        // Get new artwork and steward addresses
        address artworkAddress = restorer.newV1();
        address stewardAddress = restorer.newArtSteward();

        artwork = ERC721(artworkAddress);
        steward = ArtSteward(payable(stewardAddress));

        // Restore (patron1 needs to call this)
        uint256 valueToSend = ETH150 + ETH1; // 150 + deposit
        vm.prank(patron1);
        restorer.restore{value: valueToSend}();

        // Foreclose and reset for clean tests
        vm.prank(patron1);
        steward.exit();

        vm.prank(artist);
        steward.withdrawArtistFunds();
    }

    function calculateDue(uint256 price, uint256 timeElapsed) internal pure returns (uint256) {
        return (price * timeElapsed * NUMERATOR) / DENOMINATOR / YEAR;
    }

    // --- Initialization Tests ---

    function testArtworkMinted() public {
        assertEq(artwork.symbol(), "TAIAOS");
        assertEq(artwork.ownerOf(42), address(steward));
        assertEq(artwork.tokenURI(42), "https://thisartworkisalwaysonsale.com/metadata");
    }

    function testDepositWeiFailWhenForeclosed() public {
        vm.prank(patron1);
        vm.expectRevert("Not patron");
        steward.depositWei{value: ETH1}();
    }

    function testChangePriceFailWhenNotPatron() public {
        vm.expectRevert("Not patron");
        steward.changePrice(500);
    }

    function testWithdrawDepositFailWhenNotPatron() public {
        vm.expectRevert("Not patron");
        steward.withdrawDeposit(10);
    }

    function testBuyWithZeroWei() public {
        vm.expectRevert();
        steward.buy{value: 0}(1000, 0);
    }

    function testBuyWithZeroPrice() public {
        vm.expectRevert("Price is zero");
        steward.buy{value: ETH1}(0, 0);
    }

    // --- Buy Tests ---

    function testBuySuccess() public {
        vm.prank(patron2);
        steward.buy{value: ETH1}(ETH1, 0);

        assertEq(steward.deposit(), ETH1);
        assertEq(steward.price(), ETH1);
        assertEq(steward.pullFunds(patron2), 0);
    }

    function testBuyWithIncorrectCurrentPrice() public {
        vm.prank(patron2);
        vm.expectRevert("Current Price incorrect");
        steward.buy{value: ETH1}(ETH1, ETH1); // current price is 0, not 1 ETH
    }

    // --- Transfer Tests ---

    function testTransferWithoutStewardFails() public {
        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.prank(patron2);
        vm.expectRevert("ERC721: transfer caller is not steward.");
        artwork.transferFrom(patron2, patron1, 42);
    }

    // --- Patronage Tests ---

    function testPatronageOwedAfter1Second() public {
        vm.prank(patron2);
        steward.buy{value: ETH1}(ETH1, 0);

        uint256 timeLastCollected = steward.timeLastCollected();

        vm.warp(block.timestamp + 1);

        (uint256 owed, uint256 timestamp) = steward.patronageOwedWithTimestamp();
        uint256 expectedDue = calculateDue(ETH1, timestamp - timeLastCollected);

        assertEq(owed, expectedDue);
    }

    function testPatronageOwedAfter1Year() public {
        vm.prank(patron2);
        steward.buy{value: ETH1}(ETH1, 0);

        vm.warp(block.timestamp + 365 days);

        (uint256 owed, ) = steward.patronageOwedWithTimestamp();

        // 5% of 1 ETH = 0.05 ETH
        assertEq(owed, 50000000000000000);
    }

    // --- Collection Tests ---

    function testCollectPatronageAfter10Min() public {
        vm.prank(patron2);
        steward.buy{value: ETH1}(ETH1, 0);

        uint256 preTime = block.timestamp;
        uint256 preDeposit = steward.deposit();

        vm.warp(block.timestamp + 10 minutes);

        steward._collectPatronage();

        uint256 latestTime = block.timestamp;
        uint256 due = calculateDue(preDeposit, latestTime - preTime);

        assertEq(steward.deposit(), ETH1 - due);
        assertEq(steward.artistFund(), due);
        assertEq(steward.timeLastCollected(), latestTime);
    }

    // --- Foreclosure Tests ---

    function testForeclosureAfter10Min() public {
        vm.prank(patron2);
        steward.buy{value: TenMinOneSecDue}(ETH1, 0);

        vm.warp(block.timestamp + 10 minutes);

        steward._collectPatronage();

        assertEq(artwork.ownerOf(42), address(steward));
        assertEq(steward.deposit(), 0);
        assertEq(steward.price(), 0);
    }

    // --- Price Change Tests ---

    function testChangePriceToZeroFails() public {
        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.prank(patron2);
        vm.expectRevert("Price is zero");
        steward.changePrice(0);
    }

    function testChangePriceSuccess() public {
        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.prank(patron2);
        steward.changePrice(ETH3);

        assertEq(steward.price(), ETH3);
    }

    function testChangePriceByNonPatronFails() public {
        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.prank(patron3);
        vm.expectRevert("Not patron");
        steward.changePrice(ETH2);
    }

    // --- Deposit Tests ---

    function testWithdrawSomeDeposit() public {
        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.prank(patron2);
        steward.withdrawDeposit(ETH1);

        uint256 oneSecDue = calculateDue(ETH1, 1);
        assertEq(steward.deposit(), ETH2 - ETH1 - oneSecDue);
    }

    function testWithdrawTooMuchFails() public {
        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.prank(patron2);
        vm.expectRevert("Withdrawing too much");
        steward.withdrawDeposit(ETH3);
    }

    function testExitForecloses() public {
        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.warp(block.timestamp + 10 minutes);

        vm.prank(patron2);
        steward.exit();

        assertEq(steward.price(), 0);
        assertEq(artwork.ownerOf(42), address(steward));
    }

    // --- Buy Again Tests ---

    function testBuyAgainFromSameAccount() public {
        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, ETH1);

        assertEq(steward.deposit(), ETH1);
        assertEq(steward.price(), ETH1);
        assertEq(artwork.ownerOf(42), patron2);
    }

    function testBuyFromAnotherAccount() public {
        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.prank(patron3);
        steward.buy{value: ETH2}(ETH1, ETH1);

        assertEq(steward.deposit(), ETH1);
        assertEq(steward.price(), ETH1);
        assertEq(artwork.ownerOf(42), patron3);
    }

    // --- Fuzz Tests ---

    function testFuzz_Buy(uint256 price) public {
        vm.assume(price > 0 && price < 1000 ether);

        uint256 deposit = price + 1 ether;
        vm.deal(patron2, deposit);

        vm.prank(patron2);
        steward.buy{value: deposit}(price, 0);

        assertEq(steward.price(), price);
        assertEq(artwork.ownerOf(42), patron2);
    }

    function testFuzz_ChangePrice(uint256 newPrice) public {
        vm.assume(newPrice > 0 && newPrice < 1000 ether);

        vm.prank(patron2);
        steward.buy{value: ETH2}(ETH1, 0);

        vm.prank(patron2);
        steward.changePrice(newPrice);

        assertEq(steward.price(), newPrice);
    }
}
