import axios from 'axios';

// import BN?

export const getUSDValue = async (ETH) => {
    // fetch exchange rate.
    // calculate USD price.
    // https://api.kraken.com/0/public/Ticker?pair=ETHUSD).result.XETHZUSD.c.0
    const ETHUSD = await axios.get('https://api.kraken.com/0/public/Ticker?pair=ETHUSD');
    // todo: return -1 if URI request failed
    if (ETHUSD.hasOwnProperty('data')) {
        return parseInt(ETH)*parseInt(ETHUSD.data.result.XETHZUSD.c[0]);
    } else {
        return -1;
    }
}