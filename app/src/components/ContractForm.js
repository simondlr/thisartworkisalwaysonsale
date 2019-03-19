import { drizzleConnect } from "drizzle-react";
import React, { Component, Fragment } from "react";
import PropTypes from "prop-types";
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import Button from '@material-ui/core/Button';

class ContractForm extends Component {
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
    console.log(args);
    const convertedInputs = this.inputs.map((input, index) => {
      if (input.type === 'bytes32') {
        return this.utils.toHex(this.state[input.name])
      } else if (input.type === 'uint256') {
        console.log('numbers');
        console.log(this.utils.toWei(this.state[input.name], 'ether'));
        return this.utils.toWei(this.state[input.name], 'ether'); // all number fields are ETH  fields.
      }
      return this.state[input.name];
    });

    console.log('state');
    console.log(this.state);
    if (this.state.value) {
      console.log('val label');
      args.value = this.utils.toWei(this.state.value, 'ether');
    }
    console.log('args2');
    console.log(args);
    if (args) {
      console.log('sending with args');
      return this.contracts[this.props.contract].methods[
        this.props.method
      ].cacheSend(...convertedInputs, args);
    }

    console.log(convertedInputs);
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
        <Button
          variant="contained"
          key="submit"
          className="pure-button"
          type="button"
          onClick={this.handleSubmit}
        >
          {this.props.buttonText}
        </Button>
        <br />
        <br />
      </form>
    );
  }
}

ContractForm.contextTypes = {
  drizzle: PropTypes.object,
};

// todo: add value label
ContractForm.propTypes = {
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

export default drizzleConnect(ContractForm, mapStateToProps);
