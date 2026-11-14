// SPDX-License-Identifier: MIT
pragma solidity >=0.6.2 <0.7.0;
pragma experimental ABIEncoderV2;

// Ported from packages/hardhat/v2_tests/steward_owed.js (V2 artwork, 100% patronage).
import "forge-std/Test.sol";
import "../src/v2/ArtSteward.sol";
import "../src/v2/ERC721.sol";
import "../src/v2/BlockReceiver.sol";
import "../src/v2/Router.sol";

contract ArtStewardV2Test is Test {
    ERC721 public artwork;
    ArtSteward public steward;

    address payable public artist;
    address payable public patron1;
    address payable public patron2;

    uint256 constant ETH1 = 1 ether;
    uint256 constant ETH2 = 2 ether;
    uint256 constant ETH3 = 3 ether;
    uint256 constant ETH4 = 4 ether;
    uint256 constant YEAR = 31536000; // 365 days

    // 10 min due at 1 ETH price with 100% patronage
    uint256 constant TenMinDue = 19025875190258;
    uint256 constant TenMinOneSecDue = 19057584982242;

    function setUp() public {
        artist = payable(makeAddr("artist"));
        patron1 = payable(makeAddr("patron1"));
        patron2 = payable(makeAddr("patron2"));
        vm.deal(patron1, 100 ether);
        vm.deal(patron2, 100 ether);

        artwork = new ERC721();
        steward = new ArtSteward(artist, address(artwork));
    }

    function calculateDue(uint256 price, uint256 timeElapsed) internal pure returns (uint256) {
        return (price * timeElapsed) / YEAR;
    }

    function buyAs(address buyer, uint256 newPrice, uint256 value) internal {
        uint256 currentPrice = steward.price();
        vm.prank(buyer);
        steward.buy{value: value}(newPrice, currentPrice);
    }

    // --- Initialization ---

    function testArtworkMinted() public {
        assertEq(artwork.symbol(), "TAIAOS2");
        assertEq(artwork.ownerOf(42), address(steward));
        assertEq(artwork.tokenURI(42), "https://thisartworkisalwaysonsale.com/metadata2");
    }

    function testInitTimeHeldAndForeclosureTimeZero() public {
        assertEq(steward.timeHeld(address(steward)), 0);
        assertEq(steward.foreclosureTime(), 0);
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

    function testBuyWithZeroWei() public {
        vm.expectRevert("Not enough");
        steward.buy{value: 0}(1000, 0);
    }

    function testBuyWithZeroPrice() public {
        vm.expectRevert("Price is zero");
        steward.buy{value: ETH1}(0, 0);
    }

    // --- Buying ---

    function testBuySuccess() public {
        buyAs(patron1, ETH1, ETH1);

        assertEq(artwork.ownerOf(42), patron1);
        assertEq(steward.deposit(), ETH1);
        assertEq(steward.price(), ETH1);
        assertEq(steward.pullFunds(patron1), 0);
    }

    function testBuyWithIncorrectCurrentPrice() public {
        buyAs(patron1, ETH1, ETH1);

        vm.prank(patron2);
        vm.expectRevert("Current Price incorrect");
        steward.buy{value: ETH2}(ETH1, 0);
    }

    function testBuyFromAnotherAccountRefundsPreviousPatron() public {
        buyAs(patron1, ETH1, ETH2); // initial price is 0, so the full 2 ETH is deposit
        uint256 balanceBefore = patron1.balance;

        vm.warp(block.timestamp + 10 minutes);
        buyAs(patron2, ETH1, ETH2);

        // previous patron gets price + remaining deposit back
        assertEq(patron1.balance - balanceBefore, ETH1 + ETH2 - TenMinDue);
        assertEq(artwork.ownerOf(42), patron2);
        assertEq(steward.deposit(), ETH1);
        assertEq(steward.timeHeld(patron1), 10 minutes);
    }

    // --- Patronage (100% rate) ---

    function testPatronageOwedAfter10Min() public {
        buyAs(patron1, ETH1, ETH1);
        vm.warp(block.timestamp + 10 minutes);
        assertEq(steward.patronageOwed(), TenMinDue);
        assertEq(steward.patronageOwed(), calculateDue(ETH1, 10 minutes));
    }

    function testPatronageOwedAfter1YearEqualsPrice() public {
        buyAs(patron1, ETH1, ETH2);
        vm.warp(block.timestamp + YEAR);
        assertEq(steward.patronageOwed(), ETH1);
    }

    function testCollectPatronageAfter10Min() public {
        buyAs(patron1, ETH1, ETH1);
        vm.warp(block.timestamp + 10 minutes);
        steward._collectPatronage();

        assertEq(steward.deposit(), ETH1 - TenMinDue);
        assertEq(steward.artistFund(), TenMinDue);
        assertEq(steward.totalCollected(), TenMinDue);
        assertEq(steward.timeLastCollected(), block.timestamp);
    }

    function testForeclosureTimeIs10MinOut() public {
        buyAs(patron1, ETH1, TenMinDue);
        assertEq(steward.foreclosureTime(), block.timestamp + 10 minutes);
    }

    function testCollectForeclosesExactlyAt10Min() public {
        uint256 start = block.timestamp;
        buyAs(patron1, ETH1, TenMinDue);
        vm.warp(start + 10 minutes);
        assertTrue(steward.foreclosed());

        steward._collectPatronage();

        assertEq(artwork.ownerOf(42), address(steward));
        assertEq(steward.deposit(), 0);
        assertEq(steward.price(), 0);
        assertEq(steward.artistFund(), TenMinDue);
        assertEq(steward.timeHeld(patron1), 10 minutes);
    }

    function testLateCollectionBackdatesForeclosure() public {
        uint256 start = block.timestamp;
        buyAs(patron1, ETH1, TenMinDue);
        vm.warp(start + 20 minutes);

        // foreclosureTime() backdates to when the deposit ran out
        assertEq(steward.foreclosureTime(), start + 10 minutes);
        steward._collectPatronage();

        assertEq(steward.timeLastCollected(), start + 10 minutes);
        assertEq(steward.artistFund(), TenMinDue); // only what the deposit covered
        assertEq(steward.timeHeld(patron1), 10 minutes);
    }

    function testBuyFromForeclosedPatron() public {
        uint256 start = block.timestamp;
        buyAs(patron1, ETH1, TenMinOneSecDue);
        vm.warp(start + 10 minutes + 1);

        // price() still reads 1 ETH, but buy() collects first, which forecloses and zeroes the price.
        // So the buyer must pass 0 as _currentPrice.
        assertTrue(steward.foreclosed());
        assertEq(steward.price(), ETH1);

        vm.prank(patron2);
        vm.expectRevert("Current Price incorrect");
        steward.buy{value: ETH1}(ETH2, ETH1);

        vm.prank(patron2);
        steward.buy{value: ETH1}(ETH2, 0);

        assertEq(artwork.ownerOf(42), patron2);
        assertEq(steward.price(), ETH2);
        assertEq(steward.deposit(), ETH1);
        assertEq(steward.artistFund(), TenMinOneSecDue);
    }

    // --- Patron actions ---

    function testChangePrice() public {
        buyAs(patron1, ETH1, ETH2);
        vm.prank(patron1);
        steward.changePrice(ETH3);
        assertEq(steward.price(), ETH3);
    }

    function testChangePriceToZeroFails() public {
        buyAs(patron1, ETH1, ETH2);
        vm.prank(patron1);
        vm.expectRevert("Price is zero");
        steward.changePrice(0);
    }

    function testWithdrawSomeDeposit() public {
        buyAs(patron1, ETH1, ETH3); // deposit 3
        vm.prank(patron1);
        steward.withdrawDeposit(ETH1);
        assertEq(steward.deposit(), ETH2);
    }

    function testWithdrawTooMuchFails() public {
        buyAs(patron1, ETH1, ETH2);
        vm.prank(patron1);
        vm.expectRevert("Withdrawing too much");
        steward.withdrawDeposit(ETH3);
    }

    function testWithdrawByNonPatronFails() public {
        buyAs(patron1, ETH1, ETH2);
        vm.prank(patron2);
        vm.expectRevert("Not patron");
        steward.withdrawDeposit(ETH1);
    }

    function testExitForecloses() public {
        buyAs(patron1, ETH1, ETH2);
        vm.warp(block.timestamp + 10 minutes);
        vm.prank(patron1);
        steward.exit();

        assertEq(artwork.ownerOf(42), address(steward));
        assertEq(steward.deposit(), 0);
        assertEq(steward.price(), 0);
    }

    function testArtistWithdrawsFunds() public {
        buyAs(patron1, ETH1, ETH1);
        vm.warp(block.timestamp + 10 minutes);
        steward._collectPatronage();

        vm.prank(artist);
        steward.withdrawArtistFunds();
        assertEq(artist.balance, TenMinDue);
        assertEq(steward.artistFund(), 0);
    }

    function testWithdrawArtistFundsByNonArtistFails() public {
        vm.expectRevert("Not artist");
        steward.withdrawArtistFunds();
    }

    // --- Contracts that can't receive ETH ---

    function testBlockerSaleGoesToPullFunds() public {
        BlockReceiver blocker = new BlockReceiver(address(steward));
        blocker.buy{value: ETH1}(0); // blocker sets price 1 ETH, deposit 1 ETH
        assertEq(artwork.ownerOf(42), address(blocker));

        vm.warp(block.timestamp + 1);
        buyAs(patron2, ETH1, ETH2);

        assertEq(artwork.ownerOf(42), patron2);
        assertEq(steward.pullFunds(address(blocker)), ETH2 - calculateDue(ETH1, 1));

        // the blocker still can't receive its pull funds
        vm.expectRevert();
        blocker.withdrawPullFunds();
    }

    function testRouterCanWithdrawPullFundsOnceUnblocked() public {
        Router router = new Router(address(steward));
        router.buy{value: ETH1}(0);

        vm.warp(block.timestamp + 1);
        buyAs(patron2, ETH1, ETH2);
        uint256 pulled = steward.pullFunds(address(router));
        assertEq(pulled, ETH2 - calculateDue(ETH1, 1));

        vm.expectRevert("blocked");
        router.withdrawPullFunds();

        router.setBlock(false);
        router.withdrawPullFunds();
        assertEq(address(router).balance, pulled);
        assertEq(steward.pullFunds(address(router)), 0);
    }

    // --- Fuzz ---

    function testFuzz_Buy(uint256 price) public {
        vm.assume(price > 0 && price < 1e30);
        buyAs(patron1, price, ETH1);
        assertEq(steward.price(), price);
        assertEq(steward.deposit(), ETH1);
    }
}
