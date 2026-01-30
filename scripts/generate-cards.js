/**
 * Генерация карточек клеток в едином стиле (одна партия).
 * Заменяет старые PNG в public/images/cards/.
 * Запуск: node scripts/generate-cards.js
 * Требует: npm install sharp
 */

import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const CARDS = path.join(ROOT, 'public', 'images', 'cards');

const W = 600;
const H = 600;
const BORDER = 20;
const INNER_W = W - 2 * BORDER;
const INNER_H = H - 2 * BORDER;

/** Цвета в стиле классической Монополии: верхняя полоска + фон карточки */
const CARD_CONFIG = [
  { name: 'go', fill: { r: 45, g: 125, b: 125 }, stripe: { r: 35, g: 94, b: 94 } },
  { name: 'street', fill: { r: 245, g: 230, b: 211 }, stripe: { r: 139, g: 105, b: 20 } },
  { name: 'chance', fill: { r: 252, g: 200, b: 120 }, stripe: { r: 232, g: 93, b: 76 } },
  { name: 'community_chest', fill: { r: 220, g: 235, b: 250 }, stripe: { r: 30, g: 144, b: 255 } },
  { name: 'tax', fill: { r: 255, g: 245, b: 200 }, stripe: { r: 255, g: 215, b: 0 } },
  { name: 'railroad', fill: { r: 240, g: 238, b: 235 }, stripe: { r: 51, g: 51, b: 51 } },
  { name: 'jail', fill: { r: 210, g: 180, b: 140 }, stripe: { r: 139, g: 69, b: 19 } },
  { name: 'utility', fill: { r: 255, g: 250, b: 220 }, stripe: { r: 244, g: 211, b: 94 } },
  { name: 'free_parking', fill: { r: 220, g: 235, b: 255 }, stripe: { r: 30, g: 144, b: 255 } },
  { name: 'go_to_jail', fill: { r: 255, g: 235, b: 235 }, stripe: { r: 220, g: 20, b: 60 } },
  { name: 'default', fill: { r: 235, g: 235, b: 235 }, stripe: { r: 136, g: 136, b: 136 } },
];

async function createCardImage({ name, fill, stripe }) {
  const borderColor = { r: 212, g: 175, b: 55, alpha: 1 };
  const stripeHeight = 56;

  const innerCard = await sharp({
    create: {
      width: INNER_W,
      height: INNER_H,
      channels: 4,
      background: { r: fill.r, g: fill.g, b: fill.b, alpha: 1 },
    },
  })
    .png()
    .toBuffer();

  const stripeSvg = Buffer.from(
    `<svg width="${INNER_W}" height="${stripeHeight}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${INNER_W}" height="${stripeHeight}" fill="rgb(${stripe.r},${stripe.g},${stripe.b})"/>
    </svg>`
  );

  const borderLayer = await sharp({
    create: {
      width: W,
      height: H,
      channels: 4,
      background: { ...borderColor },
    },
  })
    .png()
    .toBuffer();

  const innerWithStripe = await sharp(innerCard)
    .composite([{ input: stripeSvg, top: 0, left: 0 }])
    .png()
    .toBuffer();

  const result = await sharp(borderLayer)
    .composite([{ input: innerWithStripe, top: BORDER, left: BORDER }])
    .png()
    .toBuffer();

  return result;
}

async function main() {
  if (!fs.existsSync(CARDS)) fs.mkdirSync(CARDS, { recursive: true });

  console.log('Generating card images (unified style)...');
  for (const config of CARD_CONFIG) {
    const buf = await createCardImage(config);
    const outPath = path.join(CARDS, `${config.name}.png`);
    fs.writeFileSync(outPath, buf);
    console.log('OK', path.relative(ROOT, outPath));
  }
  console.log('Done. Old PNGs replaced with new batch.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
