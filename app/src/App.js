import React, { Component } from "react";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { DrizzleProvider } from "drizzle-react";
import OfflineContainer from "./OfflineContainer"; // modified from drizzle-react-components

import "./App.css";

import drizzleOptions from "./drizzleOptions";
import BaseContainer from "./BaseContainer";

class App extends Component {
  render() {
    return (
      <DrizzleProvider options={drizzleOptions}>
        <OfflineContainer>
          <BaseContainer />
        </OfflineContainer>
      </DrizzleProvider>
    );
  }
}

/* unused in contract, but keeping for now */
class Metadata extends Component {
  constructor() {
    super();
    this.data = {
      name: "This Artwork Is Always On Sale",
      description: "A Digital Artwork That Is Always On Sale",
      image: "https://thisartworkisalwaysonsale.com/static/media/TAIAOS4.3cd60b66.png"
    };
  }
  render() {
    return (
      <div>{JSON.stringify(this.data)}</div>
    )
  }
}

class AppRoutes extends Component {
  render() {
    return (
      <Router>
        <Route path='/' exact component={App}/>
        <Route path='/metadata' exact component={Metadata}/>
      </Router>
    )
  }
}

export default AppRoutes;
