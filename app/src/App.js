import React, { Component } from "react";
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

export default App;
