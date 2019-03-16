import BaseComponent from "./components/BaseComponent";
import { drizzleConnect } from "drizzle-react";

const mapStateToProps = state => {
  return {
    accounts: state.accounts,
    ERC721Full: state.contracts.ERC721Full,
    ArtSteward: state.contracts.ArtSteward,
    drizzleStatus: state.drizzleStatus,
  };
};

const BaseContainer = drizzleConnect(BaseComponent, mapStateToProps);

export default BaseContainer;
