'use strict';

// Скрипт для GitHub Actions — запускается ровно один раз по cron
// Пропускает проверку last-sent.json (GitHub cron сам контролирует расписание)

process.env.SKIP_DEDUP = 'true';

const { runDailyJob } = require('./daily-send');

runDailyJob()
  .then(() => {
    console.log('Morning message sent successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed to send morning message:', err.message);
    process.exit(1);
  });
