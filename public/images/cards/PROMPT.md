# Промпт для генерации спрайта карточек (1104×832)

Размер под ограничения генераторов: **1104×832 px**. Можно сгенерировать **одну** картинку (все 11 карточек) или **две** (по 6 и 5 карточек в едином стиле).

**Обязательно для всех вариантов:**
- **Ориентация карточек:** каждая карточка **горизонтальная** (альбомная: шире, чем высота).
- **Размер карточек:** внутри одной картины **все карточки одинакового размера** — одна и та же ширина и высота ячейки, без зазоров между ячейками.

После генерации сохраните файл(ы) в `public/images/cards/` и выполните `npm run slice-cards` (один или два файла — скрипт поддерживает оба варианта).

---

## Вариант 1: одна картинка 1104×832

- **Размер:** 1104×832 px.
- **Сетка:** 4 колонки × 3 ряда, **без зазоров**. Карточки: 4 + 4 + 3 (последняя ячейка третьего ряда пустая).
- **Размер одной карточки:** ~276×277 px (единый для всех ячеек).
- **Ориентация:** каждая карточка горизонтальная.

### Промпт 1 — одна картинка (русский)

```
Одна картинка 1104×832 пикселей: сетка из 11 карточек настольной игры в едином стиле. Стиль: классические карточки Монополии, тёплые тона, аккуратная рамка у каждой карточки, без зазоров между ячейками. Порядок слева направо, сверху вниз:

1. GO — яркая карточка «Старт», стрелка вперёд, текст «GO».
2. Street — улица города, карточка собственности (дом/улица).
3. Chance — знак вопроса, карточка «Шанс».
4. Community Chest — сундук с сокровищами, текст «Community Chest».
5. Tax — знак доллара, налог.
6. Railroad — железная дорога, поезд или рельсы.
7. Jail — тюрьма, решётка, текст «В тюрьме».
8. Utility — лампочка и капля воды (коммунальные услуги).
9. Free Parking — парковка, текст «Бесплатная парковка».
10. Go to Jail — стрелка в тюрьму, текст «Прямо в тюрьму».
11. Default — нейтральная карточка с вопросительным знаком.

Всего 11 карточек: первый ряд 4, второй ряд 4, третий ряд 3. Единая цветовая гамма и рамки. Реалистичные иллюстрации или качественная цифровая графика.
```

### Промпт 1 — одна картинка (English)

```
Single image 1104×832 pixels: grid of 11 board game cards in one consistent style. All cards horizontal (landscape orientation) and the same size within the image — strict grid with no gaps, equal width and height for each cell. Style: classic Monopoly-style cards, warm colors, neat border on each card. Order left to right, top to bottom: GO, Street, Chance, Community Chest, Tax, Railroad, Jail, Utility, Free Parking, Go to Jail, Default (11 cards: 4 in first row, 4 in second row, 3 in third row). Uniform card size, unified color palette and borders. Realistic illustrations or high-quality digital art.
```

---

## Вариант 2: две картинки по 1104×832

Удобно, если генератор лучше справляется с 6 и 5 карточками отдельно. Стиль и рамки должны совпадать — используйте один и тот же текст стиля в обоих промптах.

- **Размер каждой:** 1104×832 px.
- **Сетка в каждой:** 3 колонки × 2 ряда, без зазоров.
- **Размер одной карточки:** 368×416 px (единый для всех ячеек в каждой картине).
- **Ориентация:** каждая карточка горизонтальная.
- **Файлы:** сохранить как `cards-sprite-1.jpg` и `cards-sprite-2.jpg`.

### Картинка 1 (6 карточек): GO, Street, Chance, Community Chest, Tax, Railroad

**Промпт 2а — русский**

```
Картинка 1104×832 пикселей: сетка 3 колонки × 2 ряда, 6 карточек настольной игры в едином стиле. Стиль: классические карточки Монополии, тёплые тона, аккуратная рамка у каждой карточки, без зазоров между ячейками. Порядок слева направо, сверху вниз:

1. GO — яркая карточка «Старт», стрелка вперёд, текст «GO».
2. Street — улица города, карточка собственности (дом/улица).
3. Chance — знак вопроса, карточка «Шанс».
4. Community Chest — сундук с сокровищами, текст «Community Chest».
5. Tax — знак доллара, налог.
6. Railroad — железная дорога, поезд или рельсы.

Единая цветовая гамма и рамки. Реалистичные иллюстрации или качественная цифровая графика.
```

**Промпт 2а — English**

```
Image 1104×832 pixels: grid 3 columns × 2 rows, 6 board game cards in one consistent style. All cards horizontal and the same size within the image — strict grid with no gaps, equal width and height for each cell. Style: classic Monopoly-style cards, warm colors, neat border on each card. Order left to right, top to bottom: GO (bright Start card, arrow, text GO), Street (city street, property), Chance (question mark), Community Chest (treasure chest), Tax (dollar sign), Railroad (train or tracks). Uniform card size, unified color palette and borders. Realistic illustrations or high-quality digital art.
```

### Картинка 2 (5 карточек): Jail, Utility, Free Parking, Go to Jail, Default

**Промпт 2б — русский**

```
Картинка 1104×832 пикселей: сетка 3 колонки × 2 ряда, только первые 5 ячеек заполнены карточками (шестая ячейка справа внизу пустая). Стиль тот же: классические карточки Монополии, тёплые тона, аккуратная рамка, без зазоров между ячейками. Порядок слева направо, сверху вниз:

1. Jail — тюрьма, решётка, текст «В тюрьме».
2. Utility — лампочка и капля воды (коммунальные услуги).
3. Free Parking — парковка, текст «Бесплатная парковка».
4. Go to Jail — стрелка в тюрьму, текст «Прямо в тюрьму».
5. Default — нейтральная карточка с вопросительным знаком.
6. Пустая ячейка (того же фона, без карточки).

Единая цветовая гамма и рамки, как у первой картинки с карточками GO–Railroad. Реалистичные иллюстрации или качественная цифровая графика.
```

**Промпт 2б — English**

```
Image 1104×832 pixels: grid 3 columns × 2 rows, only first 5 cells filled with cards (6th cell bottom-right empty). All cards horizontal and the same size as in the first image — strict grid with no gaps, equal cell width and height. Same style: classic Monopoly-style cards, warm colors, neat border. Order: Jail (bars, In Jail), Utility (light bulb and water drop), Free Parking, Go to Jail (arrow to jail), Default (question mark), then one empty cell. Uniform card size, same color palette and borders as the first 6-cards image. Realistic illustrations or high-quality digital art.
```

---

## После генерации

**Один файл:**
1. Сохраните как `cards-sprite.jpg` в `public/images/cards/`.
2. Выполните: `npm run slice-cards`.

**Два файла:**
1. Сохраните как `cards-sprite-1.jpg` и `cards-sprite-2.jpg` в `public/images/cards/`.
2. Выполните: `npm run slice-cards` (скрипт сам найдёт оба файла) или явно: `node scripts/slice-cards-sprite.js public/images/cards/cards-sprite-1.jpg public/images/cards/cards-sprite-2.jpg`.

В папке `public/images/cards/` появятся 11 файлов: `go.png`, `street.png`, … `default.png`.
