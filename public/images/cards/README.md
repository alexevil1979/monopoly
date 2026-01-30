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
