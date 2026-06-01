'use strict';

const { Bot } = require('grammy');
const cron = require('node-cron');
const path = require('path');
const fs   = require('fs');

const config = require('./config/config');
const { runDailyJob } = require('./jobs/daily-send');
const logger = require('./utils/logger');

const RECIPIENTS_PATH = path.resolve(__dirname, './config/recipients.json');

function loadRecipients() {
  return JSON.parse(fs.readFileSync(RECIPIENTS_PATH, 'utf-8'));
}

function saveRecipients(list) {
  fs.writeFileSync(RECIPIENTS_PATH, JSON.stringify(list, null, 2));
}

// ── Telegram Bot (polling для команд) ─────────────────────────────────────
const bot = new Bot(config.telegramBotToken);

bot.command('start', async (ctx) => {
  const chatId = ctx.chat.id;
  const name   = ctx.from.first_name || 'друг';

  const recipients = loadRecipients();

  if (recipients.includes(chatId)) {
    await ctx.reply('Ты уже в списке получателей ' + name + ' 👍\nКаждое утро в 08:00 MSK буду присылать погоду и курсы валют.');
    return;
  }

  recipients.push(chatId);
  saveRecipients(recipients);

  logger.info('New recipient added: ' + chatId + ' (' + name + ')');
  await ctx.reply(
    '✅ Готово, ' + name + '!\n\n' +
    'Ты добавлен в список получателей.\n' +
    'Каждое утро в <b>08:00 MSK</b> буду присылать:\n' +
    '• Погоду в Москве\n' +
    '• Курсы USD, EUR, CNY\n\n' +
    'Ждём утра! ☀️',
    { parse_mode: 'HTML' }
  );
});

bot.command('stop', async (ctx) => {
  const chatId = ctx.chat.id;
  const name   = ctx.from.first_name || 'друг';

  const recipients = loadRecipients();
  const idx = recipients.indexOf(chatId);

  if (idx === -1) {
    await ctx.reply('Тебя нет в списке получателей.');
    return;
  }

  recipients.splice(idx, 1);
  saveRecipients(recipients);

  logger.info('Recipient removed: ' + chatId + ' (' + name + ')');
  await ctx.reply('Хорошо ' + name + ', больше не буду присылать сообщения. Чтобы вернуться — напиши /start');
});

bot.command('status', async (ctx) => {
  const recipients = loadRecipients();
  await ctx.reply('Получателей: ' + recipients.length + '\nСледующая отправка: сегодня в 08:00 MSK (или завтра если уже было)');
});

// Запускаем polling
bot.start();
logger.info('Bot started, listening for commands (/start, /stop, /status)');

// ── Cron расписание ────────────────────────────────────────────────────────
const cronExpression = config.sendMinute + ' ' + config.sendHour + ' * * *';

cron.schedule(cronExpression, runDailyJob, {
  timezone: 'Europe/Moscow',
  noOverlap: true,
});

logger.info('Scheduler started. Daily message at ' + config.sendTime + ' MSK');
