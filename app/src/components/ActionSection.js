import { drizzleConnect } from "drizzle-react";
import React, { Component } from "react";
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
            <p>Change Price: <ContractForm contract="ArtSteward" method="changePrice" labels={["New Price"]}/></p>
            <p>Withdraw Deposit: <ContractForm contract="ArtSteward" method="withdrawDeposit" /></p>
            <p>Withdraw Total Deposit and Foreclose: <ContractForm contract="ArtSteward" method="exit" /></p>

          <h2>Artwork Stats:</h2>
            <p>Total Patronage Collected: <ContractData contract="ArtSteward" method="totalCollected" toEth /> ETH</p>
            <p>TODO: Add TimeHeld Leaderboard</p>
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
