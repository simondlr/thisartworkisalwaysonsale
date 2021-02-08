const { time, balance } = require('@openzeppelin/test-helpers');

const delay = duration => new Promise(resolve => setTimeout(resolve, duration));
const { expect } = require("chai");  

const { loadFixture } = require('ethereum-waffle');
const { ethers } = require('hardhat');

let ERC721;
let ArtSteward;
let OldSteward;
let Blocker;
let Blocker2;
let Restorer;

const ETH0 = ethers.BigNumber.from('0');
const ETH1 = ethers.utils.parseEther('1');
const ETH2 = ethers.utils.parseEther('2');
const ETH3 = ethers.utils.parseEther('3');
const ETH4 = ethers.utils.parseEther('4');
const ETH150 = ethers.utils.parseEther('150');

// for 5% patronage
const TenMinDue = ethers.BigNumber.from('951293759512'); // price of 1 ETH
const TenMinOneSecDue = ethers.BigNumber.from('952879249112'); // price of 1 ETH

// for 100% patronage
// const TenMinDue = ethers.BigNumber.from('19025875190258'); // price of 1 ETH
// const TenMinOneSecDue = ethers.BigNumber.from('19057584982242'); // price of 1 ETH
const numerator = ethers.BigNumber.from('50000000000'); // 5 %
const denominator = ethers.BigNumber.from('1000000000000');
const year = ethers.BigNumber.from('31536000'); // 365 days

async function stringTimeLatest() {
  const timeBN = await time.latest();
  return timeBN.toString();
}

async function bigTimeLatest() {
  const STL = await stringTimeLatest();
  return ethers.BigNumber.from(STL);
}

function calculateDue(price, initTime, endTime) {
  // price * (now - timeLastCollected) * patronageNumerator/ patronageDenominator / 365 days;
  const due = price.mul(endTime.sub(initTime)).mul(numerator).div(denominator).div(year);
  return due;
}

/*NOTE
Note on 1 second deviations.
In some instances a second is added or taken off some calculations.
These discrepancies are due to two reasons:
1) precision errors + integers with both JS + Sol.
2) evm_mine increments timestamps by 1 sec, which means that it can actually change the rounding error.
Example: 

If: deposit amounts to TenMinOneSec, and foreclosureTime() is checked before evm_mine then an answer could be:
1200×952879249112÷1902587519025 (20min elapsed time multiplied by 10min1sec deposit divided by what should've been collected for 20min)
Answer: 601,000000000197
AFTER the evm_mine (adds 1 sec after 20min), the calculation changes to:
1201×952879249112÷1904173008625 (elapsed time gets one sec and supposed collection increases too).
Answer: 600,999999999941

Thus, while it's suppposed to both be 601, the latter ends up at 600 due to remainder being thrown away.

This does not materially impact functioning of the contract or the tests.
*/

