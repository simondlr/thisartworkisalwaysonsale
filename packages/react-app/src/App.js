import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import 'antd/dist/antd.css';
import { ethers } from "ethers";
import "./App.css";
import { Account } from "./components"

import BaseComponent from './components/BaseComponent.js';
import IntroComponent from './components/IntroComponent.js';

import { getUSDValueOfArtwork } from './hooks/Prices.js';
import { usePoller, useGasPrice } from "./hooks";

import Transactor from "./helpers/Transactor.js";

// Artifacts
import ERC721JSON from "./contracts/ERC721.json";
import ArtStewardJSON from "./contracts/ArtSteward.json";

import moment from "moment";

const mainnetProvider = new ethers.providers.InfuraProvider("mainnet",process.env.REACT_APP_INFURA_ID);
// const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545")

// change to mainnet on prod
const hardcodedProvider = mainnetProvider;

async function getStewardData(steward) {
  // can be used for both versions.
  const currentArtPriceETH = ethers.utils.formatEther(await steward.functions.price());
  const currentDepositAbleToWithdraw = ethers.utils.formatEther(await steward.functions.depositAbleToWithdraw());
  // const currentDeposit = ethers.utils.formatEther(await steward.functions.deposit());
  const currentDeposit = null;
  const currentPatronageOwed = ethers.utils.formatEther(await steward.functions.patronageOwed());
  const currentTotalCollected = ethers.utils.formatEther(await steward.functions.totalCollected());

  return [currentArtPriceETH, currentDepositAbleToWithdraw, currentDeposit, currentPatronageOwed, currentTotalCollected];
}

