/**
 * Нарезка спрайта карточек на отдельные PNG.
 *
 * Режим 1 — один файл: сетка 4×3, 11 карточек (1104×832 → ~276×277 или 2400×1800 → 600×600).
 * Режим 2 — два файла: каждый 3×2, первый 6 карточек, второй 5 карточек (1104×832 → 368×416).
 *
 * Использование:
 *   node scripts/slice-cards-sprite.js [путь/к/спрайту.jpg]
 *   node scripts/slice-cards-sprite.js [спрайт-1.jpg] [спрайт-2.jpg]
 *
 * По умолчанию (1 аргумент): public/images/cards/cards-sprite.jpg
 * По умолчанию (2 аргумента): cards-sprite-1.jpg и cards-sprite-2.jpg в public/images/cards/
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

async function sliceGrid(sharp, inputPath, cols, rows, startIndex, count) {
  const meta = await sharp(inputPath).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (!w || !h) throw new Error('Не удалось прочитать размеры: ' + inputPath);
  const tileW = Math.floor(w / cols);
  const tileH = Math.floor(h / rows);
  if (tileW < 50 || tileH < 50) throw new Error('Слишком маленький спрайт: ' + inputPath);
  const results = [];
  for (let i = 0; i < count; i++) {
    const idx = startIndex + i;
    if (idx >= CARD_NAMES.length) break;
    const col = i % cols;
    const row = Math.floor(i / cols);
    const left = col * tileW;
    const top = row * tileH;
    results.push({
      name: CARD_NAMES[idx],
      extract: { left, top, width: tileW, height: tileH },
      inputPath,
    });
  }
  return { sharp, tileW, tileH, results };
}

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    console.error('Требуется sharp: npm install sharp');
    process.exit(1);
  }

  const defaultSingle = path.join(CARDS_DIR, 'cards-sprite.jpg');
  const defaultFirst = path.join(CARDS_DIR, 'cards-sprite-1.jpg');
  const defaultSecond = path.join(CARDS_DIR, 'cards-sprite-2.jpg');

  let arg1 = process.argv[2];
  let arg2 = process.argv[3];

  let twoFiles = !!arg2;
  if (!arg1 && !arg2) {
    if (fs.existsSync(defaultFirst) && fs.existsSync(defaultSecond)) {
      arg1 = defaultFirst;
      arg2 = defaultSecond;
      twoFiles = true;
    } else {
      arg1 = defaultSingle;
    }
  }

  const paths = twoFiles
    ? [
        path.isAbsolute(arg1) ? arg1 : path.join(CARDS_DIR, path.basename(arg1)),
        path.isAbsolute(arg2) ? arg2 : path.join(CARDS_DIR, path.basename(arg2)),
      ]
    : [path.isAbsolute(arg1) ? arg1 : path.join(CARDS_DIR, path.basename(arg1))];

  for (const p of paths) {
    if (!fs.existsSync(p)) {
      console.error('Спрайт не найден:', p);
      if (twoFiles) {
        console.error('Для двух спрайтов положите cards-sprite-1.jpg и cards-sprite-2.jpg в public/images/cards/');
      } else {
        console.error('Положите cards-sprite.jpg в public/images/cards/ или укажите путь аргументом.');
      }
      process.exit(1);
    }
  }

  fs.mkdirSync(CARDS_DIR, { recursive: true });

  if (twoFiles) {
    // Первый спрайт: 3×2, карточки 0–5
    const first = await sliceGrid(sharp, paths[0], 3, 2, 0, 6);
    for (const r of first.results) {
      const outPath = path.join(CARDS_DIR, `${r.name}.png`);
      await sharp(paths[0])
        .extract(r.extract)
        .png()
        .toFile(outPath);
      console.log('  OK', path.relative(ROOT, outPath));
    }
    // Второй спрайт: 3×2, карточки 6–10 (5 штук, шестая ячейка пустая)
    const second = await sliceGrid(sharp, paths[1], 3, 2, 6, 5);
    for (const r of second.results) {
      const outPath = path.join(CARDS_DIR, `${r.name}.png`);
      await sharp(paths[1])
        .extract(r.extract)
        .png()
        .toFile(outPath);
      console.log('  OK', path.relative(ROOT, outPath));
    }
    console.log('Готово. 11 карточек записаны в public/images/cards/');
    return;
  }

  // Один спрайт: 4×3, 11 карточек
  const meta = await sharp(paths[0]).metadata();
  const w = meta.width || 0;
  const h = meta.height || 0;
  if (!w || !h) {
    console.error('Не удалось прочитать размеры изображения');
    process.exit(1);
  }
  const COLS = 4;
  const ROWS = 3;
  const tileW = Math.floor(w / COLS);
  const tileH = Math.floor(h / ROWS);
  if (tileW < 100 || tileH < 100) {
    console.error('Слишком маленький спрайт. Ожидается минимум 400×300 (карточки 100×100).');
    process.exit(1);
  }
  console.log(`Спрайт: ${w}×${h}, тайл: ${tileW}×${tileH}, сетка ${COLS}×${ROWS}`);
  for (let i = 0; i < CARD_NAMES.length; i++) {
    const name = CARD_NAMES[i];
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const left = col * tileW;
    const top = row * tileH;
    const outPath = path.join(CARDS_DIR, `${name}.png`);
    await sharp(paths[0])
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
