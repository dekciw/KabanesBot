'use strict';

const { Api } = require('grammy');
const logger = require('../utils/logger');

function createTelegramService(token) {
  const api = new Api(token);

  return {
    async broadcastMessage(recipients, text) {
      for (const chatId of recipients) {
        try {
          await api.sendMessage(chatId, text, { parse_mode: 'HTML' });
          logger.info('Sent to chatId ' + chatId);
        } catch (err) {
          logger.error('Failed to send to chatId ' + chatId + ': ' + err.message);
        }
      }
    },

    async broadcastAnimation(recipients, animationUrl, caption) {
      for (const chatId of recipients) {
        try {
          const options = caption ? { caption, parse_mode: 'HTML' } : {};
          await api.sendAnimation(chatId, animationUrl, options);
          logger.info('Sent animation to chatId ' + chatId);
        } catch (err) {
          logger.error('Failed to send animation to chatId ' + chatId + ': ' + err.message);
        }
      }
    },
  };
}

module.exports = { createTelegramService };