/*
Note: Doing this a bit janky.
Redux Store would be much better.
*/
function App() {
  /* Universal State*/
  const [address, setAddress] = useState();
  const [injectedProvider, setInjectedProvider] = useState();
  // chain ids (used as proxy for being connect to a provider)
  const [injectedChainId, setInjectedChainId] = useState(null);
  const [hardcodedChainId, setHardcodedChainId] = useState(null);
  const [hardcodedBlockNumber, setHardcodedBlockNumber] = useState(null);

  // Damaged v1 on mainnet
  // const v1StewardAddress = "0x74E6Ab057f8a9Fd9355398a17579Cd4c90aB2B66";
  // const v1ERC721Address = "0x6d7C26F2E77d0cCc200464C8b2040c0B840b28a2";
  
  // Restored V1
  const v1StewardAddress = "0xB602c0bBfaB973422B91C8dfc8302B7b47550fC0";
  const v1ERC721Address = "0x2b4fA931ADc5D6b58674230208787A3dF0bD2121";

  const v2StewardAddress = "0x595f2c4e9e3e35B0946394A714c2CD6875C04988";
  const v2ERC721Address = "0xE51a7572323040792ba69B2DC4096e8e6B22fDD4";

  // artist: 0x0CaCC6104D8Cd9d7b2850b4f35c65C1eCDEECe03

  const combinedArtObj = {
    v: null,
    steward: null,
    signerSteward: null,
    artwork: null,
    artPriceETH: "",
    deposit: "",
    depositAbleToWithdraw: "",
    foreclosureTime: "",
    timeHeldHumanized: "",
    patronageOwed: null,
    totalCollected: null,
    artPriceUSD: "",
    combinedCollected: "",
    patron: null
  };

  const [artV1, setArtV1] = useState(combinedArtObj);
  const [artV2, setArtV2] = useState(combinedArtObj);

  function updateState(artObj, updatedValues) {
    if(artObj.v === 'v1') { setArtV1((prevState) => { return {...prevState, ...updatedValues};});}
    if(artObj.v === 'v2') { setArtV2((prevState) => { return {...prevState, ...updatedValues};});}
  }

  // NOTE: Currently not being used in Transactor, but keeping it in the code in case I want to turn it back on.
  // Currently, it's expected that the web3 provider sets it (eg, MetaMask fills it in).
  // const gasPrice = useGasPrice("fast"); 
  const gasPrice = 0;

  usePoller(()=>{pollHardcodedProvider()},1999);
  usePoller(()=>{pollInjectedProvider()},1999);

  useEffect(()=>{
    setInterval(()=>{pollBlockNumber()},3999);
  }, [hardcodedChainId]); //

  useEffect(()=>{
    pollContracts();
  },[hardcodedBlockNumber]);

  async function pollHardcodedProvider() {
      if(!hardcodedChainId) {
          if(hardcodedProvider && hardcodedProvider.network) {
              const id = await hardcodedProvider.network.chainId;
              setHardcodedChainId(id);
          }
      }
  }

  async function pollInjectedProvider() {
      if(!injectedChainId) {
          if(injectedProvider && injectedProvider.network) {
              const id = await injectedProvider.network.chainId;
              setInjectedChainId(id);
          }
      }
  }  
  
  /* when the reading provider comes online, load the contracts */
  useEffect(() => {
      async function loadContracts() {
        if(hardcodedChainId !== null) {

            //v1 (hardcoded to mainnet):
            const stewardV1 = new ethers.Contract(v1StewardAddress, ArtStewardJSON.abi, mainnetProvider);
            const artworkV1 = new ethers.Contract(v1ERC721Address, ERC721JSON.abi, mainnetProvider);
            const updatedValuesV1 = { steward: stewardV1, artwork: artworkV1, v: "v1" };
            setArtV1((prevState) => { return {...prevState, ...updatedValuesV1}});

            //v2 (loaded from artifacts):
            const stewardV2 = new ethers.Contract(v2StewardAddress, ArtStewardJSON.abi, hardcodedProvider);
            const artworkV2 = new ethers.Contract(v2ERC721Address, ERC721JSON.abi, hardcodedProvider);
            const updatedValuesV2 = { steward: stewardV2, artwork: artworkV2, v: "v2" };
            setArtV2((prevState) => { return {...prevState, ...updatedValuesV2}});
        }
      }
      loadContracts();
  }, [hardcodedChainId]);

  /* load signers if there's an injected provider */
  useEffect(() => {
    async function loadSigners() {
      if(injectedChainId !== null) {
        const signer = await injectedProvider.getSigner();
        const signerStewardV1 = new ethers.Contract(v1StewardAddress , ArtStewardJSON.abi, signer);
        const signerStewardV2 = new ethers.Contract(v2StewardAddress, ArtStewardJSON.abi, signer);

        const updatedValuesV1 = { signerSteward: signerStewardV1 };
        const updatedValuesV2 = { signerSteward: signerStewardV2 };

        setArtV1((prevState) => { return {...prevState, ...updatedValuesV1}});
        setArtV2((prevState) => { return {...prevState, ...updatedValuesV2}});
      }
    }
    loadSigners();
  }, [injectedChainId]);

  /* Immediately poll contracts when they are loaded into state */
  useEffect(() => { pollContract(artV1); }, [artV1.steward, artV1.artwork]);
  useEffect(() => { pollContract(artV2); }, [artV2.steward, artV2.artwork]);

  async function pollBlockNumber() {
      if(hardcodedChainId !== null) {
        const blockNumber = await hardcodedProvider.getBlockNumber();
        setHardcodedBlockNumber(blockNumber);
      }
  }

  async function pollContracts() {
      if(hardcodedChainId !== null) {
          console.log('hbnr', hardcodedBlockNumber);
          await pollContract(artV1);
          await pollContract(artV2);
      }
  }    
  
  async function pollContract(artObj) {
    const updatedValues = {};
    if(artObj.steward !== null) {
      const [
        currentArtPriceETH, 
        currentDepositAbleToWithdraw, 
        currentDeposit, 
        currentPatronageOwed, 
      currentTotalCollected] = await getStewardData(artObj.steward);


      if(currentArtPriceETH !== artObj.artPriceETH) { updatedValues.artPriceETH = currentArtPriceETH; }
      if(currentDepositAbleToWithdraw !== artObj.depositAbleToWithdraw) { updatedValues.depositAbleToWithdraw = currentDepositAbleToWithdraw; }
      if(currentDeposit !== artObj.deposit) { updatedValues.deposit = currentDeposit; }
      if(currentPatronageOwed !== artObj.patronageOwed) { updatedValues.patronageOwed = currentPatronageOwed; }
      if(currentTotalCollected !== artObj.totalCollected) { updatedValues.totalCollected = currentTotalCollected; }
    }

    if(artObj.artwork !== null) {
      const currentPatron = await artObj.artwork.functions.ownerOf(42);
      if(currentPatron !== artObj.patron) { updatedValues.patron = currentPatron; }
    }

    if (Object.keys(updatedValues).length > 0) {
      updateState(artObj, updatedValues);
    }
  }

  /* when price changes, update its USD spot value */
  async function updateUSD(artObj) {
    const updatedUSD = await getUSDValueOfArtwork(artObj.artPriceETH);
    const updatedValues = { artPriceUSD: updatedUSD };
    updateState(artObj, updatedValues);
  }

  /* Update time held when patron changes */
  async function updateTimeHeld(artObj) {
    if(artObj.patron !== null) {
      const date = new Date();
      const currentTimeHeld = parseInt(await artObj.steward.functions.timeHeld(artObj.patron)) + (parseInt(date.getTime()/1000) - parseInt(await artObj.steward.functions.timeAcquired()));
      const currentTimeHeldHumanized = moment.duration(currentTimeHeld, 'seconds').humanize();
      const updatedValues = {};
      if(currentTimeHeldHumanized !== artObj.timeHeldHumanized) { updatedValues.timeHeldHumanized = currentTimeHeldHumanized; }
      updateState(artObj, updatedValues);
    }
  }

  /* if either price or deposit changes, the foreclosure time would change */
  async function updateForeclosureTime(artObj) {
    if(artObj.steward !== null) {
        const foreclosureTime = moment(parseInt(await artObj.steward.functions.foreclosureTime())*1000).toString();
        const updatedValues = { foreclosureTime };
        updateState(artObj, updatedValues);
    }
  }

  /* if patronage owed changes (per block), updated combined collected (owed + total) */
  async function updateCombinedCollected(artObj) {
    if(artObj.steward !== null && artObj.patronageOwed !== null && artObj.totalCollected !== null) {
        const currentCombinedCollected = ethers.utils.formatEther(ethers.utils.parseEther(artObj.totalCollected).add(ethers.utils.parseEther(artObj.patronageOwed)));
        const updatedValues = { combinedCollected: currentCombinedCollected };
        updateState(artObj, updatedValues);
    }
  }

  useEffect(() => { updateUSD(artV1); },[artV1.artPriceETH]);
  useEffect(() => { updateUSD(artV2); },[artV2.artPriceETH]);

  useEffect(() => { updateTimeHeld(artV1); }, [artV1.patron]);
  useEffect(() => { updateTimeHeld(artV2); }, [artV2.patron]);

  useEffect(() => { updateForeclosureTime(artV1); }, [artV1.artPriceETH, artV1.deposit]); // price or deposit changes time to foreclosure
  useEffect(() => { updateForeclosureTime(artV2); }, [artV2.artPriceETH, artV2.deposit]); // price or deposit changes time to foreclosure

  useEffect(() => { updateCombinedCollected(artV1); }, [artV1.patronageOwed, artV1.totalCollected]); // totalcollected is updated on actions. patronage owed on each block
  useEffect(() => { updateCombinedCollected(artV2); }, [artV2.patronageOwed, artV2.totalCollected]); // totalcollected is updated on actions. patronage owed on each block


  /* form functions */
  /* Buy Form */
  async function BuyArt(values) {
      let artPriceETH;
      let signerSteward;

      if(values.v === 'v1') {
        artPriceETH = artV1.artPriceETH;
        signerSteward = artV1.signerSteward;
      } else if(values.v === 'v2') {
        artPriceETH = artV2.artPriceETH;
        signerSteward = artV2.signerSteward;
      }
      console.log('v', values);
      console.log('ap', artPriceETH);
      console.log('ss', signerSteward); 
      const salePriceInWeiBN = ethers.utils.parseEther(values.newSalePrice.toString());
      const artPriceETHBN = ethers.utils.parseEther(artPriceETH.toString());
      const depositBN = ethers.utils.parseEther(values.deposit.toString());
      const totalETH = artPriceETHBN.add(depositBN);
      const tx = Transactor(injectedProvider, gasPrice);

      if(values.v === 'v1') { 
        console.log('v1 buyng'); // todo: load the OLD ABI for V1.
        tx(signerSteward.functions.buy(salePriceInWeiBN, {value: totalETH })); } 
      else if(values.v === 'v2') { tx(signerSteward.functions.buy(salePriceInWeiBN, artPriceETHBN, {value: totalETH }));}
  }

  async function changePrice(values) {
      const signerSteward = values.v === 'v1' ? artV1.signerSteward : artV2.signerSteward;
      // newPrice
      // note: should negative numbers be disabled? For ease of use?
      const newPrice = ethers.utils.parseEther(values.newPrice.toString());
      const tx = Transactor(injectedProvider, gasPrice);
      tx(signerSteward.functions.changePrice(newPrice));
  }

  async function topupDeposit(values) {
      const signerSteward = values.v === 'v1' ? artV1.signerSteward : artV2.signerSteward;
      // topupDeposit        
      const topupDeposit = ethers.utils.parseEther(values.topupDeposit.toString());
      const tx = Transactor(injectedProvider, gasPrice);
      tx(signerSteward.functions.depositWei({value: topupDeposit}));
  }

  async function withdrawSomeDeposit(values) {
      const signerSteward = values.v === 'v1' ? artV1.signerSteward : artV2.signerSteward;
      // withdrawSomeDeposit
      const withdrawSomeDeposit = ethers.utils.parseEther(values.withdrawSomeDeposit.toString());
      const tx = Transactor(injectedProvider, gasPrice);
      tx(signerSteward.functions.withdrawDeposit(withdrawSomeDeposit));
  }

  async function withdrawWholeDeposit(values) {
      const signerSteward = values.v === 'v1' ? artV1.signerSteward : artV2.signerSteward;
      const tx = Transactor(injectedProvider, gasPrice);
      tx(signerSteward.functions.exit());
  }

  return (
    <div>
      <Account
      address={address}
      setAddress={setAddress}
      injectedProvider={injectedProvider}
      setInjectedProvider={setInjectedProvider}
    />
    <Switch>
      <Route exact path="/">
        <IntroComponent
          artV1={artV1}
          artV2={artV2}
        />
      </Route>
      <Route path="/v1" children={
        <BaseComponent
          injectedChainId={injectedChainId}
          hardcodedChainId={hardcodedChainId}
          art={artV1}
          BuyArt={BuyArt}
          changePrice={changePrice}
          topupDeposit={topupDeposit}
          withdrawSomeDeposit={withdrawSomeDeposit}
          withdrawWholeDeposit={withdrawWholeDeposit}
        />
      }/>
      <Route path="/v2" children={
        <BaseComponent
          injectedChainId={injectedChainId}
          hardcodedChainId={hardcodedChainId}
          art={artV2}
          BuyArt={BuyArt}
          changePrice={changePrice}
          topupDeposit={topupDeposit}
          withdrawSomeDeposit={withdrawSomeDeposit}
          withdrawWholeDeposit={withdrawWholeDeposit}
        />
      }/>
    </Switch>
  </div>
  );
}

class AppRoutes extends Component {
  render() {
    return (
      <Router>
        <Switch>        
          <Route path='/:page'>
            <App />
          </Route>
          <Route exact path='/'>
            <App />
          </Route>

        </Switch>
      </Router>
    )
  }
}

export default AppRoutes;
