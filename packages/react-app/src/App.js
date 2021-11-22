import React, { useState, useEffect, Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

import 'antd/dist/antd.css';
import { ethers } from "ethers";
import "./App.css";
import { Account } from "./components"

import BaseComponent from './components/BaseComponent.js';
import IntroComponent from './components/IntroComponent.js';

import { usePoller, useGasPrice } from "./hooks";

import Transactor from "./helpers/Transactor.js";

// Artifacts
// import ERC721JSON from "./contracts/ERC721.json";
import ArtStewardJSON from "./contracts/ArtSteward.json";

const mainnetProvider = new ethers.providers.InfuraProvider("mainnet",process.env.REACT_APP_INFURA_ID);
// const localProvider = new ethers.providers.JsonRpcProvider(process.env.REACT_APP_PROVIDER?process.env.REACT_APP_PROVIDER:"http://localhost:8545")

// change to mainnet on prod
const hardcodedProvider = mainnetProvider;

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
  // const [hardcodedBlockNumber, setHardcodedBlockNumber] = useState(null);

  // Damaged v1 on mainnet
  // const v1StewardAddress = "0x74E6Ab057f8a9Fd9355398a17579Cd4c90aB2B66";
  // const v1ERC721Address = "0x6d7C26F2E77d0cCc200464C8b2040c0B840b28a2";
  
  // Restored V1
  const v1StewardAddress = "0xB602c0bBfaB973422B91C8dfc8302B7b47550fC0";
  // const v1ERC721Address = "0x2b4fA931ADc5D6b58674230208787A3dF0bD2121";

  const v2StewardAddress = "0x595f2c4e9e3e35B0946394A714c2CD6875C04988";
  // const v2ERC721Address = "0xE51a7572323040792ba69B2DC4096e8e6B22fDD4";

  // artist: 0x0CaCC6104D8Cd9d7b2850b4f35c65C1eCDEECe03

  const stewardV1Obj = {
    v: 'v1',
    signer: null
  }

  const stewardV2Obj = {
    v: 'v2',
    signer: null
  }

  const [stewardV1, setStewardV1] =  useState(stewardV1Obj);
  const [stewardV2, setStewardV2] =  useState(stewardV2Obj);

  // NOTE: Currently not being used in Transactor, but keeping it in the code in case I want to turn it back on.
  // Currently, it's expected that the web3 provider sets it (eg, MetaMask fills it in).
  // const gasPrice = useGasPrice("fast"); 
  const gasPrice = 0;

  usePoller(()=>{pollInjectedProvider()},500);
  async function pollInjectedProvider() {
    if(!injectedChainId) {
        if(injectedProvider && injectedProvider.network) {
            const id = await injectedProvider.network.chainId;
            console.log('setting ids');
            setInjectedChainId(id);

            // comment out line for local or prod
            setHardcodedChainId(1); // mainnet
            // setHardcodedChainId(id); // local (uses injectedProvider)
        }
    }
  } 
  
  /* load signers if there's an injected provider */
  useEffect(() => {
    async function loadSigners() {
      if(injectedChainId !== null) {
        const signer = await injectedProvider.getSigner();
        const signerStewardV1 = new ethers.Contract(v1StewardAddress , ArtStewardJSON.abi, signer);
        const signerStewardV2 = new ethers.Contract(v2StewardAddress, ArtStewardJSON.abi, signer);

        const updatedValuesV1 = { signer: signerStewardV1 };
        const updatedValuesV2 = { signer: signerStewardV2 };

        setStewardV1((prevState) => { return {...prevState, ...updatedValuesV1}});
        setStewardV2((prevState) => { return {...prevState, ...updatedValuesV2}});
      }
    }
    loadSigners();
  }, [injectedChainId]);

  /* form functions */
  /* Buy Form */
  function getStewardSigner(version) {
    if(version === 'v1') { return stewardV1.signer; }
    if(version === 'v2') { return stewardV2.signer; }
  }

  async function BuyArt(values) {
      let signerSteward = getStewardSigner(values.v);

      console.log('v', values);
      // console.log('ap', artPriceETH);
      console.log('ss', signerSteward); 

      const salePriceInWeiBN = ethers.utils.parseEther(values.newSalePrice.toString());
      const artPriceETHBN = ethers.utils.parseEther(values.artPriceETH.toString());
      const depositBN = ethers.utils.parseEther(values.deposit.toString());
      const totalETH = artPriceETHBN.add(depositBN);
      const tx = Transactor(injectedProvider, gasPrice);

      if(values.v === 'v1') { 
        console.log('v1 buyng'); 
        tx(signerSteward.functions.buy(salePriceInWeiBN, artPriceETHBN, {value: totalETH })); } 
      else if(values.v === 'v2') { tx(signerSteward.functions.buy(salePriceInWeiBN, artPriceETHBN, {value: totalETH }));}
  }

  async function changePrice(values) {
      let signerSteward = getStewardSigner(values.v);
      // newPrice
      // note: should negative numbers be disabled? For ease of use?
      const newPrice = ethers.utils.parseEther(values.newPrice.toString());
      const tx = Transactor(injectedProvider, gasPrice);
      tx(signerSteward.functions.changePrice(newPrice));
  }

  async function topupDeposit(values) {
      let signerSteward = getStewardSigner(values.v);
      // topupDeposit        
      const topupDeposit = ethers.utils.parseEther(values.topupDeposit.toString());
      const tx = Transactor(injectedProvider, gasPrice);
      tx(signerSteward.functions.depositWei({value: topupDeposit}));
  }

  async function withdrawSomeDeposit(values) {
      let signerSteward = getStewardSigner(values.v);
      // withdrawSomeDeposit
      const withdrawSomeDeposit = ethers.utils.parseEther(values.withdrawSomeDeposit.toString());
      const tx = Transactor(injectedProvider, gasPrice);
      tx(signerSteward.functions.withdrawDeposit(withdrawSomeDeposit));
  }

  async function withdrawWholeDeposit(values) {
      let signerSteward = getStewardSigner(values.v);
      const tx = Transactor(injectedProvider, gasPrice);
      tx(signerSteward.functions.exit());
  }

  async function collectPatronage(values) {
    let signerSteward = getStewardSigner(values.v);
    const tx = Transactor(injectedProvider, gasPrice);
    await tx(signerSteward.functions._collectPatronage());
}

  // mainnet
  const graphURI = 'https://api.thegraph.com/subgraphs/name/simondlr/taiaos';

  const client = new ApolloClient({
      uri: graphURI,
      cache: new InMemoryCache(),
    });

  return (
    <ApolloProvider client={client}>
    <div>
      <Account
      address={address}
      setAddress={setAddress}
      injectedProvider={injectedProvider}
      setInjectedProvider={setInjectedProvider}
    />
    <Switch>
      <Route exact path="/">
        <IntroComponent/>
      </Route>
      <Route path="/v1" children={
        <BaseComponent
          v="v1"
          signerSteward={stewardV1.signer}
          injectedChainId={injectedChainId}
          hardcodedChainId={hardcodedChainId}
          BuyArt={BuyArt}
          changePrice={changePrice}
          topupDeposit={topupDeposit}
          withdrawSomeDeposit={withdrawSomeDeposit}
          withdrawWholeDeposit={withdrawWholeDeposit}
        />
      }/>
      <Route path="/v2" children={
        <BaseComponent
          v="v2"
          signerSteward={stewardV2.signer}
          injectedChainId={injectedChainId}
          hardcodedChainId={hardcodedChainId}
          BuyArt={BuyArt}
          changePrice={changePrice}
          topupDeposit={topupDeposit}
          withdrawSomeDeposit={withdrawSomeDeposit}
          withdrawWholeDeposit={withdrawWholeDeposit}
          collectPatronage={collectPatronage}
        />
      }/>
    </Switch>
  </div>
  </ApolloProvider>
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
