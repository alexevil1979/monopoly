# Фото для карточек, фона, стола и оформления

В игре используются **локальные** изображения. По умолчанию подставляются SVG-фоны и текстуры из папок `themes/`, `table/`, `cards/`, `decoration/`. Чтобы использовать **реальные фотографии**, их нужно скачать и положить в те же папки с указанными именами.

## 1. Автоматическая загрузка (если сервис доступен)

```bash
npm run download-images
```

Скрипт пытается скачать бесплатные фото с [Lorem Picsum](https://picsum.photos/) (free to use). Если получаете 403 — используйте ручную загрузку ниже.

## 2. Ручная загрузка

Скачайте изображения с бесплатных стоков (Unsplash, Pexels, Pixabay) и сохраните в проект с **точными именами** и расширением **.jpg** (или .png, тогда в `themes.css` и в `client.js` замените `.jpg` на `.png`).

### Темы фона (`public/images/themes/`)

| Файл | Назначение | Рекомендация поиска |
|------|------------|---------------------|
| `america50.jpg` | Америка 50-х, ретро зал | "retro diner", "1950s interior" |
| `classic.jpg` | Классическая зелёная комната | "dark green room", "board game room" |
| `artdeco.jpg` | Ар-деко, золото/чёрный | "art deco interior", "gold black room" |
| `scandinavian.jpg` | Скандинавский светлый интерьер | "scandinavian interior", "bright minimal room" |
| `wood.jpg` | Деревянный стол/интерьер | "wooden table", "wood texture" |
| `neon.jpg` | Тёмный неоновый фон | "neon city", "dark neon background" |

### Стол (`public/images/table/`)

| Файл | Назначение |
|------|------------|
| `surface.jpg` | Текстура стола под доской (дерево или сукно), желательно квадрат 1200×1200 |

### Карточки (`public/images/cards/`)

| Файл | Назначение |
|------|------------|
| `go.jpg`, `street.jpg`, `chance.jpg`, `community_chest.jpg`, `tax.jpg`, `railroad.jpg`, `jail.jpg`, `utility.jpg`, `free_parking.jpg`, `go_to_jail.jpg`, `default.jpg` | Иллюстрации для модалок клеток (рекомендуемый размер около 600×600) |

### Декор (`public/images/decoration/`)

| Файл | Назначение |
|------|------------|
| `frame.jpg`, `corner.jpg` | Рамки или угловые орнаменты (по желанию) |

## 3. Где искать бесплатные фото

- **Unsplash**: https://unsplash.com (бесплатно, с указанием автора в описании)
- **Pexels**: https://www.pexels.com
- **Pixabay**: https://pixabay.com

После сохранения файлов (.jpg) в нужные папки интерфейс автоматически подхватит их: в CSS уже задан приоритет `.jpg`, при отсутствии используется fallback на `.svg`.
