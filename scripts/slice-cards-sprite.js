/**
 * Нарезка одного большого спрайта карточек на отдельные PNG.
 * Спрайт: сетка 4×3, порядок слева направо, сверху вниз.
 *
 * Использование:
 *   node scripts/slice-cards-sprite.js [путь/к/спрайту.jpg]
 *
 * По умолчанию: public/images/cards/cards-sprite.jpg
 * Ожидаемый размер спрайта: 2400×1800 (карточки 600×600) или 1920×1440 (480×480).
 * Без отступов и зазоров между ячейками.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CARDS_DIR = path.join(ROOT, 'public', 'images', 'cards');

const CARD_NAMES = [
  'go',
  'street',
  'chance',
  'community_chest',
  'tax',
  'railroad',
  'jail',
  'utility',
  'free_parking',
  'go_to_jail',
  'default',
];

const COLS = 4;
const ROWS = 3;

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Требуется sharp: npm install sharp');
    process.exit(1);
  }

  const inputPath =
    process.argv[2] || path.join(CARDS_DIR, 'cards-sprite.jpg');
  if (!fs.existsSync(inputPath)) {
    console.error('Спрайт не найден:', inputPath);
    console.error('Положите изображение в public/images/cards/cards-sprite.jpg или укажите путь аргументом.');
    process.exit(1);
  }

  const meta = await sharp(inputPath).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (!w || !h) {
    console.error('Не удалось прочитать размеры изображения');
    process.exit(1);
  }

  const tileW = Math.floor(w / COLS);
  const tileH = Math.floor(h / ROWS);
  if (tileW < 100 || tileH < 100) {
    console.error('Слишком маленький спрайт. Ожидается минимум 400×300 (карточки 100×100).');
    process.exit(1);
  }

  fs.mkdirSync(CARDS_DIR, { recursive: true });

  console.log(`Спрайт: ${w}×${h}, тайл: ${tileW}×${tileH}, сетка ${COLS}×${ROWS}`);
  for (let i = 0; i < CARD_NAMES.length; i++) {
    const name = CARD_NAMES[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const left = col * tileW;
    const top = row * tileH;
    const outPath = path.join(CARDS_DIR, `${name}.png`);
    await sharp(inputPath)
      .extract({ left, top, width: tileW, height: tileH })
      .png()
      .toFile(outPath);
    console.log('  OK', path.relative(ROOT, outPath));
  }
  console.log('Готово. Карточки записаны в public/images/cards/');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
