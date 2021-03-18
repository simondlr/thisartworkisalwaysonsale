
## This Artwork Is Always On Sale (TAIAOS)

![TAIAOS](https://raw.githubusercontent.com/simondlr/thisartworkisalwaysonsale/master/packages/react-app/src/components/TAIAOS4.png)

Updates: January-March 2021.

- v1 Restored along with a subgraph and design improvements.

New Release: June 2020.

- Launched new artwork with 100% patronage rate.
- Fixed bugs for v2.
- V1 Artwork is still for sale, but has a warning caution on edge cases that could stop it from functioning properly (front-running attacks can steal deposits + a contract buying it can block from it being sold in perpetuity). More details here: https://github.com/simondlr/thisartworkisalwaysonsale/issues/18 

### About

TAIAOS is an art project that showcases a digital artwork that is always on sale through Harberger Tax property rights. The owner of the artwork always has to set a sale price, upon which it can be bought by anyone at any time. A continuous tax is levied as patronage towards the artist calculated on the owner's price they set. If the deposit does not cover the patronage owed, the smart contract steward can foreclose the artwork and take back ownership.

### Tech

- This repo is forked from https://github.com/austintgriffith/scaffold-eth & extensively modified.

- Hardhat + waffle + openzeppelin for testing + smart contract development.
- Uses modified ERC721 (only the steward can transfer it). Forked from openzeppelin library.
- Graph Protocol for indexing state.
- Blocknative for monitoring transactions.
- web3modal for connecting to wallets.
  
### ArtSteward.sol

This smart contract is responsible for managing ownership over the artwork. It takes in a deposit and sets the price for the artwork (by the owner). Over time, it collects patronage towards the artist and forecloses the artwork in case the owner can't pay anymore.

### Development & Testing

### 1. Start Node + Deploy Contracts 
```yarn install```  
```yarn run node```   
It will use the default mnemonic in ```./scripts/wallet-utils.js``` and start a local EVM.   
If you need a custom mnemonic, just:   
```export MNEMONIC="<insert_your_own_mnemonic_here>```   
```yarn run deploy_contracts_v2_local```    
Save the addresses manually and copy-paste it to required addresses in react-app/src/App.js.   

### 2. Start a local Graph Node.
Follow [these instructions](https://thegraph.com/docs/quick-start#local-development) to start a local Graph Node. Note: It's not necessary to the ganache steps as hardhat is the chosen EVM. Only, the parts about the Graph Node.  
```docker-compose up```  
When you cycle it (in between running the EVM or not), you might have to delete the data. NOT necessary for initial setup.  
```rm -rf data``` 

### 3. Clone and Deploy TAIAOS Subgraph
In a new folder, git clone [taiaos-subgraph](https://github.com/simondlr/taiaos-subgraph).    
```yarn run install```  
If the address differs, you must copy it from hardhat and put into the subgraph.yaml. NOTE: the subgraph.yaml needs to be modified to only include 1 set of artwork+steward combination. The subgraph.yaml is currently set up for this specific mainnet implementation.
```yarn run codegen```  
```yarn run build``` 
```yarn run create-local```  
```yarn run deploy-local``` 

### New Markets In The Arts

This is inspired by the book & idea, called Radical Markets by Glen Weyl & Eric Posner. Some references to work detailing some of these ideas for implementation in the arts:

https://medium.com/radicalxchange/radical-markets-in-the-arts-13c27d3b7283  
https://blog.simondlr.com/posts/patronage-as-an-asset-class  
https://blog.simondlr.com/posts/exploring-harberger-tax-in-patronage-markets  
https://blog.simondlr.com/posts/new-markets-in-the-arts-property-rights  

Feel free to fork this code and create your own artwork in this manner.

### Other Work

Since this project was first published in March 2019, several teams have continued experimentation. Most notably is the Wildcards team: using patronage collectibles for conservation. Please support!

https://wildcards.world/

### Thanks

The initial ArtSteward.sol code was inspired by code from Billy Rennekamp: https://github.com/okwme/harberger-ads-contracts & Todd Proebsting: https://programtheblockchain.com/posts/2018/09/19/implementing-harberger-tax-deeds/.

### License

Code License:
MIT

