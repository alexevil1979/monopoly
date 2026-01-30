# Локальные изображения

Все картинки хранятся локально в проекте. В интерфейсе приоритет у **.jpg** (фото), при отсутствии — используется **.svg** (фон/текстура).

## Как добавить реальные фото

- **Автоматически:** `npm run download-images` (скрипт скачивает с Lorem Picsum; при 403 см. ручную загрузку).
- **Вручную:** см. **[PHOTOS.md](PHOTOS.md)** — таблицы имён файлов и ссылки на бесплатные стоки (Unsplash, Pexels, Pixabay).

## Темы фона (themes/)

- `america50`, `classic`, `artdeco`, `scandinavian`, `wood`, `neon`, **`luxury`** — фоны зала (файлы `.jpg` или `.svg`).
- **Luxury** — премиум Art Deco: фон `luxury.jpg`, стол `table/surface-luxury.jpg`, палитра золото/махагон.
- В CSS уже задан приоритет `.jpg`, fallback на `.svg`.

## Карточки клеток (cards/)

- По типу: `go`, `street`, `chance`, `community_chest`, `tax`, `railroad`, `jail`, `utility`, `free_parking`, `go_to_jail`, `default` (расширение `.jpg` или `.svg`).
- В модалке карточки сначала подставляется `.jpg`, при ошибке загрузки — `.svg`.

## Стол (table/)

- `surface.jpg` или `surface.svg` — текстура стола под доской.
- `surface-luxury.jpg` — премиум-текстура для темы **Luxury** (зелёное сукно / махагон).

## Декор (decoration/)

- `frame.svg`, `corner.svg` — рамка и угловой орнамент (опционально). Можно заменить на `.jpg`.
