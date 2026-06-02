![Nyan Cat](https://media.giphy.com/media/sIIhZliB2McAo/giphy.gif)

# Morning Weather Bot

Телеграм бот для утренних уведомлений с погодой и курсами валют.

![Bot Screenshot](screenshots/bot-example.png)

Работает на Yandex Cloud Functions, каждый день в 6 утра присылает:
- Погоду в Москве
- Курсы USD, EUR, CNY к рублю  
- Смешную гифку по погоде

## Установка

```bash
npm install
cp .env.example .env
# заполнить .env своими ключами
npm run send-once # тест
```

## Деплой

Создать функцию в Yandex Cloud Functions:
- Runtime: Node.js 18
- Точка входа: `yandex.handler`
- Таймаут: 60 сек
- Триггер: `0 3 * * * *` (6:00 МСК)

Добавить переменные:
- TELEGRAM_BOT_TOKEN
- OWM_KEY
- CURRENCYLAYER_KEY  
- KLIPY_API_KEY (для гифок)

## Стоимость

Бесплатно в рамках Free Tier.

## 🤝 Contributing

Contributions are welcome! Feel free to open issues or PRs.
