import React, { Component } from "react";

import IntroSection from "./IntroSection";
import ActionSection from "./ActionSection";
import ArtistSection from "./ArtistSection";
import BuyingArtSection from "./BuyingArtSection";
import AboutArtSection from "./AboutArtSection";

// import cc from "cryptocompare";  //TODO

class BaseComponent extends Component {

  render() {
    return (
      <div className="App">
        <IntroSection />
        <BuyingArtSection />
        <ActionSection />
        <AboutArtSection />
        <ArtistSection />
      </div>
    );
  }
}

export default BaseComponent
