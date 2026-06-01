'use strict';

const config = require('../config/config');
const { createTelegramService } = require('../services/telegram.service');
const { createCurrencyService } = require('../services/currency.service');
const { createWeatherService }  = require('../services/weather.service');
const { getBitcoinRub }         = require('../services/bitcoin.service');
const { KlipyService }          = require('../services/klipy.service');
const dedup  = require('../storage/dedup');
const rates  = require('../storage/rates');
const logger = require('../utils/logger');

const telegramService = createTelegramService(config.telegramBotToken);
const currencyService = createCurrencyService(config.currencylayerKey);
const weatherService  = createWeatherService(config.owmKey);
const klipyService    = config.klipyApiKey ? new KlipyService(config.klipyApiKey) : null;

// ─── NewsEmoji кастомные стикеры ────────────────────────────────────────────
const CE = {
  sun:      '<tg-emoji emoji-id="5402477260982731644">☀️</tg-emoji>',
  rain:     '<tg-emoji emoji-id="5399913388845322366">🌧</tg-emoji>',
  snow:     '<tg-emoji emoji-id="5449449325434266744">❄️</tg-emoji>',
  thunder:  '<tg-emoji emoji-id="5456140674028019486">⚡️</tg-emoji>',
  drop:     '<tg-emoji emoji-id="5393512611968995988">💧</tg-emoji>',
  rainbow:  '<tg-emoji emoji-id="5409109841538994759">🌈</tg-emoji>',
  calendar: '<tg-emoji emoji-id="5413879192267805083">🗓</tg-emoji>',
  pin:      '<tg-emoji emoji-id="5391032818111363540">📍</tg-emoji>',
  exchange: '<tg-emoji emoji-id="5402186569006210455">💱</tg-emoji>',
  dollar:   '<tg-emoji emoji-id="5409048419211682843">💵</tg-emoji>',
  euroSt:   '<tg-emoji emoji-id="5233326571099534068">💸</tg-emoji>',
  yuanSt:   '<tg-emoji emoji-id="5278751923338490157">💸</tg-emoji>',
  up:       '<tg-emoji emoji-id="5244837092042750681">📈</tg-emoji>',
  down:     '<tg-emoji emoji-id="5246762912428603768">📉</tg-emoji>',
  star:     '<tg-emoji emoji-id="5438496463044752972">⭐️</tg-emoji>',
  bulb:     '<tg-emoji emoji-id="5422439311196834318">💡</tg-emoji>',
  fire:     '<tg-emoji emoji-id="5424972470023104089">🔥</tg-emoji>',
};

const WEATHER_CE = {
  '01': CE.sun, '02': CE.sun,
  '09': CE.rain, '10': CE.rain,
  '11': CE.thunder,
  '13': CE.snow,
  '50': CE.drop,
};

// ─── Цитаты дня ──────────────────────────────────────────────────────────────
const QUOTES = [
  'Каждый день — это новая возможность стать лучше.',
  'Делай сегодня то, что другие не хотят, — завтра будешь жить так, как другие не могут.',
  'Успех — это сумма маленьких усилий, повторяемых изо дня в день.',
  'Жизнь — это то, что происходит, пока ты строишь другие планы.',
  'Единственный способ делать великую работу — любить то, что делаешь.',
  'Не жди подходящего момента — создавай его.',
  'Маленький шаг каждый день приводит к большим результатам.',
  'Сложности делают нас сильнее, если мы не позволяем им нас сломать.',
  'Сегодняшний день — это подарок. Именно поэтому он называется настоящим.',
  'Верь в себя и своё дело — всё остальное приложится.',
  'Хороший день начинается с хорошего настроения.',
  'Каждое утро — это шанс начать заново.',
  'Мечтай. Делай. Достигай.',
  'Твоя единственная конкуренция — вчерашняя версия тебя.',
  'Энергия следует за вниманием. Фокусируйся на хорошем.',
];

