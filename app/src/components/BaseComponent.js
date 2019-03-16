import React, { Component } from "react";

// forked from drizzle-react-components
import ActionSection from "./ActionSection";
import ArtistSection from "./ArtistSection";
import BuyingArtSection from "./BuyingArtSection";
import AboutArtSection from "./AboutArtSection";
import ContractData from "./ContractData";
import BuyForm from "./BuyForm";

// import cc from "cryptocompare";  //TODO

import artwork from "./TAIAOS4.png";

class BaseComponent extends Component {

  render() {
    return (
      <div className="App">
        <div className="section">
          <img src={artwork} style={{"max-width": "100%", "max-height": "100%"}} alt="A R T" />
          <p>CURRENT PRICE: <ContractData contract="ArtSteward" method="price" toEth /> ETH (~USD) <br />
          (Owned by: <ContractData contract="ERC721Full" method="ownerOf" methodArgs={[42]}/>)</p>
          <p>
            The digital artwork above is always on sale.<br />
            In order to own this artwork, you always have to specify a sale price. <br />
            Anyone can buy it from the current patron at any time for the specified sale price. <br />
            Whilst held, a 5% fee (pa) is levied as patronage towards the artist. <br />
          </p>
          <p>Buy Artwork for <ContractData contract="ArtSteward" method="price" toEth/> ETH (~USD): 
          <BuyForm contract="ArtSteward" method="buy" labels={["Starting Sale Price"]} valueLabel="Initial Deposit" sendArgs={{}}/></p>
        </div>
        <BuyingArtSection />
        <ActionSection />
        <AboutArtSection />
        <ArtistSection />
      </div>
    );
  }
}

export default BaseComponent
