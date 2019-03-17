import { drizzleConnect } from "drizzle-react";
import React, { Component } from "react";
import PropTypes from "prop-types";

import BuyArtworkSection from "./BuyArtworkSection";
import ArtAndPriceSection from "./ArtAndPriceSection";

class IntroSection extends Component {
    render() {
      return (
        <div className="section">
        <ArtAndPriceSection />
        <BuyArtworkSection />
      </div>
      )
    }
}

IntroSection.contextTypes = {
  drizzle: PropTypes.object,
};

IntroSection.propTypes = {
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

export default drizzleConnect(IntroSection, mapStateToProps);
