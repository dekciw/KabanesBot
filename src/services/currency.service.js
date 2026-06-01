'use strict';

const axios = require('axios');
const logger = require('../utils/logger');
const rates = require('../storage/rates');

const CURRENCYLAYER_URL = 'http://api.currencylayer.com/live';

function createCurrencyService(apiKey) {
  return {
    async getCurrencyData() {
      if (!apiKey) {
        logger.warn('CURRENCYLAYER_KEY is not set — skipping currency fetch');
        return null;
      }

      let yesterdayData = null;
      try {
        yesterdayData = await rates.readYesterdayRates();
      } catch (err) {
        yesterdayData = null;
      }

      let response;
      try {
        response = await axios.get(CURRENCYLAYER_URL, {
          params: {
            access_key: apiKey,
            currencies: 'RUB,EUR,CNY',
            source: 'USD',
          },
          timeout: 5000,
        });

        if (!response.data || response.data.success === false) {
          logger.error('CurrencyLayer error: ' + JSON.stringify(response.data && response.data.error));
          return null;
        }

        const usdRub = Math.round(response.data.quotes.USDRUB * 100) / 100;
        const usdEur = response.data.quotes.USDEUR;
        const usdCny = response.data.quotes.USDCNY;
        const eurRub = Math.round((usdRub / usdEur) * 100) / 100;
        const cnyRub = Math.round((usdRub / usdCny) * 100) / 100;

        let changes = null;
        if (yesterdayData && yesterdayData.USDRUB && yesterdayData.EURRUB && yesterdayData.CNYRUB) {
          changes = {
            USD: {
              rubles: Math.round((usdRub - yesterdayData.USDRUB) * 100) / 100,
              percent: Math.round(((usdRub - yesterdayData.USDRUB) / yesterdayData.USDRUB) * 10000) / 100,
            },
            EUR: {
              rubles: Math.round((eurRub - yesterdayData.EURRUB) * 100) / 100,
              percent: Math.round(((eurRub - yesterdayData.EURRUB) / yesterdayData.EURRUB) * 10000) / 100,
            },
            CNY: {
              rubles: Math.round((cnyRub - yesterdayData.CNYRUB) * 100) / 100,
              percent: Math.round(((cnyRub - yesterdayData.CNYRUB) / yesterdayData.CNYRUB) * 10000) / 100,
            },
          };
        }

        return {
          today: { USDRUB: usdRub, USDEUR: usdEur, EURRUB: eurRub, USDCNY: usdCny, CNYRUB: cnyRub },
          yesterday: yesterdayData || null,
          changes: changes,
        };
      } catch (err) {
        logger.error('CurrencyLayer fetch failed: ' + err.message);
        return null;
      }
    },
  };
}

module.exports = { createCurrencyService };
