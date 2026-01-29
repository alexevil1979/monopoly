# Карточки клеток

Положите сюда изображения карточек (JPG/PNG/SVG) с именами:
- `0.svg` — Go
- `1.svg` — Mediterranean Ave
- `2.svg` — Community Chest
- … по индексу клетки (0–19).

Либо по типу (используется, если нет файла по индексу):
- `go.svg`, `street.svg`, `chance.svg`, `community_chest.svg`, `tax.svg`, `railroad.svg`, `jail.svg`, `utility.svg`, `free_parking.svg`, `go_to_jail.svg`

Клиент подставляет первый найденный: `/images/cards/{index}.svg`, затем `/images/cards/{type}.svg`.
