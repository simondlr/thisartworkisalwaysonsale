import React, { Component } from 'react';
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";

import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';

import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { mainnet, hardhat } from 'wagmi/chains';

import 'antd/dist/antd.css';
import "./App.css";
import { Account } from "./components"
import BaseComponent from './components/BaseComponent.js';
import IntroComponent from './components/IntroComponent.js';

// wagmiconfig
const chains = [mainnet, hardhat];
const walletConnectID = process.env.REACT_APP_WALLETCONNECT_ID;
const projectId = walletConnectID;
const metadata = {
  name: 'TAIAOS',
  description: 'TAIAOS',
  url: 'https://thisartworkisalwaysonsale.com'
}

const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });
createWeb3Modal({ wagmiConfig, projectId, chains });

const chainID = 1; // prod == mainnet

function App() {
  // Restored V1
  const v1StewardAddress = "0xB602c0bBfaB973422B91C8dfc8302B7b47550fC0";
  const v2StewardAddress = "0x595f2c4e9e3e35B0946394A714c2CD6875C04988";

  // mainnet
  const graphURI = 'https://api.thegraph.com/subgraphs/name/simondlr/taiaos';

  const client = new ApolloClient({
      uri: graphURI,
      cache: new InMemoryCache(),
    });

  return (
    <>
    <WagmiConfig config={wagmiConfig}>
    <ApolloProvider client={client}>
    <div>
      <Account />
    <Switch>
      <Route exact path="/">
        <IntroComponent/>
      </Route>
      <Route path="/v1" children={
        <BaseComponent
          chainID={chainID}
          v="v1"
          v1StewardAddress={v1StewardAddress}
          v2StewardAddress={v2StewardAddress}
        />
      }/>
      <Route path="/v2" children={
        <BaseComponent
          chainID={chainID}
          v="v2"
          v1StewardAddress={v1StewardAddress}
          v2StewardAddress={v2StewardAddress}
        />
      }/>
    </Switch>
  </div>
  </ApolloProvider>
  </WagmiConfig>
  </>
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
