'use strict';

const axios = require('axios');

/**
 * Сервис для работы с Klipy GIF API
 */
class KlipyService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://api.klipy.com/v1';
  }

  /**
   * Получить случайную GIF по ключевым словам
   * @param {string} query - Поисковый запрос
   * @returns {Promise<string>} URL гифки
   */
  async getRandomGif(query) {
    try {
      // Klipy API формат: /api/v1/{API_KEY}/gifs/search
      const response = await axios.get(
        `https://api.klipy.com/api/v1/${this.apiKey}/gifs/search`,
        {
          params: {
            q: query,
            per_page: 10,
            page: 1,
            locale: 'us_US',
            rating: 'pg'
          },
          timeout: 10000
        }
      );

      // Klipy API структура: { result: true, data: { data: [...] } }
      const gifs = response.data?.data?.data;

      if (!gifs || gifs.length === 0) {
        return null;
      }

      // Выбираем случайную из результатов
      const randomIndex = Math.floor(Math.random() * gifs.length);
      const gif = gifs[randomIndex];

      // Возвращаем URL для Telegram (через file объект)
      // Пробуем разные размеры: md (средний), hd (большой), sm (маленький)
      const gifUrl = gif.file?.md?.gif?.url ||
                     gif.file?.hd?.gif?.url ||
                     gif.file?.sm?.gif?.url ||
                     null;

      return gifUrl;

    } catch (error) {
      console.error('Klipy API error:', error.message);
      return null;
    }
  }

  /**
   * Получить GIF в зависимости от погоды
   * @param {string} weatherCondition - Состояние погоды (clear/rain/snow/clouds)
   * @returns {Promise<string|null>} URL гифки или null
   */
  async getWeatherGif(weatherCondition) {
    // Смешные популярные GIF в зависимости от погоды
    const weatherQueries = {
      'clear': 'funny sunny day happy celebration good morning',
      'clouds': 'funny cloudy weather chill relaxing vibes',
      'rain': 'funny rain dancing umbrella water splash',
      'drizzle': 'funny light rain cozy romantic mood',
      'snow': 'funny snow winter cold excited playing',
      'thunderstorm': 'funny storm crazy wild thunder dramatic',
      'mist': 'funny fog mysterious spooky halloween ghost',
      'fog': 'funny foggy confused lost searching'
    };

    const query = weatherQueries[weatherCondition.toLowerCase()] || 'funny weather good morning';
    return await this.getRandomGif(query);
  }
}

module.exports = { KlipyService };
