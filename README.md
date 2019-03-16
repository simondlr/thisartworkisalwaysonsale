## This Artwork Is Always On Sale (TAIAOS)

An art project that showcases a digital artwork that is always on sale through Harberger Taxed property rights. The owner of the artwork always has to set a sale price, upon which it can be bought by anyone at any time. A continuous tax is levied as patronage towards the artist calculated on the owner's price they set. If the deposit does not cover the patronage owed, the smart contract steward can foreclose the artwork and take back ownership.

### Tech

This is a work-in-progress.

- Built on Ethereum using OpenZeppelin's ERC721 (modified to only be transferable through a steward contract).
- The artwork follows the ERC721 NFT metadata standard and is viewable in any compatible browser (eg, Coinbase' Wallet or Status.im).
- It uses Drizzle Box as base for front-end (using legacy react API).
- Components from drizzle-react-components were forked (bit overkill atm and might refactor).

### ArtSteward.sol

This smart contract is responsible for managing ownership over the artwork. It takes in a deposit and sets the price for the artwork (by the owner). Over time, it collects patronage towards the artist and forecloses the artwork in case the owner can't pay anymore.

This is feature-complete atm, along with a test suite.

### Testing

`npm run chain`  
then
`truffle test`

The Gas Reporter is disable (since it is slower). Enable gas reporter in truffle config to check.

The test may sometimes fail due to split-second changes in when the test is run due to patronage incrementing per second.
Just re-run.

NOTE: It costs ~$0.12 tx fee at 5 gwei gas price & 133 usd/eth to buy. 

### Front-End

The front-end is forked from drizzle-box. A simple front-end allows users to buy the artwork, set the price and manage their patronage (deposit & fees). This

### Running TAIAOS

After installing packages, main directory:

`npm run chain`  
or  
`npm run moving_chain`  

This creates a local ganache-cli instance. The latter includes auto-mining of blocks to showcase the patronage owed increasing on the front-end.

`truffle migrate`

This deploys the ERC721-artwork/nft & the ArtSteward.

`cd app`  
`npm run start`  

### Radical Markets In The Arts

This is inspired by the book & idea, called Radical Markets by Glen Weyl & Eric Posner. I wrote up a blog post detailing extensively how some of these ideas can lead to new radical markets in the arts: https://medium.com/radicalxchange/radical-markets-in-the-arts-13c27d3b7283.

Feel free to fork this code and create your own artwork in this manner.

### Thanks

The initial ArtSteward.sol code was inspired by code from Billy Rennekamp: https://github.com/okwme/harberger-ads-contracts & Todd Proebsting: https://programtheblockchain.com/posts/2018/09/19/implementing-harberger-tax-deeds/.

### Future  Improvements

- DAI (and ERC20) support.
- Generic collector. Would be nice to have this collector be generic for other Harberger Property rights in the future.
- Incentivize a keeper to foreclose [small fee].
- Experiment with other tx formats to pay patronage vs requiring a deposit.
- Separate concerns between patron & holder. Currently, transferring the artwork without the steward is prohibited. The additional complexity proves too much short-term risk and requires a bit of a rewrite. But essentially, if a patron who owns wants to send it someone else or perhaps use the artwork in some other form of collateral, they should be allowed. So, the holder should be split from the patron. For now, however, both are the same and the artwork can only be transferred through the steward.
- Improve licensing.
- True COST. Creating a collective artwork (longer term project).

### License

Code License:
MIT

Artwork License:
An appropriate license still needs to be specified for the artwork such that its ownership is legally linked to the Steward/Blockchain. If you can help here, let me know.