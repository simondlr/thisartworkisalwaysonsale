import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "antd";
import artworkv1 from "./TAIAOS4.png";
import artworkv2 from "./TAIAOS_2.png";
import moment from 'moment';
import { ethers } from "ethers";
import { getUSDValueOfArtwork } from '../hooks/Prices.js';

import { gql, useLazyQuery } from '@apollo/client';

function IntroComponent(props) {

    const STEWARDS_QUERY = gql`
    {
        v1: steward(id: "0xb602c0bbfab973422b91c8dfc8302b7b47550fc0") {
          id
          currentPrice
          timeAcquired
          timeLastCollected
          currentPatron { 
              id
              stewards (patron: id) {
                  id
                  timeHeld
              }
            }
        }
        v2: steward(id: "0x595f2c4e9e3e35b0946394a714c2cd6875c04988") {
            id
            currentPrice
            timeAcquired
            timeLastCollected
            currentPatron { 
                id
                stewards (patron: id) {
                    id
                    timeHeld
                }
              }
          }
      }
    `

    let stewardsObject = {
        id: '0',
        currentPrice: '0',
        timeAcquired: '0',
        timeLastCollected: '0',
        currentPatron: '0x',
    }

    const defaultSteward = {
        v1: stewardsObject,
        v2: stewardsObject
    }

    const modifiedDataObject = {
        timeHeldHumanized: '0',
        USD: '0'
    }

    const defaultModifiedData = {
        v1: modifiedDataObject,
        v2: modifiedDataObject
    }

    const [savedData, setSavedData] = useState(defaultSteward);
    const [modifiedData, setModifiedData] = useState(defaultModifiedData);

    const [ getStewards, { loading, error, data }] = useLazyQuery(STEWARDS_QUERY, {fetchPolicy: 'cache-and-network'});

    // initial load
    useEffect(() => {
        getStewards(); 
    }, []);

    useEffect(() => {
        async function parseAndSaveData() {
            if(!!data) {
                if(savedData !== null) {
                    const modifiedData = await parseData(data);
                    setSavedData(data);
                    setModifiedData(modifiedData);
                    // console.log('sieved', data);
                    // console.log('sieved', modifiedData);
                } 
            } 
        }
        parseAndSaveData();
    }, [data]);

    async function parseASteward(data) {
        let modifiedData = {};

        // time held
        const diffSinceLastCollected = moment().subtract(data.timeLastCollected, 'seconds').unix();
        console.log(diffSinceLastCollected.toString());
        const totalTimeHeldBN = ethers.BigNumber.from(data.currentPatron.stewards[0].timeHeld).add(ethers.BigNumber.from(diffSinceLastCollected));
        console.log(totalTimeHeldBN.toString());
        const totalTimeHeld = moment.duration(totalTimeHeldBN.toString(), 'seconds').humanize();
        modifiedData.timeHeldHumanized = totalTimeHeld;

        // USD value
        modifiedData.USD = await getUSDValueOfArtwork(ethers.utils.formatEther(data.currentPrice));
        return modifiedData;
    }

    async function parseData(data) {
        let modifiedData = {};
        modifiedData.v1 = await parseASteward(data.v1);
        modifiedData.v2 = await parseASteward(data.v2);
        return modifiedData;
    }

    return (
        <div className="App"> 
        <img src={artworkv1} className="gallery" alt="A R T" />
        <br /><br />
        <div className="section">
        <h3>Original (2019). Restored (2021).</h3>
        Valued at:  {ethers.utils.formatEther(savedData.v1.currentPrice)} ETH (~${modifiedData.v1.USD} USD)<br />
        Currently held by {savedData.v1.currentPatron.id}. <br />
        They've held it for a lifetime of {modifiedData.v1.timeHeldHumanized} thus far. {savedData.v1.currentPatron.id === "0xb602c0bbfab973422b91c8dfc8302b7b47550fc0" ? "Currently Foreclosed, Held by Smart Contract.": ""}<br />
        Patronage Rate: 5% per annum of sale price.<br />
        <br />
        <Link to="/v1"><Button >More Details</Button></Link> <br />
        <br />
        </div>
        <img src={artworkv2} className="gallery" alt="A R T" />
        <br /><br />
        <div className="section">
        <h3>V2 (2020)</h3>
        Valued at:  {ethers.utils.formatEther(savedData.v2.currentPrice)} ETH (~${modifiedData.v2.USD} USD) <br />
        Currently held by {savedData.v2.currentPatron.id}. <br />
        They've held it for a lifetime of {modifiedData.v2.timeHeldHumanized} thus far. {savedData.v2.currentPatron.id === "0x595f2c4e9e3e35b0946394a714c2cd6875c04988" ? "Currently Foreclosed, Held by Smart Contract.": ""}<br />
        Patronage Rate: 100% per annum of sale price.<br />
        <br />
        <Link to="/v2"><Button >More Details</Button></Link> <br />
        </div>
        <hr />
        <div className="section">
        <h2>THE ARTWORKS:</h2>
        First launched on March 21, 2019, these NFT, digital artworks explore digital art with novel property rights associated with it.
        Using the Ethereum blockchain, it is possible to introduce scarcity of ownership alongside novel
        economic and property rights. Inspired by Radical Markets, this artwork follows a modified Harberger Tax (COST) property
        ownership where the tax on the property (patronage) is collected only by the artist. It is perpetual royalty. 
        <br /><br />
        Through this, it asks a few questions:<br />
        Does this digital art property rights system change the relationship between collector/patron and artist? <br />
        Does allowing for a more readily available avenue for patronage create more revenue for an artist? <br />
        Does this property rights system allow for more sustainable funding of creative works? <br />
        Does an always-on auction and market for arts and subsequent speculation/pricing change the relationship
        towards the art and the artist? <br />
        Does the increased turnover of the digital art and subsequent possibility of ownership by more people increase the value of the art (financially and artistically)?<br />
        Does always-on-sale art help us understand how much of our currently life is already always on sale without us knowing it? <br />
        <br />
        For more information, read this article: <a href="https://medium.com/@simondlr/this-artwork-is-always-on-sale-92a7d0c67f43">https://medium.com/@simondlr/this-artwork-is-always-on-sale-92a7d0c67f43</a><br />
        <br />
        The first artwork has a patronage rate of 5%. It was restored after it was discovered that it was damaged. A new edition was created, launched in June 2020, using a new patronage rate of 100% in order to continue experimentation.
        You can check out more technical details, fork this project, and create your own artwork here: <br />
        <br />
        <a href="https://github.com/simondlr/thisartworkisalwaysonsale">https://github.com/simondlr/thisartworkisalwaysonsale</a>
        </div>
        <hr />
        {/* PRESS SECTION */}
        <div className="section">
        <h2>PRESS/MENTIONS:</h2>
        Ethereal Aether. State Hermitage (2021): <a href="https://celestialhermitage.ru/en/">Celestial Hermitage</a> <br />
        Bijutsu Techo (2021): <a href="https://bijutsu.press/books/4892/">特集 「NFTアート」ってなんなんだ？！(Special Feature What is "NFT Art"? !) </a> <br />
        artnet (2021): <a href="https://news.artnet.com/opinion/artists-blockchain-resale-royalties-1956903">"Artists Have Been Attempting to Secure Royalties on Their Work for More Than a Century. Blockchain Finally Offers Them a Breakthrough." </a> <br />
        AMTLab (2021): <a href="https://amt-lab.org/blog/2021/9/nft-considerations-and-implications">"NFTs Legal Considerations And Implications"</a> <br />
        CLOTmag (2021): <a href="https://www.clotmag.com/oped/talking-about-art-and-the-blockchain-by-charlotte-kent">"‘Talking about Art and the Blockchain’ by Charlotte Kent"</a> <br />
        ParaSite Hong Kong (2019): <a href="https://www.youtube.com/watch?v=all1wr0Gk7o">"This Artwork is Always on Sale: A Crypto Story"</a> <br />
        CoinDesk (2019): <a href="https://www.coindesk.com/markets/2019/03/26/the-radicalxchange-movements-crypto-cypherpunk-appeal/">"The RadicalxChange Movement's Crypto-Cypherpunk Appeal"</a> <br />
        </div>
        <hr />
        {/* ARTIST SECTION */}
        <div className="section">
        <h2>THE ARTIST:</h2>
        I'm a creator at heart.
        I have created games, writing, music, code, companies, and new economics. Solving the problems of the creator 
        has always been important to me. In the past I co-founded Ujo Music,
        working with Grammy-winning artists such as Imogen Heap and RAC to launch the first music royalty projects using smart contracts. I've
        helped kickstart wholly new markets and economies. I helped to create the Ethereum ERC20 token standard and token bonding curves, technologies 
        that's currently facilitating economies worth several billion dollars of value.
        I enjoy creating new forms of art and experimenting with ways to empower creatives.
        <br />
        <br />
        Swing me a follow on Twitter! <a href="https://twitter.com/simondlr">@simondlr</a>.<br />
        Check my other art projects. <a href="https://blog.simondlr.com/art">blog.simondlr.com/art</a><br />
        <br />
        </div>
        </div>
    );
}

export default IntroComponent
