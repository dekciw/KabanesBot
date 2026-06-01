'use strict';

const axios = require('axios');
const logger = require('../utils/logger');

// OpenWeatherMap free Current Weather API — описания на русском, без подписки
const OWM_URL = 'https://api.openweathermap.org/data/2.5/weather';
const MOSCOW_LAT = 55.75;
const MOSCOW_LON = 37.62;

// icon code (первые 2 символа) → emoji
const ICON_EMOJI = {
  '01': '☀️',  // ясно
  '02': '🌤',  // малооблачно
  '03': '⛅',  // облачно
  '04': '☁️',  // пасмурно
  '09': '🌧',  // ливень
  '10': '🌧',  // дождь
  '11': '⛈',  // гроза
  '13': '🌨',  // снег
  '50': '🌫',  // туман
};

function createWeatherService(apiKey) {
  return {
    async getWeatherData() {
      if (!apiKey) {
        logger.warn('OWM_KEY is not set — skipping weather fetch');
        return null;
      }

      try {
        const response = await axios.get(OWM_URL, {
          params: {
            lat: MOSCOW_LAT,
            lon: MOSCOW_LON,
            appid: apiKey,
            units: 'metric',  // Celsius, m/s
            lang: 'ru',       // описание на русском
          },
          timeout: 5000,
        });

        const d = response.data;

        if (!d || !d.main) {
          logger.error('OWM response invalid: ' + JSON.stringify(d));
          return null;
        }

        const iconCode = d.weather && d.weather[0] ? d.weather[0].icon.slice(0, 2) : '01';
        const emoji = ICON_EMOJI[iconCode] || '🌡';
        const description = d.weather && d.weather[0] ? d.weather[0].description : '';

        // rain/snow за последний час (мм) — если есть
        const rain = (d.rain && d.rain['1h']) ? d.rain['1h'] : 0;
        const snow = (d.snow && d.snow['1h']) ? d.snow['1h'] : 0;

        return {
          temperature: d.main.temp,
          feelsLike: d.main.feels_like,
          description,
          emoji,
          iconCode,
          windSpeed: Math.round(d.wind ? d.wind.speed : 0),
          humidity: d.main.humidity,
          rain,
          snow,
          sunrise: d.sys ? d.sys.sunrise : null, // Unix timestamp
          sunset:  d.sys ? d.sys.sunset  : null,
        };
      } catch (err) {
        if (err.response && err.response.status === 401) {
          logger.warn('OWM key not yet activated (401) — skipping weather');
        } else {
          logger.error('OWM fetch failed: ' + err.message);
        }
        return null;
      }
    },
  };
}

module.exports = { createWeatherService };
