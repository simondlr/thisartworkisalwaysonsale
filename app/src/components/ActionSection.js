import { drizzleConnect } from "drizzle-react";
import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import ContractForm from "./ContractForm";
import ContractData from "./ContractData";

class ActionSection extends Component {
    render() {
      return (
      <div className="section">
        <h2>Current Patron Details:</h2>
          <p>Current Patron: <ContractData contract="ERC721Full" method="ownerOf" methodArgs={[42]}/></p>
          <p>Current Deposit For Patronage: <ContractData contract="ArtSteward" method="deposit" toEth /> ETH</p>
          <p>Patronage Owed: <ContractData contract="ArtSteward" method="patronageOwed" toEth /> ETH</p>
          <p>Current Patronage Collected: <ContractData contract="ArtSteward" method="currentCollected" toEth /> ETH</p>
          <p>Foreclosure Time: <ContractData contract="ArtSteward" method="foreclosureTime" /></p>
        <h2>Owner Actions:</h2>
          {window.ethereum !== undefined ? (
            <Fragment>
            <ContractForm buttonText="Change Price" contract="ArtSteward" method="changePrice" labels={["New Price"]}/>
            <ContractForm buttonText="Withdraw Deposit" contract="ArtSteward" method="withdrawDeposit" labels={["Deposit in ETH"]} toEth />
            <ContractForm buttonText="Withdraw Whole Deposit And Foreclose" contract="ArtSteward" method="exit" />
            </Fragment>
          ) : (
            <Fragment>
            In order to interact with the artwork you need to have a web3/Ethereum-enabled browser. Please download
            the <a href="https://metamask.io">MetaMask Chrome extension</a> or open in an Ethereum mobile browser.
            </Fragment>
          )}

        <h2>Other Artwork Stats:</h2>
          <p>Total Patronage Collected: <ContractData contract="ArtSteward" method="totalCollected" toEth /> ETH</p>
      </div>
      )
    }
}

ActionSection.contextTypes = {
  drizzle: PropTypes.object,
};

ActionSection.propTypes = {
};

/*
 * Export connected component.
 */

const mapStateToProps = state => {
  return {
    contracts: state.contracts,
  };
};

export default drizzleConnect(ActionSection, mapStateToProps);