// ─── Советы по погоде ────────────────────────────────────────────────────────
function getWeatherAdvice(iconCode, temp) {
  if (iconCode === '11') return '⚡️ Гроза — лучше остаться дома';
  if (iconCode === '09' || iconCode === '10') return '☂️ Возьми зонт';
  if (iconCode === '13') return '🧤 Тепло одевайся — идёт снег';
  if (temp !== null && temp < -15) return '🧥 Очень холодно — одевайся теплее';
  if (temp !== null && temp < 0)  return '🧣 Мороз — не забудь шарф';
  if (temp !== null && temp > 28) return '🌊 Жара — пей больше воды';
  return null;
}

// ─── Определение типа погоды для GIF ────────────────────────────────────────
function getWeatherCondition(iconCode) {
  // iconCode формат: '01d', '09n', '11d' и т.д.
  if (!iconCode) return 'clear';

  const code = iconCode.substring(0, 2);

  // Карта OWM icon codes -> weather condition
  const weatherMap = {
    '01': 'clear',      // ясно
    '02': 'clear',      // малооблачно
    '03': 'clouds',     // облачно
    '04': 'clouds',     // пасмурно
    '09': 'rain',       // ливень
    '10': 'rain',       // дождь
    '11': 'thunderstorm', // гроза
    '13': 'snow',       // снег
    '50': 'mist'        // туман/дымка
  };

  return weatherMap[code] || 'clouds';
}

// ─── Вспомогательные функции ─────────────────────────────────────────────────
function formatDate(date) {
  const DAYS   = ['Воскресенье','Понедельник','Вторник','Среда','Четверг','Пятница','Суббота'];
  const MONTHS = ['января','февраля','марта','апреля','мая','июня',
                  'июля','августа','сентября','октября','ноября','декабря'];
  return DAYS[date.getDay()] + ', ' + date.getDate() + ' ' + MONTHS[date.getMonth()] + ' ' + date.getFullYear();
}

function formatTime(unixTs, offsetSec) {
  // unixTs — UTC секунды, offsetSec — смещение timezone из OWM
  const d = new Date((unixTs + offsetSec) * 1000);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return h + ':' + m;
}

function quoteOfDay(date) {
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  return QUOTES[dayOfYear % QUOTES.length];
}

function formatNumber(n) {
  return n.toLocaleString('ru-RU');
}

// ─── Строители секций ────────────────────────────────────────────────────────
function buildWeatherText(data) {
  if (!data) return null;

  const temp      = Math.round(data.temperature);
  const feels     = Math.round(data.feelsLike);
  const tempStr   = (temp >= 0 ? '+' : '') + temp + '°C';
  const feelsStr  = (feels >= 0 ? '+' : '') + feels + '°C';

  const weatherEmoji = WEATHER_CE[data.iconCode] || CE.rain;

  let precipStr;
  if (data.snow > 0)      precipStr = 'снег ' + data.snow.toFixed(1) + ' мм/ч';
  else if (data.rain > 0) precipStr = 'дождь ' + data.rain.toFixed(1) + ' мм/ч';
  else                     precipStr = 'нет';

  const lines = [
    CE.pin + ' <b>Москва</b>',
    tempStr + ' (ощущается ' + feelsStr + '), ' + weatherEmoji + ' ' + data.description,
    CE.drop + ' Осадки: ' + precipStr + '  •  💨 ' + data.windSpeed + ' м/с  •  💦 ' + data.humidity + '%',
  ];

  if (data.sunrise && data.sunset) {
    // OWM timezone offset в секундах
    const sunriseStr = formatTime(data.sunrise, 3 * 3600); // MSK = UTC+3
    const sunsetStr  = formatTime(data.sunset,  3 * 3600);
    lines.push('🌅 ' + sunriseStr + '  •  🌇 ' + sunsetStr);
  }

  const advice = getWeatherAdvice(data.iconCode, data.temperature);
  if (advice) lines.push(advice);

  return lines.join('\n');
}

