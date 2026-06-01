'use strict';

require('dotenv').config();

const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
if (!telegramBotToken) {
  throw new Error('TELEGRAM_BOT_TOKEN is required in .env');
}

const sendTime = process.env.SEND_TIME || '08:00';
const parts = sendTime.split(':');
const sendHour = parseInt(parts[0], 10);
const sendMinute = parseInt(parts[1], 10);

const recipients = require('./recipients.json');

const currencylayerKey = process.env.CURRENCYLAYER_KEY || null;
const owmKey = process.env.OWM_KEY || null;
const klipyApiKey = process.env.KLIPY_API_KEY || null;

module.exports = {
  telegramBotToken,
  sendTime,
  sendHour,
  sendMinute,
  recipients,
  currencylayerKey,
  owmKey,
  klipyApiKey
};
