import React from "react";
import { Link } from "react-router-dom";
import { Button } from "antd";
import artworkv1 from "./TAIAOS4.png";
import artworkv2 from "./TAIAOS_2.png";

function IntroComponent(props) {
     
    return (
        <div className="App"> 
        <h1>These Artworks Are Always* On Sale.</h1> 
        <h2>2020 Edition. June 2020. </h2>
        <img src={artworkv2} style={{maxWidth: "100%", maxHeight: "100%"}} alt="A R T" />
        <h2>Valued at:  {props.artV2.artPriceETH} ETH (~${props.artV2.artPriceUSD} USD) </h2>
        Patronage Rate: 100% per annum of sale price.<br />
        Current Patron: {props.artV2.patron} <br />
        Time Held By Patron: {props.artV2.timeHeldHumanized} <br />
        <br />
        <Link to="/v2"><Button type="primary">More Details</Button></Link> <br />
        <hr />
        <h2>Original. 21 March 2019. </h2>
        <img src={artworkv1} style={{maxWidth: "100%", maxHeight: "100%"}} alt="A R T" />
        <h2>Valued at:  {props.artV1.artPriceETH} ETH (~${props.artV1.artPriceUSD} USD) </h2>
        Patronage Rate: 5% per annum of sale price.<br />
        Current Patron: {props.artV1.patron} <br />
        Time Held By Patron: {props.artV1.timeHeldHumanized} <br />
        <br />
        <Link to="/v1"><Button type="primary">More Details</Button></Link> <br />
        *Note: The original edition has a few edge-case bugs. If exploited, it will function differently. Caution is highly advised. More details on the artwork page.
        <hr />
        <div className="section">
        <h2>About The Artworks:</h2>
        First launched on March 21, 2019, these artworks explore digital art with novel property rights associated with it.
        Using the Ethereum blockchain, it is possible to introduce scarcity of ownership alongside novel
        economic and property rights. Inspired by Radical Markets, this artwork follows a modified Harberger Tax (COST) property
        ownership where the tax on the property (patronage) is collected only by the artist. Through this, it asks a few questions:<br />
        <br />
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
        The first artwork has a patronage rate of 5%, and has a few bugs in it. Thus: a new edition was created, launched in June 2020, using a new patronage rate of 100% in order to continue experimentation.
        You can check out more technical details, fork this project, and create your own artwork here: <br />
        <br />
        <a href="https://github.com/simondlr/thisartworkisalwaysonsale">https://github.com/simondlr/thisartworkisalwaysonsale</a>
        </div>
        <hr />
        {/* ARTIST SECTION */}
        <div className="section">
        <h2>About The Artist:</h2>
        I'm a creator at heart.
        I have created games, writing, music, code, companies, and new economics. Solving the problems of the creator 
        has always been important to me. In the past I co-founded Ujo Music,
        working with Grammy-winning artists such as Imogen Heap and RAC to launch the first music royalty projects using smart contracts. I've
        helped kickstart wholly new markets and economies. I helped to create the Ethereum ERC20 token standard and token bonding curves, technologies 
        that's currently facilitating economies worth several billion dollars of value.
        I enjoy creating new forms of art and experimenting with ways to empower the creative industry.
        <br />
        <br />
        Swing me a follow on Twitter! <a href="https://twitter.com/simondlr">@simondlr</a>.<br />
        <br />
        </div>
        </div>
    );
}

export default IntroComponent
