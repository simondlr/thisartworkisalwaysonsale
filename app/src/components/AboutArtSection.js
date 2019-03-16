import React, { Component } from "react";

class AboutArtSection extends Component {
    render() {
        return (
        <div className="section">
          <h2>About The Artwork:</h2>
          This artwork explores digital art with novel property rights associated with it.
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
          Technically, this project utilised Ethereum smart contracts, is open source and follows the appropriate standards (ERC721)
          for displaying and holding non-fungible tokens. You can fork this project and create your own artwork here:
          <a href="https://github.com/simondlr/thisartworkisalwaysonsale">https://github.com/simondlr/thisartworkisalwaysonsale</a><br />
        </div>
        )
    }
}

export default AboutArtSection;