function formatCurrencyLine(ceEmoji, label, rate, change) {
  const rateLine = ceEmoji + ' <b>' + label + ':</b>  ' + rate.toFixed(2) + ' ₽';
  if (!change || change.rubles === 0) return rateLine;

  const arrow = change.rubles >= 0 ? CE.up : CE.down;
  const sign  = change.rubles >= 0 ? '+' : '';
  return rateLine + '\n' + arrow + ' ' + sign + change.rubles.toFixed(2) + ' ₽ (' + sign + change.percent.toFixed(2) + '%)';
}

function buildCurrencyText(data, btcRub) {
  if (!data) return null;

  const ch  = data.changes;
  const usd = formatCurrencyLine(CE.dollar, 'USD', data.today.USDRUB, ch && ch.USD);
  const eur = formatCurrencyLine(CE.euroSt, 'EUR', data.today.EURRUB, ch && ch.EUR);
  const cny = formatCurrencyLine(CE.yuanSt, 'CNY', data.today.CNYRUB, ch && ch.CNY);
  const btc = btcRub ? CE.fire + ' <b>BTC:</b>  ' + formatNumber(btcRub) + ' ₽' : null;

  const lines = [CE.exchange + ' <b>Курсы валют</b>', '', usd, '', eur, '', cny];
  if (btc) lines.push('', btc);

  return lines.join('\n');
}

// ─── Основная задача ─────────────────────────────────────────────────────────
async function runDailyJob() {
  try {
    const alreadySent = process.env.SKIP_DEDUP !== 'true'
      ? await dedup.wasAlreadySentToday()
      : false;

    if (alreadySent) {
      logger.info('Already sent today, skipping');
      return;
    }

    const [currencyResult, weatherResult] = await Promise.allSettled([
      currencyService.getCurrencyData(),
      weatherService.getWeatherData(),
    ]);

    const currencyData = currencyResult.status === 'fulfilled' ? currencyResult.value : null;
    const weatherData  = weatherResult.status  === 'fulfilled' ? weatherResult.value  : null;

    const now    = new Date();
    const SEP    = '━━━━━━━━━━━━━━━━━━';
    const header = CE.sun + ' <b>Доброе утро!</b>  ' + CE.calendar + ' ' + formatDate(now);
    const footer = CE.star + ' Хорошего дня!';

    const weatherText  = buildWeatherText(weatherData);
    const currencyText = buildCurrencyText(currencyData, null);

    const sections = [header, SEP];
    if (weatherText)  { sections.push(weatherText);  sections.push(SEP); }
    if (currencyText) { sections.push(currencyText);  sections.push(SEP); }
    sections.push(footer);

    const text = sections.join('\n\n');

    logger.info('Sending morning message to ' + config.recipients.length + ' recipients');

    // Отправляем GIF с текстом (если GIF доступна) или просто текст
    if (klipyService && weatherData && weatherData.iconCode) {
      try {
        const weatherCondition = getWeatherCondition(weatherData.iconCode);
        logger.info('Getting weather GIF for condition: ' + weatherCondition);

        const gifUrl = await klipyService.getWeatherGif(weatherCondition);

        if (gifUrl) {
          logger.info('Sending weather GIF with caption to recipients');
          // Отправляем GIF с текстом в caption (одно сообщение)
          await telegramService.broadcastAnimation(config.recipients, gifUrl, text);
        } else {
          logger.warn('No GIF found, sending text only');
          await telegramService.broadcastMessage(config.recipients, text);
        }
      } catch (gifError) {
        logger.error('Failed to send weather GIF: ' + gifError.message);
        // Отправляем просто текст если GIF не удалось получить
        await telegramService.broadcastMessage(config.recipients, text);
      }
    } else {
      // Если Klipy не настроен - отправляем просто текст
      await telegramService.broadcastMessage(config.recipients, text);
    }

    // Yandex Cloud Functions имеет read-only ФС, пропускаем запись файлов
    if (process.env.SKIP_DEDUP !== 'true') {
      await dedup.markSentToday();
      if (currencyData) await rates.saveRates(currencyData.today);
    }

    logger.info('Morning message sent and recorded');
  } catch (err) {
    logger.error('Daily job failed: ' + err.message);
    throw err;
  }
}

module.exports = { runDailyJob };
