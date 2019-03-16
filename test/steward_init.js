const { BN, shouldFail, ether, expectEvent, balance, time } = require('openzeppelin-test-helpers');

const Artwork = artifacts.require('./ERC721Full.sol');
const ArtSteward = artifacts.require('./ArtSteward.sol');

const delay = duration => new Promise(resolve => setTimeout(resolve, duration));

contract('ArtSteward', (accounts) => {

  let artwork;
  let steward;
  
  beforeEach(async () => {
    artwork = await Artwork.new("TESTARTWORK", "TA");
    steward = await ArtSteward.new(accounts[1], artwork.address, { from: accounts[0]});
  });

  it('steward: init: artwork minted', async () => {
    const currentOwner = await artwork.ownerOf.call(42);
    const uri = await artwork.tokenURI(42);
    assert.equal(uri, "https://thisartworkisalwaysonsale.com/metadata");
    assert.equal(steward.address, currentOwner);
  });

  it('steward: init: retry setup (fail)', async () => {
    await shouldFail.reverting.withMessage(artwork.setup({ from: accounts[0]}), "Already initialized");
  });

  it('steward: init: deposit wei fail [foreclosed]', async () => {
    await shouldFail.reverting.withMessage(steward.depositWei({ from: accounts[2], value: web3.utils.toWei('1', 'ether')}), "Foreclosed");
  });

  it('steward: init: wait time. deposit wei fail [foreclosed]', async () => {
    await time.increase(1000); // 1000 seconds, arbitrary
    await shouldFail.reverting.withMessage(steward.depositWei({ from: accounts[2], value: web3.utils.toWei('1', 'ether')}), "Foreclosed");
  });

  it('steward: init: change price fail [not patron]', async () => {
    await shouldFail.reverting.withMessage(steward.changePrice(500, { from: accounts[2] }), "Not patron");
  });

  it('steward: init: collect 0 patronage.', async () => {
    const totalBefore = await steward.totalCollected.call();
    await time.increase(1000); // 1000 seconds, arbitrary
    await steward._collectPatronage({ from: accounts[2] });
    const totalAfter = await steward.totalCollected.call();
    assert.equal(totalBefore.toString(), totalAfter.toString());
  });

  it('steward: init: withdraw deposit [not patron]', async () => {
    await shouldFail.reverting.withMessage(steward.withdrawDeposit(10, { from: accounts[2] }), "Not patron");
  });

  it('steward: init: buy with zero wei [fail payable]', async () => {
    await shouldFail.reverting(steward.buy(1000, { from: accounts[2], value: web3.utils.toWei('0', 'ether') }));
  });

  it('steward: init: buy with 1 ether but 0 price [fail on price]', async () => {
    await shouldFail.reverting.withMessage(steward.buy(0, { from: accounts[2], value: web3.utils.toWei('1', 'ether') }), "Price is zero");
  });

  it('steward: init: buy with 2 ether, price of 1 success [price = 1 eth, deposit = 1 eth]', async () => {
    const { logs } = await steward.buy(web3.utils.toWei('1', 'ether'), { from: accounts[2], value: web3.utils.toWei('1', 'ether') });
    expectEvent.inLogs(logs, 'LogBuy', { owner: accounts[2], price: ether('1')});
    const deposit = await steward.deposit.call();
    const price = await steward.price.call();
    const state = await steward.state.call();
    assert.equal(deposit, web3.utils.toWei('1', 'ether'));
    assert.equal(price, web3.utils.toWei('1', 'ether'));
    assert.equal(state, 1);
  });
});