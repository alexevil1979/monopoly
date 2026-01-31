# Monopoly Online

Упрощённая **онлайн-мультиплеер Монополия** (Monopoly-like) для 2–4 игроков в одной комнате. Учебный проект: Node.js + Socket.IO + Redis + Docker + PM2.

## Игра

- **Доска:** 20 клеток (круговая).
- **Клетки:** 12 улиц (4 цвета по 3), 2 коммуналки, 2 железные дороги, Go, Jail, Free Parking, Go to Jail, Chance (2), Community Chest (2), Tax (2).
- **Стартовый капитал:** $1500.
- **Ход:** бросок 2d6 → движение → действие на клетке:
  - Улица без владельца → купить или пропустить.
  - Своя улица → ничего.
  - Чужая улица → рента (базовая: цена/10).
  - Chance / Community Chest → случайная карта (Advance to Go, +$200, -$100, Go to Jail и т.д.).
  - Tax → заплатить $100–200.
  - Jail: пропустить 3 хода или заплатить $50.
  - Doubles → повторный ход; 3 doubles подряд → в Jail.
- **Победа:** последний оставшийся в игре (банкротство при деньгах &lt; 0).
- **Комнаты:** создание по коду, вход по коду, старт при ≥2 игроках и все ready.

## Технологии

- **Node.js** (ES modules) + **Express** (HTTP, lobby, `/health`)
- **Socket.IO** — реал-тайм: ходы, состояние комнаты, чат, disconnect/reconnect
- **Redis** (ioredis + @socket.io/redis-adapter):
  - Адаптер Socket.IO для масштабирования на несколько инстансов
  - Хранение состояния комнат (JSON в ключ-значение)
- **Docker** + **docker-compose** (Node + Redis)
- **PM2** — запуск и управление процессом
- **Клиент:** vanilla HTML + JS + socket.io-client (одна страница, DOM-доска, кнопки Roll / Buy / End turn)

## Структура проекта

```
monopoly/
├── src/
│   ├── index.js           # entry point, Express + Socket.IO, graceful shutdown
│   ├── game/
│   │   ├── Board.js       # 20 клеток, типы, рента
│   │   ├── Player.js      # модель игрока
│   │   ├── GameRoom.js    # логика комнаты, ходы, Redis persist
│   │   └── cards.js       # Chance & Community Chest
│   ├── sockets/
│   │   └── gameSocket.js   # обработчики Socket.IO
│   └── utils/
│       └── redisClient.js # Redis client, save/load room state
├── public/
│   ├── index.html
│   └── client.js
├── docker-compose.yml
├── Dockerfile
├── ecosystem.config.js
├── .env.example
└── README.md
```

## Применение изменений и локальный запуск

После обновления кода (например, `git pull` или правки в репозитории):

1. **Установить/обновить зависимости** (если менялись `package.json` или впервые клонируете):
   ```bash
   npm install
   ```
2. **Переменные окружения** (при первом запуске или если добавлен новый `.env.example`):
   ```bash
   cp .env.example .env
   ```
   В `.env` указать `REDIS_URL=redis://localhost:6379` при локальном Redis.
