import { drizzleConnect } from "drizzle-react";
import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import ContractData from "./ContractData";

class PriceSection extends Component {
    render() {
      return (
        <Fragment>
        <h2>Current Price:</h2>
        <p><ContractData contract="ArtSteward" method="price" toEth /> ETH (~USD) <br />
        <br />
        Current Owner and Patron:<br /> <ContractData contract="ERC721Full" method="ownerOf" methodArgs={[42]}/></p>
        </Fragment>
      )
    }
}

PriceSection.contextTypes = {
  drizzle: PropTypes.object,
};

PriceSection.propTypes = {
};

/*
 * Export connected component.
 */

const mapStateToProps = state => {
  return {
    contracts: state.contracts,
    drizzleStatus: state.drizzleStatus,
    web3: state.web3,
  };
};

export default drizzleConnect(PriceSection, mapStateToProps);
