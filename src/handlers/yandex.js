'use strict';

// Обработчик для Yandex Cloud Functions
// Вызывается по таймеру каждый день в 07:00 MSK

process.env.SKIP_DEDUP = 'true';

const { runDailyJob } = require('../jobs/daily-send');

module.exports.handler = async function(event, context) {
  try {
    await runDailyJob();
    return { statusCode: 200, body: 'Morning message sent' };
  } catch (err) {
    console.error('Error:', err.message);
    return { statusCode: 500, body: err.message };
  }
};
