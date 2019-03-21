import { drizzleConnect } from "drizzle-react";
import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from '@material-ui/core/Button';

/*
Edited from drizzle react components, ContractFrom.
Overkill. Needs to be refactored to smaller scope.
*/

class BuyForm extends Component {
  constructor(props, context) {
    super(props);

    this.handleInputChange = this.handleInputChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);

    this.contracts = context.drizzle.contracts;
    this.utils = context.drizzle.web3.utils;

    // Get the contract ABI
    const abi = this.contracts[this.props.contract].abi;

    this.inputs = [];
    var initialState = {};

    // Iterate over abi for correct function.
    for (var i = 0; i < abi.length; i++) {
      if (abi[i].name === this.props.method) {
        this.inputs = abi[i].inputs;

        for (var j = 0; j < this.inputs.length; j++) {
          initialState[this.inputs[j].name] = "";
        }

        break;
      }
    }

    this.state = initialState;
  }

  handleSubmit(event) {
    event.preventDefault();
    let args = this.props.sendArgs;
    const convertedInputs = this.inputs.map((input, index) => {
      if (input.type === 'bytes32') {
        return this.utils.toHex(this.state[input.name])
      } else if (input.type === 'uint256') {
        return this.utils.toWei(this.state[input.name], 'ether'); // all number fields are ETH  fields.
      }
      return this.state[input.name];
    });

    // todo: if foreclosed, price should default to zero.
    if (this.state.value) {
      console.log(this.props.contracts[this.props.contract]['price']['0x0'].value);
      const artworkPrice = new this.utils.BN(this.props.contracts[this.props.contract]['price']['0x0'].value);
      args.value = new this.utils.BN(this.utils.toWei(this.state.value, 'ether')).add(artworkPrice);
    }
    if (args) {
      return this.contracts[this.props.contract].methods[
        this.props.method
      ].cacheSend(...convertedInputs, args);
    }

    return this.contracts[this.props.contract].methods[
      this.props.method
    ].cacheSend(...convertedInputs);
  }

  handleInputChange(event) {
    this.setState({ [event.target.name]: event.target.value });
  }

  translateType(type) {
    switch (true) {
      case /^uint/.test(type):
        return "number";
      case /^string/.test(type) || /^bytes/.test(type):
        return "text";
      case /^bool/.test(type):
        return "checkbox";
      default:
        return "text";
    }
  }

  render() {
    const valueLabel = this.props.valueLabel;
    return (
      <form className="pure-form pure-form-stacked" onSubmit={this.handleSubmit}>
        {this.inputs.map((input, index) => {
          var inputType = this.translateType(input.type);
          var inputLabel = this.props.labels
            ? this.props.labels[index]
            : input.name;
          // check if input type is struct and if so loop out struct fields as well
          return (
            <Input
              key={input.name}
              type={inputType}
              name={input.name}
              value={this.state[input.name]}
              placeholder={inputLabel}
              onChange={this.handleInputChange}
              startAdornment={<InputAdornment position="start">ETH</InputAdornment>} 
            />
          );
        })}
        {valueLabel &&
          <Fragment>
          <br />
          <Input 
          key={valueLabel} 
          type='number' 
          name='value' 
          value={this.state[valueLabel]} 
          placeholder={valueLabel} 
          onChange={this.handleInputChange} 
          startAdornment={<InputAdornment position="start">ETH</InputAdornment>} />
          <br />
          <br />
          </Fragment>
        }
        <Button
          variant="contained"
          key="submit"
          className="pure-button"
          type="button"
          onClick={this.handleSubmit}
        >
          Buy Artwork
        </Button>
      </form>
    );
  }
}

BuyForm.contextTypes = {
  drizzle: PropTypes.object,
};

// todo: add value label
BuyForm.propTypes = {
  contract: PropTypes.string.isRequired,
  method: PropTypes.string.isRequired,
  sendArgs: PropTypes.object,
  labels: PropTypes.arrayOf(PropTypes.string),
};

/*
 * Export connected component.
 */

const mapStateToProps = state => {
  return {
    contracts: state.contracts,
  };
};

export default drizzleConnect(BuyForm, mapStateToProps);
