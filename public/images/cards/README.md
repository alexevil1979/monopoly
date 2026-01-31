# Карточки клеток

Используются PNG по типу: `go.png`, `street.png`, `chance.png`, `community_chest.png`, `tax.png`, `railroad.png`, `jail.png`, `utility.png`, `free_parking.png`, `go_to_jail.png`, `default.png`. Клиент подставляет `/images/cards/{type}.png` (для темы luxury — `{type}-luxury.jpg` для street, chance, community_chest).

**Полноценные фото-картинки:**

1. Скачать фото из интернета и добавить рамку:
   ```bash
   npm run download-images
   npm run generate-cards
   ```
   `download-images` сохраняет фото в `cards/*.jpg`, `generate-cards` добавляет золотую рамку и создаёт `*.png`.

2. Свои фото: положите файлы `go.jpg`, `street.jpg`, … в папку `pics/cards/` и выполните:
   ```bash
   npm run generate-cards
   ```

3. Без своих файлов и без сети скрипт использует фото-подобную текстуру (градиент + шум). С сетью пробует picsum.photos.

**Один спрайт в едином стиле (нарезка):**

Создайте одну большую картинку со всеми карточками в сетке 4×3 (без зазоров), например 2400×1800 (карточки 600×600) или 1920×1440 (480×480). Порядок слева направо, сверху вниз: GO, Street, Chance, Community Chest, Tax, Railroad, Jail, Utility, Free Parking, Go to Jail, Default. Сохраните как `cards-sprite.jpg` в `public/images/cards/` и выполните:

```bash
npm run slice-cards
```

Скрипт нарежет спрайт на 11 PNG и перезапишет файлы в этой же папке.
