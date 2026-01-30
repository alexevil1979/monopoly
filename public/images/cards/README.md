# Карточки клеток

Изображения по типу клетки: `go.png`, `street.png`, `chance.png`, `community_chest.svg`, `tax.png`, `railroad.png`, `jail.png`, `utility.png`, `free_parking.png`, `go_to_jail.png`, `default.png`.

Клиент использует `/images/cards/{type}.png` (для темы luxury — `{type}-luxury.jpg` для street, chance, community_chest).

**Единая партия карточек:** из корня проекта выполните:
```bash
npm run generate-cards
```
Скрипт `scripts/generate-cards.js` перегенерирует все PNG в одном стиле (золотая рамка, цветная полоска сверху, фон по типу).