describe("TAIAOS_restored_v1", function() {
  let oldSteward;
  let oldArtwork;
  let restorer;

  let artwork;
  let steward;
  let blocker;
  let blocker2;
  let provider;
  let signers;
  let accounts;
  let snapshot;
  let preCollected;
  const gasLimit = 9500000; // if gas limit is set, it doesn't superfluosly run estimateGas, slowing tests down.

  let snapshotPrice;
  let snapshotOwner;
  let transferredPrice;
  let transferredOwner;
  let oldRestoredOwner;
  let oldRestoredPrice;

  let postRestoreBal;
  let calcPostRestoreBal;

  this.beforeAll(async function() {
    provider = new ethers.providers.Web3Provider(web3.currentProvider);
    signers = await ethers.getSigners();
    accounts = await Promise.all(signers.map(async function(signer) {return await signer.getAddress(); }));

    ERC721 = await ethers.getContractFactory("ERC721");
    // OLD contracts
    OldSteward = await ethers.getContractFactory('oldArtSteward');
    // NOTE: it's okay to use new ERC721 ABI, since this does not change functionality for the tests.
    OldArtwork = await ethers.getContractFactory('ERC721');
    oldArtwork = await ERC721.deploy({gasLimit});
    await oldArtwork.deployed();
    // artist, artwork
    oldSteward = await OldSteward.deploy(accounts[0], oldArtwork.address, {gasLimit});
    await oldSteward.deployed();

    // buy old artwork (init price is zero)
    await oldSteward.connect(signers[1]).buy(ETH150, {value: ETH1});

    // NEW contracts
    ArtSteward = await ethers.getContractFactory("ArtSteward");
    Restorer = await ethers.getContractFactory("Restorer");
    Blocker = await ethers.getContractFactory('BlockReceiver');
    Blocker2 = await ethers.getContractFactory('Router');

    // deploy Restorer
    restorer = await Restorer.deploy(oldArtwork.address, oldSteward.address, accounts[0], {gasLimit});
    const td = await restorer.deployed();
    console.log(td.deployTransaction.hash);
    const gasPrice = ethers.BigNumber.from('1000000000'); 
    const tdReceipt = await provider.getTransactionReceipt(td.deployTransaction.hash);
    const tdCost = ethers.BigNumber.from(tdReceipt.gasUsed).mul(gasPrice); // gas used * gas price
    // console.log(ethers.utils.formatEther(tdCost).toString());
    // 0.5 eth at 100 gwei

    // new artwork addresses
    const artworkAddress = await restorer.newV1();
    const stewardAddress = await restorer.newArtSteward();

    // attach ERC721 + ArtSteward from deployment
    artwork = ERC721.attach(artworkAddress);
    steward = ArtSteward.attach(stewardAddress);

    // await steward.connect(signers[1]).restore(); // will fail but can't test inside beforeAll. Comment out to test.
    // err: revert RESTORE: Can only be restored by restoration contract

    // save vars for tests
    snapshotPrice = await restorer.snapshotPrice();
    snapshotOwner = await restorer.snapshotOwner();

    // restore (and deploy) new artworks
    const preRestoreBal = await balance.tracker(accounts[1]);
    const preDeposit = await oldSteward.deposit();

    const valueToSend = ETH150.add(ETH1); // 150 + oldv1 deposit + newv1 deposit (0.5 eth)

    const tx = await restorer.connect(signers[1]).restore({gasPrice, value: valueToSend, gasLimit}); // 1 gwei gas
    const txReceipt = await provider.getTransactionReceipt(tx.hash);
    const txCost = ethers.BigNumber.from(txReceipt.gasUsed).mul(gasPrice); // gas used * gas price
    // // 0.04 ETH on 100 gwei

    postRestoreBal = await preRestoreBal.delta();

    // acc 1 -> get deposit back - - oldv1deposit - newv1 deposit
    // patronage on oldSteward is 2 seconds because two transactions mined:
    // deployment of restorer
    // restore() 
    const oldv1deposit = ethers.BigNumber.from('10000000');
    const patronageForTwoSeconds = await calculateDue(ETH150, ethers.BigNumber.from('0'), ethers.BigNumber.from('2')); // one second rest
    calcPostRestoreBal = preDeposit.sub(patronageForTwoSeconds).sub(oldv1deposit).sub(ethers.utils.parseEther('0.5')).sub(txCost);

    oldRestoredOwner = await oldArtwork.ownerOf(42);
    oldRestoredPrice = await oldSteward.price();

    transferredPrice = await steward.price();
    transferredOwner = await artwork.ownerOf(42);

    // foreclose artwork to ensure the rest of the tests still work fine.
    await steward.connect(signers[1]).exit({gasLimit});
    // artist withdraw funds to reset to zero
    await steward.connect(signers[0]).withdrawArtistFunds({gasLimit});
    preCollected = await steward.totalCollected();

    snapshot = await provider.send('evm_snapshot', []);
  });

 this.beforeEach(async function() {
    await provider.send('evm_revert', [snapshot]);
    snapshot = await provider.send('evm_snapshot', []);
  });

  it('steward: restoration tests', async () => {
    expect(snapshotPrice.toString()).to.equal(ETH150.toString());
    expect(snapshotOwner).to.equal(accounts[1]);

    expect(oldRestoredOwner).to.equal(restorer.address);
    expect(oldRestoredPrice).to.equal(ethers.BigNumber.from('100'));

    const ETH151 = ETH150.add(ETH1);
    await expect(restorer.connect(signers[2]).restore({value: ETH2, gasLimit})).to.be.revertedWith('Only snapshot owner may restore artwork');
    await expect(restorer.connect(signers[1]).restore({value: ETH2, gasLimit})).to.be.revertedWith('Not enough ETH for restoration');
    await expect(restorer.connect(signers[1]).restore({value: ETH151, gasLimit})).to.be.revertedWith('Can only restore once');

    // restoration correctly restored snapshot
    expect(transferredOwner).to.equal(snapshotOwner);
    expect(transferredPrice).to.equal(snapshotPrice);

    // test block buy
    await expect(oldSteward.connect(signers[3]).buy(ETH2, {value: ETH1})).to.be.revertedWith("function selector was not recognized and there's no fallback nor receive function");

    // test steward restore blocker
    await expect(steward.connect(signers[1]).restore({value: ETH1})).to.be.revertedWith("RESTORE: Artwork already restored");

    // test ETH sent back
    expect(postRestoreBal.toString()).to.equal(calcPostRestoreBal.toString());
  });

  it('steward: init: artwork minted', async () => {
    expect(await artwork.symbol()).to.equal("TAIAOS");
    expect(steward.address).to.equal(await artwork.ownerOf(42));
    expect(await artwork.tokenURI(42)).to.equal("https://thisartworkisalwaysonsale.com/metadata");
  });


  /*it('steward: init: retry setup (fail)', async () => {
    await expect(artwork.setup()).to.be.revertedWith('Artwork already initialized.');
    await expect(steward.setup(accounts[0], artwork.address)).to.be.revertedWith('Steward already initialized.');
  });*/
  
  
  it('steward: init: deposit wei fail [foreclosed]', async () => {
    await expect(steward.connect(signers[1]).depositWei({value: ethers.utils.parseEther('1')})).to.be.revertedWith('Not patron');
  });

  it('steward: init: change price fail [not patron]', async () => {
    await expect(steward.changePrice(500)).to.be.revertedWith("Not patron");
  });

  it('steward: init: withdraw deposit [not patron]', async () => {
    await expect(steward.withdrawDeposit(10)).to.be.revertedWith("Not patron");
  });

  it('steward: init: buy with zero wei [fail payable]', async () => {
    await expect(steward.buy(1000, ETH0, { value: ethers.utils.parseEther('0') })).to.be.reverted;
  });
  
  it('steward: init: buy with 1 ether but 0 price [fail on price]', async () => {
    await expect(steward.buy(0, ETH0, { value: ethers.utils.parseEther('1')})).to.be.revertedWith("Price is zero");
  });

  it('steward: init: buy with 2 ether, price of 1 success [price = 1 eth, deposit = 1 eth]', async () => {
    await expect(steward.connect(signers[2]).buy(ethers.utils.parseEther('1'), ETH0, { value: ethers.utils.parseEther('1') }))
      .to.emit(steward, 'LogBuy')
      .withArgs(accounts[2], ethers.utils.parseEther('1'));
    
    expect(await steward.deposit()).to.equal(ethers.utils.parseEther('1'));
    expect(await steward.price()).to.equal(ethers.utils.parseEther('1'));
    expect(await steward.pullFunds(accounts[2])).to.equal(ETH0);
  });

  it('steward+blocker: withdraw pull funds fail', async() => {
    blocker = await Blocker.deploy(steward.address, {gasLimit}); 
    await blocker.deployed();
    await blocker.buy(ETH0, {value: ETH1, gasLimit});
    await expect(blocker.withdrawPullFunds({gasLimit}))
      .to.be
      .reverted; // couldn't receive back funds due to blocking
  });

  it('steward+blocker: buy with blocker then buy from another account', async() => {
    blocker = await Blocker.deploy(steward.address, {gasLimit}); 
    await blocker.deployed();

    // blocker will buy at price of 1 ETH (0 in contract)
    // thus: deposit should be ETH1.
    await blocker.buy(ETH0, {value: ETH1, gasLimit});

    const currentOwner = await artwork.ownerOf(42);
    const currentDeposit = await steward.deposit();
    expect(currentOwner).to.equal(blocker.address);
    expect(currentDeposit).to.equal(ETH1);

    // new buyer buys with 2 ETH, with price at 1 ETH.
    // thus: 2-1 = deposit should be 1 ETH.
    await steward.connect(signers[2]).buy(ETH1, ETH1, {value: ETH2, gasLimit});

    const finalOwner = await artwork.ownerOf(42);
    const deposit = await steward.deposit();
    const pullFunds = await steward.pullFunds(blocker.address);

    const oneSecDue = calculateDue(ETH1, ethers.BigNumber.from('0'), ethers.BigNumber.from('1'));

    expect(finalOwner).to.equal(accounts[2]);
    expect(deposit).to.equal(ETH1); 
    expect(pullFunds).to.equal(ETH2.sub(oneSecDue));

  });

  it('steward+blocker: failed to receive funds. correct it. receive withdrawpullfunds', async() => {
    blocker = await Blocker2.deploy(steward.address, {gasLimit}); 
    await blocker.deployed();
    await blocker.buy(ETH0, {value: ETH1, gasLimit});
    await steward.connect(signers[2]).buy(ETH1, ETH1, {value: ETH2, gasLimit}); // new buyer

    const deposit = await steward.deposit();
    const pullFunds = await steward.pullFunds(blocker.address); 
    const oneSecDue = calculateDue(ETH1, ethers.BigNumber.from('0'), ethers.BigNumber.from('1'));
    expect(deposit).to.equal(ETH1); 
    expect(pullFunds).to.equal(ETH2.sub(oneSecDue));

    await expect(blocker.withdrawPullFunds({gasLimit}))
      .to.be
      .revertedWith('blocked'); // couldn't receive back funds due to blocking
    
    await blocker.setBlock(false); 

    expect(await blocker.toBlock()).to.equal(false);

    await blocker.withdrawPullFunds({gasLimit});

    const b = await balance.current(blocker.address);
    expect(b.toString()).to.equal(pullFunds.toString());
  });

  it('steward+blocker: double pull funds additions', async() => {
    blocker = await Blocker.deploy(steward.address, {gasLimit}); 
    await blocker.deployed();
    await blocker.buy(ETH0, {value: ETH1, gasLimit});

    // 1 second should pass
    // new buyer buys with 2 ETH, with price at 1 ETH.
    // thus: 2-1 = deposit should be 1 ETH.
    await steward.connect(signers[2]).buy(ETH1, ETH1, {value: ETH2, gasLimit});
    
    // new buyer buys with 2 ETH, with price at 1 ETH.
    // thus: 2-1 = deposit should be 1 ETH.
    await blocker.buy(ETH1, {value: ETH2, gasLimit});

    // 1 second should pass
    // new buyer buys with 2 ETH, with price at 1 ETH.
    // thus: 2-1 = deposit should be 1 ETH.
    await steward.connect(signers[2]).buy(ETH1, ETH1, {value: ETH2, gasLimit});
    
    const pullFunds = await steward.pullFunds(blocker.address); 
    // because it was bought TWICE from the blocker
    const oneSecDue = calculateDue(ETH1, ethers.BigNumber.from('0'), ethers.BigNumber.from('1'));
    const twoSecDue = oneSecDue.add(oneSecDue); // due to rounding, it needs to be separate as the contract does collections, twice

    // 1st buy: 0 ETH old price. 1 ETH new price. 1 ETH value (1 ETH DEPOSIT).
    // 1st sale: pullFunds = 2 ETH - oneSecDue.
    // 2nd buy: 1 ETH old price. 1 ETH new price. 2 ETH value (1 ETH DEPOSIT).
    // 2nd sale: pullFunds = (2 ETH - oneSecDue) + (2 ETH - oneSecDue)
    expect(pullFunds).to.equal(ETH4.sub(twoSecDue));
  });

  
  it('steward: owned. transfer without steward (fail)', async () => {
    await expect(artwork.connect(signers[2]).transferFrom(accounts[2], accounts[1], 42, {gasLimit})).to.be.revertedWith('ERC721: transfer caller is not steward.');
  });

  it('steward: owned. check patronage owed after 1 second.', async () => {
    await steward.buy(ETH1, ETH0, { value: ETH1, gasLimit });
    //await steward.buy(ethers.BigNumber.from('1'), ETH0, { value: ethers.BigNumber.from('1'), gasLimit });

    const timeLastCollected = await steward.timeLastCollected();
    await time.increase(1);
    const owed = await steward.patronageOwedWithTimestamp();

    // price * (now - timeLastCollected) * patronageNumerator/ patronageDenominator / 365 days;
    const due = ETH1.mul(owed.timestamp.sub(timeLastCollected)).mul(numerator).div(denominator).div(year);
    //const wei1 = ethers.BigNumber.from('1');
    //const due = wei1.mul(owed.timestamp.sub(timeLastCollected)).mul(numerator).div(denominator).div(year);

    // await steward._collectPatronage();

    expect(owed.patronageDue).to.equal(due);
  });

  it('steward: test buy from 1 wei price and 1 wei deposit', async () => {
    const wei1 =  ethers.BigNumber.from('1');
    await steward.buy(wei1, ETH0, { value: wei1, gasLimit });
    await steward.connect(signers[3]).buy(wei1, wei1, {value: ETH1, gasLimit});

    expect(await artwork.ownerOf(42)).to.equal(accounts[3]);
  });

  it('steward: test buy from 1 wei price and 1 wei deposit after 20 years', async () => {
    // with a price of 1 wei, it will take 20 years to reach 1 wei deposit
    const wei1 =  ethers.BigNumber.from('1');
    await steward.connect(signers[1]).buy(wei1, ETH0, { value: wei1, gasLimit });

    const initOwnerBal = await balance.tracker(accounts[1]);
    const twentyYears = year.mul(ethers.BigNumber.from('20'));
    const twentyYearsSubTwo = twentyYears.sub(ethers.BigNumber.from('2'));
    await time.increase(twentyYearsSubTwo.toString());

    // two seconds before twenty years mean that it hasn't ticked over yet to foreclosure.
    // one second back == ticked over into foreclosure.
    await steward.connect(signers[3]).buy(wei1, wei1, {value: ETH1, gasLimit});

    const d = await initOwnerBal.delta();
    expect(d.toString()).to.equal('2'); // deposit of 1 wei back + price of 1 wei
    expect(await artwork.ownerOf(42)).to.equal(accounts[3]);

  });

  it('steward: test floor price for patronage after 1 second.', async () => {
    const minPrice = year.mul(ethers.BigNumber.from('20')); // mul 20 5% patronage
    await steward.buy(minPrice, ETH0, { value: ethers.BigNumber.from('1'), gasLimit });

    await time.increase(1);
    const owed = await steward.patronageOwedWithTimestamp();

    // price * (now - timeLastCollected) * patronageNumerator/ patronageDenominator / 365 days;
    expect(owed.patronageDue).to.equal(ethers.BigNumber.from('1'));
  });

  
  it('steward: owned. check patronage owed after 1 year.', async () => {
    await steward.buy(ETH1, ETH0, { value: ETH1, gasLimit });

    const timeLastCollected = await steward.timeLastCollected();
    await time.increase(time.duration.days(365));
    const owed = await steward.patronageOwedWithTimestamp();

    // price * (now - timeLastCollected) * patronageNumerator/ patronageDenominator / 365 days;
    const due = ETH1.mul(owed.timestamp.sub(timeLastCollected)).mul(numerator).div(denominator).div(year);

    expect(owed.patronageDue).to.equal(due);
    expect(owed.patronageDue).to.equal('50000000000000000'); // 100% over 365 days. 
  });

  it('steward: owned. buy with incorrect current price [fail].', async () => {
    await expect(steward.buy(ETH1, ETH1, { value: ETH1, gasLimit }))
      .to.be
      .revertedWith('Current Price incorrect');
  });
  
  it('steward: owned. collect patronage successfully after 10 minutes.', async () => {
    await steward.buy(ETH1, ETH0, { value: ETH1, gasLimit });

    const preTime = await bigTimeLatest();

    const preDeposit = await steward.deposit();
    await time.increase(time.duration.minutes(10));

    const owed = await steward.patronageOwedWithTimestamp();
    await steward._collectPatronage({ gasLimit }); 
    const latestTime = await bigTimeLatest();

    const deposit = await steward.deposit();
    const artistFund = await steward.artistFund();
    const timeLastCollected = await steward.timeLastCollected();
    const currentCollected =  await steward.currentCollected();
    const totalCollected =  await steward.totalCollected();

    const due = preDeposit.mul(latestTime.sub(preTime)).mul(numerator).div(denominator).div(year);

    const calcDeposit = ETH1.sub(due);
    expect(deposit).to.equal(calcDeposit); 
    expect(artistFund).to.equal(due);
    expect(timeLastCollected).to.equal(latestTime);
    expect(currentCollected).to.equal(due);
    expect(totalCollected.sub(preCollected)).to.equal(due);
  });

  
  it('steward: owned. collect patronage successfully after 10min and again after 10min.', async () => {
    await steward.buy(ETH1, ETH0, { value: ETH1, gasLimit });

    const preTime1 = await bigTimeLatest();

    await time.increase(time.duration.minutes(10));
    await steward._collectPatronage({gasLimit});

    const postTime1 = await bigTimeLatest();
    const d1 = calculateDue(ETH1, preTime1, postTime1);

    await time.increase(time.duration.minutes(10));
    await steward._collectPatronage({gasLimit});

    const postTime2 = await bigTimeLatest();
    const d2 = calculateDue(ETH1, postTime1, postTime2);

    const deposit = await steward.deposit();
    const artistFund = await steward.artistFund();
    const timeLastCollected = await steward.timeLastCollected();
    const currentCollected =  await steward.currentCollected();
    const totalCollected =  await steward.totalCollected();

    const due = d1.add(d2);
    const calcDeposit = ETH1.sub(due);

    expect(deposit).to.equal(calcDeposit); 
    expect(artistFund).to.equal(due);
    expect(timeLastCollected).to.equal(postTime2);
    expect(totalCollected.sub(preCollected)).to.equal(due);
  });

  
  it('steward: owned. collect patronage that forecloses precisely after 10min.', async () => {
    // 10min+1 of patronage
    const initDeposit = TenMinOneSecDue; // wei
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: initDeposit, gasLimit });
    const preTime = await bigTimeLatest();
    await time.increase(time.duration.minutes(10));
    await expect(steward._collectPatronage({gasLimit}))
      .to.emit(steward, 'LogForeclosure')
      .withArgs(accounts[2]); // will foreclose

    const deposit = await steward.deposit();
    const artistFund = await steward.artistFund();
    const timeLastCollected = await steward.timeLastCollected();
    const currentCollected =  await steward.currentCollected();
    const totalCollected =  await steward.totalCollected();
    const price = await steward.price();

    const latestTime = await bigTimeLatest(); 
    const due = calculateDue(ETH1, preTime, latestTime);

    const currentOwner = await artwork.ownerOf(42);

    const timeHeld = await steward.timeHeld(accounts[2]);

    const tenMinOneSec = time.duration.minutes(10).add(time.duration.seconds(1));

    expect(timeHeld.toString()).to.equal(tenMinOneSec.toString());
    expect(currentOwner).to.equal(steward.address);
    expect(deposit).to.equal(ETH0);
    expect(artistFund).to.equal(due);
    expect(timeLastCollected).to.equal(latestTime);
    expect(currentCollected).to.equal(ETH0);
    expect(totalCollected.sub(preCollected)).to.equal(due);
    expect(price).to.equal(0);
  });

  
  it('steward: owned. Deposit zero after 10min of patronage (after 10min) [success].', async () => {
    // 10min of patronage
    const initDeposit = ethers.BigNumber.from('951293759512'); // wei
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: initDeposit, gasLimit });

    await time.increase(time.duration.minutes(10));
    const deposit = await steward.deposit();
    const availableToWithdraw = await steward.depositAbleToWithdraw();

    expect(deposit.toString()).to.equal(initDeposit.toString());
    expect(availableToWithdraw.toString()).to.equal('0')
  });

  
  it('steward: owned. Foreclose Time is 10min into future on 10min patronage deposit [success].', async () => {
    // 10min of patronage
    const initDeposit = TenMinDue; // wei
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: initDeposit, gasLimit });

    const forecloseTime = await steward.foreclosureTime();
    const previousBlockTime = await time.latest();
    const finalTime = previousBlockTime.add(time.duration.minutes(10));
    expect(forecloseTime.toString()).to.equal(finalTime.toString());
  });

  
  it('steward: owned. buy from person that forecloses precisely after 10min.', async () => {
    // 10min+1 of patronage
    const initDeposit = TenMinOneSecDue; // wei
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: initDeposit, gasLimit });

    const preTime = await bigTimeLatest();

    await time.increase(time.duration.minutes(10));
    const preTimeBought = await steward.timeAcquired();

    await expect(steward.connect(signers[3]).buy(ethers.utils.parseEther('2'), ETH0, { value: initDeposit, gasLimit }))
    .to.emit(steward, 'LogForeclosure')
    .withArgs(accounts[2])
    .and.to.emit(steward, 'LogBuy')
    .withArgs(accounts[3], ethers.utils.parseEther('2')); // will foreclose + buy

    const deposit = await steward.deposit();
    const artistFund = await steward.artistFund();
    const timeLastCollected = await steward.timeLastCollected();
    const latestTime = await time.latest();
    const latestTimeBR = await bigTimeLatest();
    const currentCollected =  await steward.currentCollected();
    const totalCollected =  await steward.totalCollected();
    const price = await steward.price();

    const due = calculateDue(ETH1, preTime, latestTimeBR);

    const currentOwner = await artwork.ownerOf(42);

    const timeHeld = await steward.timeHeld(accounts[2]);
    const calcTH = timeLastCollected.sub(preTimeBought);

    expect(timeHeld.toString()).to.equal(calcTH.toString());
    expect(currentOwner).to.equal(accounts[3]);
    expect(deposit).to.equal(initDeposit);
    expect(artistFund).to.equal(due);
    expect(timeLastCollected).to.equal(latestTimeBR);
    expect(currentCollected.toString()).to.equal('0');
    expect(totalCollected.sub(preCollected)).to.equal(due);
    expect(price).to.equal(ETH2); //owned by 3
  });

  
  it('steward: owned. collect funds by artist after 10min.', async () => {
    // 10min+1of patronage
    const totalToBuy = TenMinOneSecDue;
    await steward.connect(signers[2]).buy(ETH1, ETH0, {value: totalToBuy, gasLimit });
    await time.increase(time.duration.minutes(10));
    await steward._collectPatronage(); // will foreclose

    const balTrack = await balance.tracker(accounts[0]);

    const tx = await steward.connect(signers[0]).withdrawArtistFunds({ gasPrice: ethers.BigNumber.from('1000000000'), gasLimit }); // 1 gwei gas
    const txReceipt = await provider.getTransactionReceipt(tx.hash);
    const txCost = ethers.BigNumber.from(txReceipt.gasUsed).mul(ethers.BigNumber.from('1000000000')); // gas used * gas price
    const calcDiff = totalToBuy.sub(txCost); // should receive

    const artistFund = await steward.artistFund();

    expect(artistFund.toString()).to.equal('0');
    const delta = await balTrack.delta();
    expect(delta.toString()).to.equal(calcDiff.toString());
  });

  
  it('steward: owned. collect patronage. 10min deposit. 20min Foreclose.', async () => {
    // 10min+1sec of patronage
    // const totalToBuy = TenMinOneSecDue;
    const totalToBuy = TenMinDue;
    await steward.connect(signers[2]).buy(ETH1, ETH0, {value: totalToBuy, gasLimit });

    const preTime = await bigTimeLatest();
    await time.increase(time.duration.minutes(20)); // evm_mine 
    // 20min owed patronage
    // 10min due
    const preForeclosed = await steward.foreclosed();
    const preTLC = await steward.timeLastCollected();
    const preDeposit = await steward.deposit();
    const preTimeBought = await steward.timeAcquired();

    const preForeclosureTime = await steward.foreclosureTime(); // checking at 20min NOT 20min + 1
    // ACTION HAPPENS (forward 1 sec)
    await steward._collectPatronage(); // will foreclose and add + 1 sec

    const postCollectionTime = await bigTimeLatest();

    // based on what was supposed to be due (10min), not 20min
    const due = calculateDue(ETH1, preTime, preTime.add(ethers.BigNumber.from('600'))); // 10m 

    // collection, however, will be 20min (foreclosure happened AFTER deposit defacto ran out)
    // technically 20min + 1 sec
    const collection = calculateDue(ETH1, preTime, postCollectionTime);

    const deposit = await steward.deposit();
    const artistFund = await steward.artistFund();
    const timeLastCollected = await steward.timeLastCollected();

    // timeLastCollected = timeLastCollected.add(((now.sub(timeLastCollected)).mul(deposit).div(collection)));
    // Collection will > deposit based on 20min.
    const tlcCheck = preTLC.add((postCollectionTime.sub(preTLC)).mul(preDeposit).div(collection));
    const currentCollected =  await steward.currentCollected();
    const totalCollected =  await steward.totalCollected();
    const price = await steward.price();

    const currentOwner = await artwork.ownerOf(42);

    const timeHeld = await steward.timeHeld(accounts[2]);
    const calcTH = timeLastCollected.sub(preTimeBought);

    expect(preForeclosed.toString()).to.equal('true');
    expect(steward.address).to.equal(currentOwner);
    expect(timeHeld.toString()).to.equal(calcTH.toString());
    expect(deposit.toString()).to.equal('0');
    expect(artistFund).to.equal(due);
    expect(timeLastCollected.toString()).to.equal(tlcCheck.toString());
    expect(preForeclosureTime.toString()).to.equal(timeLastCollected.toString());
    expect(currentCollected.toString()).to.equal('0');
    expect(totalCollected.sub(preCollected)).to.equal(due);
    expect(price).to.equal(ETH0);
  });

  
  it('steward: owned. deposit wei fail from not patron', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2 , gasLimit });
    await expect(steward.connect(signers[3]).depositWei({value: ETH2, gasLimit}))
      .to.be
      .revertedWith('Not patron');
  });


  it('steward: owned. change price to zero [fail]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await expect(steward.connect(signers[2]).changePrice(0, {gasLimit})).to.be.revertedWith("Price is zero"); 
  });

  it('steward: owned. change price to more [success]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await expect(steward.connect(signers[2]).changePrice(ETH3, {gasLimit})).
      to.emit(steward, 'LogPriceChange')
      .withArgs(ETH3);
    const postPrice = await steward.price();
    expect(ETH3).to.equal(postPrice);
  });

  it('steward: owned. change price to less [success]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await steward.connect(signers[2]).changePrice(ethers.utils.parseEther('0.5'), { gasLimit});
    const postPrice = await steward.price();
    expect(ethers.utils.parseEther('0.5')).to.equal(postPrice);
  });

  it('steward: owned. change price to less with another account [fail]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await expect(steward.connect(signers[3]).changePrice(ETH2, {gasLimit})).to.be.revertedWith("Not patron");
  });
  
  
  it('steward: owned. withdraw whole deposit into foreclosure [succeed]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    const deposit = await steward.deposit();
    const collected = calculateDue(ETH1, ethers.BigNumber.from('0'), ethers.BigNumber.from('1')); // 1 second of patronage is collected when issuing the tx
    await steward.connect(signers[2]).withdrawDeposit(deposit.sub(collected), {gasLimit});
    const price = await steward.price();
    expect(price).to.equal(ETH0);
  });

  
  it('steward: owned. withdraw whole deposit through exit into foreclosure after 10min [succeed]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await time.increase(time.duration.minutes(10)); 
    await steward.connect(signers[2]).exit({gasLimit});
    const price = await steward.price();
    expect(price).to.equal(ETH0);
  });

  
  it('steward: owned. withdraw some deposit [succeeds]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await steward.connect(signers[2]).withdrawDeposit(ETH1, {gasLimit});
    const deposit = await steward.deposit();
    const collected = calculateDue(ETH1, ethers.BigNumber.from('0'), ethers.BigNumber.from('1')); // 1 second of patronage is collected when issuing the tx
    expect(deposit).to.equal(ETH2.sub(ETH1).sub(collected));
  });

  
  it('steward: owned. withdraw more than exists [fail]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await expect(steward.connect(signers[2]).withdrawDeposit(ETH3, {gasLimit}))
      .to.be.revertedWith("Withdrawing too much");
  });

  it('steward: owned. withdraw some deposit from another account [fails]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await expect(steward.connect(signers[3]).withdrawDeposit(ETH1, {gasLimit}))
      .to.be.revertedWith("Not patron");
  });

  
  it('steward: bought once, bought again from same account [success]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await steward.connect(signers[2]).buy(ETH1, ETH1, { value: ETH2, gasLimit });
    const deposit2 = await steward.deposit();
    const price2 = await steward.price();
    const currentOwner2 = await artwork.ownerOf(42);
    const cc = await steward.currentCollected();
    expect(deposit2).to.equal(ETH1);
    expect(price2).to.equal(ETH1);
    expect(cc.toString()).to.equal('0');
    expect(currentOwner2).to.equal(accounts[2]);
  });

  
  it('steward: bought once, bought again from another account [success]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });
    await steward.connect(signers[3]).buy(ETH1, ETH1, { value: ETH2, gasLimit });
    const deposit2 = await steward.deposit();
    const price2 = await steward.price();
    const currentOwner2 = await artwork.ownerOf(42);
    expect(deposit2).to.equal(ETH1);
    expect(price2).to.equal(ETH1);
    expect(currentOwner2).to.equal(accounts[3]);
  });

  
  it('steward: bought once, bought again from another account after 10min [success]', async () => {
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: ETH2, gasLimit });

    await time.increase(time.duration.minutes(10));

    const balTrack = await balance.tracker(accounts[2]);
    const preBuy = await balTrack.get();
    const preDeposit = await steward.deposit();
    await steward.connect(signers[3]).buy(ETH1, ETH1, { value: ETH2, gasLimit, gasPrice: ethers.BigNumber.from('1000000000') });

    // deposit - due + 1 (from sale)
    const calcDiff = preDeposit.sub(TenMinOneSecDue).add(ETH1);

    const delta = await balTrack.delta();
    expect(delta.toString()).to.equal(calcDiff.toString());
    const deposit2 = await steward.deposit();
    const price2 = await steward.price();
    const currentOwner2 = await artwork.ownerOf(42);
    expect(deposit2).to.equal(ETH1);
    expect(price2).to.equal(ETH1);
    expect(currentOwner2).to.equal(accounts[3]);
  });

  
  it('steward: owned: deposit wei, change price, withdrawing deposit in foreclosure state [fail]', async() => {
    // 10min of patronage
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: TenMinOneSecDue, gasLimit });
    await time.increase(time.duration.minutes(20)); // into foreclosure state

    await expect(steward.connect(signers[2]).depositWei({value: ETH1, gasLimit}))
      .to.be.revertedWith("Not patron");

    await expect(steward.connect(signers[2]).changePrice(ETH2, {gasLimit}))
      .to.be.revertedWith("Not patron");

    await expect(steward.connect(signers[2]).withdrawDeposit(ETH1, {gasLimit}))
      .to.be.revertedWith("Not patron");
  });

  
  it('steward: owned: goes into foreclosure state & bought from another account [success]', async() => {
    // 10min of patronage
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: TenMinOneSecDue, gasLimit });
    await time.increase(time.duration.minutes(20)); // into foreclosure state

    // price should be zero, thus totalToBuy should primarily going into the deposit [as if from init]
    await steward.connect(signers[3]).buy(ETH2, ETH0, { value: TenMinOneSecDue, gasLimit });

    const deposit = await steward.deposit();
    const totalCollected = await steward.totalCollected();
    const currentCollected = await steward.currentCollected();
    const previousBlockTime = await bigTimeLatest();
    const timeLastCollected = await steward.timeLastCollected(); // on buy.
    const price = await steward.price();
    const owner = await artwork.ownerOf(42);
    const wasPatron1 = await steward.patrons(accounts[2]);
    const wasPatron2 = await steward.patrons(accounts[3]);

    expect(deposit).to.equal(TenMinOneSecDue);
    expect(price).to.equal(ETH2);
    expect(totalCollected.sub(preCollected)).to.equal(TenMinOneSecDue);
    expect(currentCollected.toString()).to.equal('0');
    expect(timeLastCollected).to.equal(previousBlockTime);
    expect(owner).to.equal(accounts[3]);
    expect(wasPatron1).to.equal(true);
    expect(wasPatron2).to.equal(true);
  });

  
  it('steward: owned: goes into foreclosure state & bought from same account [success]', async() => {
    // 10min of patronage
    await steward.connect(signers[2]).buy(ETH1, ETH0, { value: TenMinOneSecDue, gasLimit });
    await time.increase(time.duration.minutes(20)); // into foreclosure state

    // price should be zero, thus totalToBuy should primarily going into the deposit [as if from init]
    await steward.connect(signers[2]).buy(ETH2, ETH0, { value: TenMinOneSecDue, gasLimit });

    const deposit = await steward.deposit();
    const totalCollected = await steward.totalCollected();
    const currentCollected = await steward.currentCollected();
    const previousBlockTime = await bigTimeLatest();
    const timeLastCollected = await steward.timeLastCollected(); // on buy.
    const price = await steward.price();
    const owner = await artwork.ownerOf(42);

    expect(deposit).to.equal(TenMinOneSecDue);
    expect(price).to.equal(ETH2);
    expect(totalCollected.sub(preCollected)).to.equal(TenMinOneSecDue);
    expect(currentCollected.toString()).to.equal('0');
    expect(timeLastCollected).to.equal(previousBlockTime);
    expect(owner).to.equal(accounts[2]);
  });
  
  it('steward: init timeHeld is 1', async() => {
    // one function is called, restore(). it advances the clock after deployment
    const th = await steward.timeHeld(steward.address);

    expect(th.toString()).to.equal('1');
  });

});