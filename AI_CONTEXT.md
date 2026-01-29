# AI_CONTEXT.md — контекст для AI

Документ фиксирует **текущее состояние** проекта Monopoly Online и **следующий шаг** разработки.

---

## Текущее состояние (на момент фиксации)

### Backend
- **Node.js + Express** — HTTP, раздача статики из `public/`, `/health`
- **Socket.IO** — реал-тайм: создание/вход в комнату, ready, roll, buy, end_turn, chat, jail, reconnect
- **Redis** (ioredis + @socket.io/redis-adapter) — состояние комнат, масштабирование
- **Игра:** 20 клеток по кругу, улицы/железные дороги/утилиты, Chance/Community Chest, тюрьма, банкротство

### Frontend (public/)
- **index.html** — лобби (создание/вход по коду), **выбор темы зала** (6 тем), экран комнаты, экран игры с круглой доской, модалки, чат. В начале `<body>` — инлайн-скрипт, который сразу выставляет `data-hall-theme` из `localStorage`, чтобы фон темы применялся до загрузки client.js (важно для подключившегося игрока).
- **css/main.css** — переменные, круглая доска, панель игроков, HUD, модалки, чат; при игре (`body.in-game`) экраны лобби/комнаты и лог событий скрыты (`display: none !important`).
- **css/themes.css** — 6 тем зала: **America 50s** (по умолчанию), Classic Monopoly, Art Deco, Scandinavian, Wood, Neon. Для каждой темы заданы цвета, шрифты, `--theme-bg-image` (локальные `/images/themes/<theme>.svg` или `.jpg` при наличии), оверлей, тени карточек/стола.
- **css/atmosphere.css** — погружение: фон body из `--theme-bg-image`, оверлей и виньетка; лобби, доска, клетки, модалки, HUD, чат оформлены как «карточки на столе» (бумага, тени, рамки); под круглой доской — текстура стола `url(/images/table/surface.svg)` (или `.jpg`).
- **css/animations.css** — shake, bounce, fade, slide, dice, confetti.
- **js/client.js** — Socket.IO, тема зала из/в `localStorage` (`monopolyHallTheme`), рендер доски/игроков, модалки. В модалке свойства: крупное изображение карточки (`getCardImageUrl(cell)` — приоритет `.jpg`, fallback `.svg`), описание клетки, цена/рента/действия.
- **js/utils.js** — утилиты (деньги, анимации, модалки, лог событий).

### Изображения (все локально в public/images/)
- **themes/** — фоны зала: `america50.svg`, `classic.svg`, `artdeco.svg`, `scandinavian.svg`, `wood.svg`, `neon.svg` (можно заменить/добавить `.jpg`; в themes.css задан приоритет `.jpg`, fallback `.svg`).
- **table/surface.svg** — текстура стола под доской (дерево/зерно).
- **cards/** — иллюстрации для модалок клеток: `go.svg`, `street.svg`, `chance.svg`, `community_chest.svg`, `tax.svg`, `railroad.svg`, `jail.svg`, `utility.svg`, `free_parking.svg`, `go_to_jail.svg`, `default.svg` (в client.js приоритет `.jpg`, fallback `.svg`).
- **decoration/** — `frame.svg`, `corner.svg` (опционально).
- **README.md**, **PHOTOS.md** — описание структуры; PHOTOS.md — как вручную подставить реальные фото (таблицы имён, ссылки на стоки). Скрипт `npm run download-images` (scripts/download-images.js) при возможности скачивает фото с Lorem Picsum (часто 403 при запросах не из браузера).

### Git и правила
- Репозиторий: **https://github.com/alexevil1979/monopoly.git**, ветка **main**.
- Правило: **.cursor/rules/git-publish.mdc** — после изменений выполнять `git add -A`, `git commit`, `git push` в этот репозиторий.

### Что уже сделано по UI
- Круглая доска, карточки клеток с цветной полосой, фишки игроков, аватары, список владений.
- HUD с кубиками и кнопками (Roll, Buy, End turn, Jail).
- Модалки: свойство (крупная карточка, описание, цена/действия), Chance/Community Chest (flip), банкротство, победа.
- Чат справа внизу (сворачиваемый), лог событий скрыт во время игры; форма авторизации/лобби не показывается на экране игры.
- Оформление зала по умолчанию **America 50s**; 6 тем на выбор, выбор сохраняется в `localStorage`; фон и стол/карточки применяются единообразно (в т.ч. у подключившегося игрока за счёт раннего применения темы в index.html).

---

## Следующий шаг

1. **По желанию:** звуки (бросок кубиков, покупка, победа) — бесплатные .mp3 в `public/sounds/` и вызов из client.js.
2. **По желанию:** заменить SVG на реальные фото — положить .jpg в `images/themes/`, `images/table/`, `images/cards/` по именам из PHOTOS.md или запустить `npm run download-images` при доступности сервиса.
3. **Обязательно после любых изменений:** `git add -A`, `git commit -m "..."`, `git push origin main` в **https://github.com/alexevil1979/monopoly.git**.

---

## Краткая памятка для AI

- **Сейчас:** Игра работает; UI с 6 темами зала (America 50s по умолчанию), локальные фоны/стол/карточки (SVG, опционально JPG); модалки с крупной карточкой и описанием; лобби и лог событий скрыты в игре; тема применяется сразу для корректного фона у подключившегося игрока.
- **Дальше:** По желанию — звуки, реальные фото вместо SVG; всегда — публикация изменений в указанный GitHub-репозиторий.
