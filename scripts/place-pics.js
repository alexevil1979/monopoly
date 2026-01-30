/**
 * Анализ pics/: копирование фонов/стола в themes/ и table/,
 * нарезка спрайта карточек в cards/ (если установлен sharp).
 * Запуск: node scripts/place-pics.js
 * Для нарезки карточек: npm install sharp && node scripts/place-pics.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  sharp = null;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const PICS = path.join(ROOT, 'pics');
const THEMES = path.join(ROOT, 'public', 'images', 'themes');
const TABLE = path.join(ROOT, 'public', 'images', 'table');
const CARDS = path.join(ROOT, 'public', 'images', 'cards');

// По описаниям: 52=спрайт карточек, 543=wood интерьер, 546=дерево текстура, 73=teal felt, ad=neon, afb=scandinavian, b4a=artdeco, eb=america50 diner, f45=одна карточка
const THEME_MAP = [
  { file: '543d6a60-1ed8-436b-929a-ebe952e93428.jpg', name: 'wood.jpg' },
  { file: '73a2907f-6df4-4d14-ad0b-4701d8d96cf7.jpg', name: 'classic.jpg' },
  { file: 'ad78b19b-5657-4ce1-a379-44a2d70703ba.jpg', name: 'neon.jpg' },
  { file: 'afb60905-8429-46d3-b321-3bd793a62b58.jpg', name: 'scandinavian.jpg' },
  { file: 'b4a5febf-d203-40af-8f2a-f089539486b4.jpg', name: 'artdeco.jpg' },
  { file: 'eb1509bb-be64-4d62-8b6e-d7562b1e45f9.jpg', name: 'america50.jpg' },
];
const TABLE_MAP = { file: '54672ef4-170e-4617-a118-1feb2d48f6c2.jpg', name: 'surface.jpg' };
const SPRITE_FILE = '52db6fbb-2265-4df9-a908-853f214e5b6d.jpg';
const CARD_NAMES = ['go', 'street', 'chance', 'community_chest', 'tax', 'railroad', 'jail', 'utility', 'free_parking', 'go_to_jail', 'default'];

function copy(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn('Skip (not found):', src);
    return;
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
  console.log('OK', path.relative(ROOT, dest));
}

async function sliceSprite() {
  const src = path.join(PICS, SPRITE_FILE);
  if (!fs.existsSync(src)) {
    console.warn('Sprite not found:', src);
    return;
  }
  fs.mkdirSync(CARDS, { recursive: true });

  if (sharp) {
    const meta = await sharp(src).metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    if (!w || !h) {
      console.warn('Could not read sprite dimensions');
      return;
    }
    const cols = 4;
    const rows = 3;
    const marginX = Math.round(w * 0.04);
    const marginY = Math.round(h * 0.05);
    const gapX = Math.round(w * 0.02);
    const gapY = Math.round(h * 0.025);
    const innerW = w - 2 * marginX - (cols - 1) * gapX;
    const innerH = h - 2 * marginY - (rows - 1) * gapY;
    const tileW = Math.round(innerW / cols);
    const tileH = Math.round(innerH / rows);
    for (let i = 0; i < CARD_NAMES.length; i++) {
      const name = CARD_NAMES[i];
      const col = i % cols;
      const row = Math.floor(i / cols);
      const left = marginX + col * (tileW + gapX);
      const top = marginY + row * (tileH + gapY);
      const outPath = path.join(CARDS, `${name}.png`);
      await sharp(src)
        .extract({ left, top, width: tileW, height: tileH })
        .png()
        .toFile(outPath);
      console.log('OK', path.relative(ROOT, outPath));
    }
    return;
  }

  console.warn('Sharp not installed. Sprite copied as cards-sprite.jpg. To slice: npm install sharp && node scripts/place-pics.js — или открой /tools/slice-cards.html в браузере.');
  copy(src, path.join(CARDS, 'cards-sprite.jpg'));
}

async function main() {
  console.log('Copying theme backgrounds...');
  for (const { file, name } of THEME_MAP) {
    copy(path.join(PICS, file), path.join(THEMES, name));
  }
  console.log('Copying table surface...');
  copy(path.join(PICS, TABLE_MAP.file), path.join(TABLE, TABLE_MAP.name));
  console.log('Slicing cards sprite...');
  await sliceSprite();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
