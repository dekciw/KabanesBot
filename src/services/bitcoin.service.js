'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

// CoinGecko — бесплатно, без ключа
const COINGECKO_URL = 'https://api.coingecko.com/api/v3/simple/price';

async function getBitcoinRub() {
  try {
    const response = await axios.get(COINGECKO_URL, {
      params: { ids: 'bitcoin', vs_currencies: 'rub' },
      timeout: 5000,
    });
    const price = response.data && response.data.bitcoin && response.data.bitcoin.rub;
    if (!price) {
      logger.warn('CoinGecko: bitcoin price missing');
      return null;
    }
    return Math.round(price);
  } catch (err) {
    logger.error('CoinGecko fetch failed: ' + err.message);
    return null;
  }
}

module.exports = { getBitcoinRub };
