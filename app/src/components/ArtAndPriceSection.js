import { drizzleConnect } from "drizzle-react";
import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";

import artwork from "./TAIAOS4.png";

import PriceSection from "./PriceSection";

class ArtAndPriceSection extends Component {
    render() {
      return (
        <Fragment>
        <img src={artwork} style={{maxWidth: "100%", maxHeight: "100%"}} alt="A R T" />
        <PriceSection />
        <p>
          The digital artwork above is always on sale.<br />
          In order to own this artwork, you always have to specify a sale price. <br />
          Anyone can buy it from the current patron at any time for the specified sale price. <br />
          Whilst held, a 5% fee (pa) is levied as patronage towards the artist. <br />
        </p>
        </Fragment>
      )
    }
}

ArtAndPriceSection.contextTypes = {
  drizzle: PropTypes.object,
};

ArtAndPriceSection.propTypes = {
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

export default drizzleConnect(ArtAndPriceSection, mapStateToProps);
