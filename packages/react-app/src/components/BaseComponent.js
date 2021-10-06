import React, { Fragment, useState, useEffect} from "react";
import artImageV1 from "./TAIAOS4.png";
import artImageV2 from "./TAIAOS_2.png"
import BuyForm from "./BuyForm";
import ActionForms from "./ActionForms";
import { Button } from 'antd';
import moment from 'moment';

import { ethers } from "ethers";
import { getUSDValueOfArtwork } from '../hooks/Prices.js';

import { gql, useLazyQuery } from '@apollo/client';

function BaseComponent(props) {
    let STEWARD_QUERY;
    let rate;

    if (props.v === 'v1') {
      rate = "5%";
      STEWARD_QUERY = gql`
      {
        steward(id: "0xb602c0bbfab973422b91c8dfc8302b7b47550fc0") {
          id
          currentPrice
          currentDeposit
          timeAcquired
          timeLastCollected
          totalCollected
          foreclosureTime
          currentPatron { 
              id
              stewards (patron: id) {
                  id
                  timeHeld
              }
          }
        }
      }`;
    } else if (props.v === 'v2') {
      rate = "100%";
      STEWARD_QUERY = gql`
      {
        steward(id: "0x595f2c4e9e3e35b0946394a714c2cd6875c04988") {
          id
          currentPrice
          currentDeposit
          timeAcquired
          timeLastCollected
          totalCollected
          foreclosureTime
          currentPatron { 
              id
              stewards (patron: id) {
                  id
                  timeHeld
              }
          }
        }
      }`;
    }

    let stewardsObject = {
      id: '0',
      currentPrice: '0',
      currentDeposit: '0',
      timeAcquired: '0',
      timeLastCollected: '0',
      totalCollected: '0',
      currentPatron: '0x',
      foreclosureTime: '0'
    }

    const defaultSteward = {
      steward: stewardsObject,
    }

    const modifiedDataObject = {
      timeHeldHumanized: '0',
      USD: '0',
      combinedCollected: '0',
      foreclosureTimeHumanized: 'loading...',
      availableDeposit: '0',
    }

    const defaultModifiedData = {
      steward: modifiedDataObject
    }

    const [savedData, setSavedData] = useState(defaultSteward);
    const [modifiedData, setModifiedData] = useState(defaultModifiedData);

    const [ getSteward, { loading, error, data }] = useLazyQuery(STEWARD_QUERY, {fetchPolicy: 'cache-and-network'});

    const [buyArtSection, setBuyArtSection] = useState("");
    const [actionsSection, setActionsSection] = useState("");

    const artwork = props.v === 'v1' ? <img src={artImageV1} className="gallery" alt="A R T" />
    : props.v === 'v2' ? <img src={artImageV2} className="gallery" alt="A R T" />
    : <Fragment>Loading A R T . . .</Fragment>;

    const wrongNetworkHML = <Fragment>You are on the wrong network to interact with the artwork. Please switch to the correct network.</Fragment>;

    const restorationSection = props.v === 'v1' ? 
      <Fragment>
        <h2>RESTORATION</h2>
        This artwork was damaged, and went through a digital restoration. The damaged canvas is now irrevocably fused into this version. It's the first digital artwork that's always on sale that underwent a unique restoration procedure. <br />
        <br />
      </Fragment> : <Fragment></Fragment>

    const offlineHTML = <Fragment>
    [In order to interact with this artwork, you need to  have a web3/Ethereum-enabled browser and connect it (see top right of the page). Please download
      the <a href="https://metamask.io">MetaMask Chrome extension</a> or open in an Ethereum-compatible browser.]
    </Fragment>;

    function calculateDue(price, initTime, endTime) {
      // price * (now - timeLastCollected) * patronageNumerator/ patronageDenominator / 365 days;
      let numerator;
      let denominator;
      const year = ethers.BigNumber.from('31536000'); // 365 days
      if(props.v === "v1") {
        numerator = ethers.BigNumber.from('50000000000'); // 5 %
        denominator = ethers.BigNumber.from('1000000000000');
      } else if (props.v === "v2") {
        numerator = ethers.BigNumber.from('1000000000000'); // 100 %
        denominator = ethers.BigNumber.from('1000000000000');
      }
      const due = price.mul(endTime.sub(initTime)).mul(numerator).div(denominator).div(year);
      return due;
    }

    // initial load
    useEffect(() => {
      console.log('init fire');
      getSteward(); 
    }, []);

    // data parsing effect
    useEffect(() => {
      async function parseAndSaveData() {
          if(!!data) {
              if(savedData !== null) {
                  const modifiedData = await parseData(data.steward);
                  setSavedData(data);
                  setModifiedData(modifiedData);
              } 
          }
      }
      parseAndSaveData();
    }, [data]);

    async function parseData(data) {
      // modified data
      let modifiedData = defaultModifiedData;
      
      // time held humanized
      const diffSinceLastCollected = moment().subtract(data.timeLastCollected, 'seconds').unix();
      console.log(diffSinceLastCollected.toString());
      const totalTimeHeldBN = ethers.BigNumber.from(data.currentPatron.stewards[0].timeHeld).add(ethers.BigNumber.from(diffSinceLastCollected));
      console.log(totalTimeHeldBN.toString());
      const totalTimeHeld = moment.duration(totalTimeHeldBN.toString(), 'seconds').humanize();
      modifiedData.steward.timeHeldHumanized = totalTimeHeld;
      
      // usd values
      modifiedData.steward.USD = await getUSDValueOfArtwork(ethers.utils.formatEther(data.currentPrice));

      // totalCollected
      const owed = calculateDue(ethers.BigNumber.from(data.currentPrice), ethers.BigNumber.from(data.timeLastCollected), ethers.BigNumber.from(moment().unix()));
      const combinedCollected = ethers.BigNumber.from(data.totalCollected).add(owed);
      modifiedData.steward.combinedCollected = combinedCollected;

      // foreclosure time
      const foreclosureTimeHumanized = moment(parseInt(data.foreclosureTime)*1000).toString();
      console.log(foreclosureTimeHumanized.toString());
      modifiedData.steward.foreclosureTimeHumanized = foreclosureTimeHumanized;

      // available deposit
      const availableDeposit = ethers.utils.formatEther(ethers.BigNumber.from(data.currentDeposit).sub(owed));
      modifiedData.steward.availableDeposit = availableDeposit;

      return modifiedData;
    }

    useEffect(() => {
      if(props.injectedChainId !== props.hardcodedChainId && props.injectedChainId !== null && props.hardcodedChainId !== null) {
        setBuyArtSection(wrongNetworkHML);
        setActionsSection(wrongNetworkHML);
      } else if(props.injectedChainId === props.hardcodedChainId && props.v !== null && props.injectedChainId !== null) {
        setBuyArtSection(<Fragment>
        <p>You will pay {ethers.utils.formatEther(savedData.steward.currentPrice)} ETH.<br /> Since this is always on sale, you need to add your own sale price and initial amount you want to deposit for patronage: </p>
        <BuyForm
            artPriceETH={ethers.utils.formatEther(savedData.steward.currentPrice)}
            v={props.v}
            BuyArt={props.BuyArt} 
           />
        </Fragment>);

        if(props.v !== null) {
          setActionsSection(<Fragment>
            <ActionForms 
              v={props.v}
              changePrice={props.changePrice}
              topupDeposit={props.topupDeposit}
              withdrawSomeDeposit={props.withdrawSomeDeposit}
              withdrawWholeDeposit={props.withdrawWholeDeposit}
              collectPatronage={props.collectPatronage}
            />
            </Fragment>);
        }
      } else if(props.injectedChainId == null) {
        setBuyArtSection(offlineHTML);
        setActionsSection(offlineHTML);
      }
    }, [savedData, props.injectedChainId, props.signerSteward]);

    function refresh() {
      console.log('firing reload');
      getSteward();
    }

    return (
        <div className="App"> 
        {artwork} 
        <br /><br />
        <div className="section">
          <h2>VALUED AT:  {ethers.utils.formatEther(savedData.steward.currentPrice)} ETH (~${modifiedData.steward.USD} USD) </h2>
          Currently held by: {savedData.steward.currentPatron.id} <br />
          They've held it for a lifetime of {modifiedData.steward.timeHeldHumanized} thus far. {savedData.steward.currentPatron.id === "0x595f2c4e9e3e35b0946394a714c2cd6875c04988" ||  savedData.steward.currentPatron.id === "0xb602c0bbfab973422b91c8dfc8302b7b47550fc0" ? "Currently Foreclosed, Held by Smart Contract.": ""}<br />
          Patronage Rate: {rate} per annum of current sale price, paid per block. <br />
          <hr />
          <p>
            The digital artwork above is always on sale.<br />
            In order to own this artwork, you always have to specify a sale price. <br />
            Anyone can buy it from the current patron at any time for the specified sale price. <br />
            Whilst held, a fee (based on the patronage rate) is constantly levied, per second, as patronage towards the artist. <br />
          </p>
        </div>
        {/* V1 BUG SECTION */}
        <div className="section">
        {restorationSection}
        </div>
        {/* STATS & ACTIONS SECTION */}
        <div className="section">
        <h2>MORE DETAILS</h2>
        <Button key="refreshbutton" type={"primary"} onClick={refresh}>REFRESH DATA</Button><br />
        <br />
        <p>Currently Held By: {savedData.steward.currentPatron.id}</p>
        <p>Current Available Deposit: {modifiedData.steward.availableDeposit} ETH</p>
        <p>Current Foreclosure Time: {modifiedData.steward.foreclosureTimeHumanized}</p>
        <p>The current deposit will cover the patronage until the time above. At this time, the smart contract steward takes ownership of the artwork and sets its price back to zero.</p>
        <p>Once it crosses this time period, the patron can't top up their deposit anymore and is effectively foreclosed.</p>
        <p>Lifetime Patronage Collected (across all patrons): {ethers.utils.formatEther(modifiedData.steward.combinedCollected)} ETH</p>
        {/* BUYING ART SECTION */}
        <div className="section">
        <h2>BUY ARTWORK</h2>
        {buyArtSection}
        </div>
        <h2>PATRON ACTIONS</h2>
        Only the current patron can execute these functions. <br />
        <br />
        {actionsSection}
        <br /><br />

    </div>

        </div>
    );
}

export default BaseComponent
