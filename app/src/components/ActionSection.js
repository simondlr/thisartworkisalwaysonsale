import { drizzleConnect } from "drizzle-react";
import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import moment from "moment"

import ContractForm from "./ContractForm";
import DepositWeiForm from "./DepositWeiForm";
import ContractData from "./ContractData";

class ActionSection extends Component {
  constructor(props, context) {
    super();
    this.utils = context.drizzle.web3.utils;
    this.contracts = context.drizzle.contracts;
    this.state = {
      patronageOwedKey: context.drizzle.contracts.ArtSteward.methods.patronageOwed.cacheCall(),
      totalCollectedKey: context.drizzle.contracts.ArtSteward.methods.totalCollected.cacheCall(),
      patronageOwed: -1,
      combinedCollected: -1,
      foreclosureTime: "N/A"
    };
  }

  getTotalCollected(props) {
    return new this.utils.BN(props.contracts['ArtSteward']['totalCollected'][this.state.totalCollectedKey].value);
  }

  async updateCombineCollected(props) {
    const patronageOwed = this.getPatronageOwed(props);
    const totalCollected = this.getTotalCollected(props);
    const combinedCollected = this.utils.fromWei(totalCollected.add(patronageOwed), 'ether').toString();
    this.setState({
      patronageOwed,
      combinedCollected,
    });
  }

  getPatronageOwed(props) {
    return new this.utils.BN(props.contracts['ArtSteward']['patronageOwed'][this.state.patronageOwedKey].value);
  }

  async componentWillReceiveProps(nextProps) {
    if(this.props.contracts['ArtSteward']['price']['0x0'] !== nextProps.contracts['ArtSteward']['price']['0x0']) {
      if (nextProps.contracts['ArtSteward']['price']['0x0'].value === '0') {
        this.setState({
          foreclosureTime: "N/A"
        });
      } else {
        const foreclosureTime = moment(parseInt(await this.contracts.ArtSteward.methods.foreclosureTime().call())*1000).toString();
        this.setState({foreclosureTime});
      }
    }

    if (this.state.patronageOwedKey in this.props.contracts['ArtSteward']['patronageOwed']
    && this.state.patronageOwedKey in nextProps.contracts['ArtSteward']['patronageOwed']
    && this.state.totalCollectedKey in this.props.contracts['ArtSteward']['totalCollected']
    && this.state.totalCollectedKey in nextProps.contracts['ArtSteward']['totalCollected']) {
      if (!this.getPatronageOwed(this.props).eq(this.getPatronageOwed(nextProps)) || this.state.combinedCollected === -1) {
        this.updateCombineCollected(nextProps);
      }
    }
  }

  render() {
    return (
    <div className="section">
      <h2>Current Patron Details:</h2>
        <p>Address: <ContractData contract="ERC721Full" method="ownerOf" methodArgs={[42]}/></p>
        <p>Available Deposit: <ContractData contract="ArtSteward" method="depositAbleToWithdraw" toEth /> ETH</p>
        <p>Foreclosure Time: {this.state.foreclosureTime}</p>
        <p>The current deposit will cover the patronage until the time above. At this time, the smart contract steward takes ownership of the artwork and sets its price back to zero.</p>
        <p>Once it crosses this time period, the patron can't top up their deposit anymore and is effectively foreclosed.</p>
      <h2>Actions:</h2>
        {window.ethereum !== undefined ? (
          <Fragment>
          <ContractForm buttonText="Change Price" contract="ArtSteward" method="changePrice" labels={["New Price"]}/>
          <DepositWeiForm contract="ArtSteward" method="depositWei" valueLabel="Deposit" sendArgs={{}}/>
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
        <p>Total Patronage Collected: {this.state.combinedCollected} ETH</p>
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
