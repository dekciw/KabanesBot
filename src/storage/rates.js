'use strict';

const fs = require('fs').promises;
const path = require('path');

const RATES_PATH = path.resolve(__dirname, '../../rates.json');

async function readYesterdayRates() {
  try {
    const raw = await fs.readFile(RATES_PATH, 'utf-8');
    const data = JSON.parse(raw);
    return data.rates;
  } catch (err) {
    return null;
  }
}

async function saveRates(rates) {
  const today = new Date().toISOString().split('T')[0];
  await fs.writeFile(RATES_PATH, JSON.stringify({ date: today, rates }), 'utf-8');
}

module.exports = { readYesterdayRates, saveRates };
