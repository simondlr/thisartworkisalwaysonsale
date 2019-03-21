import React, { Component } from "react";

class BuyingArtSection extends Component {
    render() {
        return (
        <div className="section">
          <h2>Details:</h2>
          <p>When buying the artwork, you have to specify your starting sale price along with an initial deposit [both denominated in ETH].</p>
          <p>At any time, someone can buy the artwork from at the specified price.</p>
          <p>As you hold it, a patronage will continuously be collected from the deposit towards the artist at 5% of the price per annum.</p>
          <p>If your deposit does not cover the patronage anymore, the artwork can be foreclosed by the smart contract steward for safekeeping.</p>
          <p>You can top up and withdraw from your deposit at any time. You can change the price at any time [higher/lower].</p>
          <p>When someone else buys the artwork from you, your remaining deposit is returned.</p>
          <p>DISCLAIMER: This is very experimental. The smart contracts have NOT been audited. Only participate if you can afford it.</p>
        </div> 
        )
    }
}

export default BuyingArtSection;