/**
 * Генерация карточек из полноценных фото.
 * 1) Локальные фото из pics/cards/{name}.jpg (или .png) — если есть.
 * 2) Скачивание с picsum.photos по seed — если есть сеть.
 * 3) Fallback: фото-подобная текстура (градиент + шум).
 * Итог: каждая карточка — изображение 600×600 с золотой рамкой.
 * Запуск: node scripts/generate-cards.js
 * Требует: Node 18+ (fetch), npm install sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CARDS = path.join(ROOT, 'public', 'images', 'cards');
const PICS_CARDS = path.join(ROOT, 'pics', 'cards');

const W = 600;
const H = 600;
const BORDER = 18;
const INNER = W - 2 * BORDER;
const RADIUS = 12;

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

const PICSUM_BASE = 'https://picsum.photos/seed';

async function fetchImage(url) {
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'image/*',
    },
  });
  if (!res.ok) throw new Error(`${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Фото-подобная текстура: градиент + шум (raw pixel buffer) */
async function createPhotoLikeTexture(name) {
  const colors = {
    go: [40, 120, 120],
    street: [245, 230, 210],
    chance: [250, 200, 140],
    community_chest: [220, 235, 250],
    tax: [255, 245, 210],
    railroad: [235, 232, 228],
    jail: [210, 188, 165],
    utility: [255, 250, 220],
    free_parking: [220, 235, 255],
    go_to_jail: [255, 228, 228],
    default: [240, 240, 238],
  };
  const [r0, g0, b0] = colors[name] || colors.default;
  const pixels = Buffer.alloc(INNER * INNER * 4);
  for (let y = 0; y < INNER; y++) {
    for (let x = 0; x < INNER; x++) {
      const t = (y / INNER + x / INNER) / 2;
      const noise = (Math.random() - 0.5) * 18;
      const r = Math.min(255, Math.max(0, Math.round(r0 * (0.92 + t * 0.08) + noise)));
      const g = Math.min(255, Math.max(0, Math.round(g0 * (0.92 + t * 0.08) + noise)));
      const b = Math.min(255, Math.max(0, Math.round(b0 * (0.92 + t * 0.08) + noise)));
      const i = (y * INNER + x) * 4;
      pixels[i] = r;
      pixels[i + 1] = g;
      pixels[i + 2] = b;
      pixels[i + 3] = 255;
    }
  }
  return await sharp(pixels, {
    raw: { width: INNER, height: INNER, channels: 4 },
  })
    .png()
    .toBuffer();
}

async function getPhotoForCard(name) {
  const dirs = [
    { dir: PICS_CARDS, ext: ['.jpg', '.jpeg', '.png', '.webp'] },
    { dir: CARDS, ext: ['.jpg', '.jpeg'] },
  ];
  for (const { dir, ext } of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const e of ext) {
      const p = path.join(dir, `${name}${e}`);
      if (fs.existsSync(p)) {
        return sharp(fs.readFileSync(p))
          .resize(INNER, INNER, { fit: 'cover', position: 'center' })
          .png()
          .toBuffer();
      }
    }
  }
  try {
    const seed = name.replace(/_/g, '');
    const url = `${PICSUM_BASE}/${seed}/${INNER}/${INNER}`;
    const buf = await fetchImage(url);
    return await sharp(buf).resize(INNER, INNER, { fit: 'cover', position: 'center' }).png().toBuffer();
  } catch (_) {
    return await createPhotoLikeTexture(name);
  }
}

async function buildCard(name) {
  const photo = await getPhotoForCard(name);

  const goldBorder = await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { r: 212, g: 175, b: 55, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  return await sharp(goldBorder)
    .composite([{ input: photo, top: BORDER, left: BORDER }])
    .png()
    .toBuffer();
}

async function main() {
  if (!fs.existsSync(CARDS)) fs.mkdirSync(CARDS, { recursive: true });

  console.log('Building cards (photos + gold frame)...');
  console.log('  Use pics/cards/{name}.jpg for your own photos, or run with network for picsum.photos.');
  for (const name of CARD_NAMES) {
    try {
      const buf = await buildCard(name);
      const outPath = path.join(CARDS, `${name}.png`);
      fs.writeFileSync(outPath, buf);
      console.log('OK', path.relative(ROOT, outPath));
    } catch (e) {
      console.error('FAIL', name, e.message);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