3. **Запустить приложение** — один из вариантов ниже.
4. **Открыть в браузере:** [http://localhost:3000](http://localhost:3000).

**Тестовая страница доски** (без создания комнаты и сервера): [http://localhost:3000/test-board.html](http://localhost:3000/test-board.html) — сразу виден овал доски и все темы оформления.

**Макет для Figma** (1440×900): [http://localhost:3000/figma-mockup.html](http://localhost:3000/figma-mockup.html) — полный экран игры (стол, карты, панель игроков, HUD, чат). Откройте в браузере и сделайте скриншот области макета или используйте плагин Figma для импорта.

## Локальный запуск

### Вариант 1: без Docker

1. Установить Node.js 18+ и Redis.
2. Выполнить шаги из раздела «Применение изменений и локальный запуск» выше.
3. Запуск:
   ```bash
   npm start
   ```
4. Открыть в браузере: `http://localhost:3000`.

### Вариант 2: Docker

```bash
docker-compose up -d
```

Приложение: `http://localhost:3000`, Redis: порт 6379.

## Запуск через PM2

```bash
npm install
mkdir -p logs
cp .env.example .env
# Отредактировать .env (REDIS_URL и т.д.)
pm2 start ecosystem.config.js
pm2 logs monopoly-online
```

Продакшен-режим:

```bash
pm2 start ecosystem.config.js --env production
```

## Деплой на VPS (Ubuntu 22.04+)

1. **Подготовка сервера:**
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y git docker.io docker-compose-plugin certbot python3-certbot-nginx nginx
   sudo systemctl enable nginx docker
   ```

2. **Клонирование и запуск:**
   ```bash
   cd /opt
   sudo git clone <your-repo-url> monopoly-online
   cd monopoly-online
   cp .env.example .env
   # В .env: PORT=3000, REDIS_URL=redis://127.0.0.1:6379
   sudo docker compose up -d
   ```

3. **Nginx reverse proxy + SSL (Certbot):**
   - Создать виртуальный хост, например `/etc/nginx/sites-available/monopoly`:
     ```nginx
     server {
         listen 80;
         server_name your-domain.com;
         location / {
             proxy_pass http://127.0.0.1:3000;
             proxy_http_version 1.1;
             proxy_set_header Upgrade $http_upgrade;
             proxy_set_header Connection "upgrade";
             proxy_set_header Host $host;
             proxy_set_header X-Real-IP $remote_addr;
         }
     }
     ```
   - Включить сайт и получить сертификат:
     ```bash
     sudo ln -s /etc/nginx/sites-available/monopoly /etc/nginx/sites-enabled/
     sudo nginx -t && sudo systemctl reload nginx
     sudo certbot --nginx -d your-domain.com
     ```

4. **Альтернатива без Docker (Node + Redis + PM2):**
   ```bash
   sudo apt install -y nodejs npm redis-server
   cd /opt/monopoly-online
   npm ci
   mkdir -p logs
   pm2 start ecosystem.config.js --env production
   pm2 save && pm2 startup
   ```
   Redis по умолчанию на `127.0.0.1:6379`.

## Тестирование

1. Запустить приложение (локально или Docker).
2. Открыть в браузере `http://localhost:3000` (или ваш домен).
3. Ввести имя, нажать **Create room** — появится код комнаты.
4. Открыть 2–4 вкладки (или разные браузеры/устройства), в каждой ввести тот же код и нажать **Join room**.
5. Во всех вкладках нажать **I'm ready**. Игра стартует, когда все готовы и игроков ≥2.
6. По очереди: **Roll dice** → при необходимости **Buy** или **Skip** → **End turn**. В тюрьме — **Pay $50** или **Wait**.
7. Проверить чат, отключение/переподключение (вкладку закрыть и снова зайти по коду — sync state при reconnect).

## Переменные окружения

| Переменная   | Описание                    | Пример                |
|-------------|-----------------------------|------------------------|
| `PORT`      | Порт HTTP-сервера           | `3000`                 |
| `REDIS_URL` | URL Redis                   | `redis://localhost:6379` |
| `NODE_ENV`  | Окружение                   | `development` / `production` |
| `LOG_LEVEL` | Уровень логов (опционально) | `info`                 |

## Безопасность и надёжность

- **Сервер-авторитет:** все ходы (roll, buy, end_turn, jail) проверяются на сервере в `GameRoom.js`.
- Валидация кода комнаты и текущего игрока перед действиями.
- **Reconnect:** Socket.IO auto-reconnect; клиент при `connect` может отправить `sync_state` для получения актуального состояния комнаты (если хранит `state.code` в памяти/сессии).
- **Graceful shutdown:** по SIGTERM/SIGINT сервер закрывает HTTP и Redis.

## Скриншоты

- **Где взять:** после запуска откройте `http://localhost:3000`, создайте комнату и сделайте скриншоты экранов: Lobby (код комнаты, список игроков, кнопка Ready), Игра (доска, кнопки Roll/Buy/End turn, чат). Можно использовать встроенные средства ОС (Win+Shift+S, Print Screen) или расширения браузера.

## Возможные улучшения

- Дома и отели (увеличение ренты).
- Торговля между игроками.
- Полноценный аукцион при отказе от покупки.
- Таймер хода (авто-skip при бездействии).
- Лидерборд (топ игроков по победам).
- Авторизация (логин/токен) и постоянные ники.
- Уведомления (звук, браузерные push) при своём ходе.

## Лицензия

MIT.
