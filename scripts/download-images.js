/**
 * Скачивает бесплатные фото (Lorem Picsum) для тем, стола, карточек и декора.
 * Запуск: node scripts/download-images.js
 * Требует Node 18+ (fetch).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const BASE = 'https://picsum.photos/seed';

async function download(url, filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const res = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
  });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(filePath, buf);
  console.log('OK', path.relative(ROOT, filePath));
}

async function main() {
  const images = path.join(ROOT, 'public', 'images');

  const tasks = [
    // Темы фона (широкие, для cover)
    { url: `${BASE}/america50-retro/1920/1080`, out: path.join(images, 'themes', 'america50.jpg') },
    { url: `${BASE}/classic-green/1920/1080`, out: path.join(images, 'themes', 'classic.jpg') },
    { url: `${BASE}/artdeco-gold/1920/1080`, out: path.join(images, 'themes', 'artdeco.jpg') },
    { url: `${BASE}/scandinavian-light/1920/1080`, out: path.join(images, 'themes', 'scandinavian.jpg') },
    { url: `${BASE}/wood-table/1920/1080`, out: path.join(images, 'themes', 'wood.jpg') },
    { url: `${BASE}/neon-dark/1920/1080`, out: path.join(images, 'themes', 'neon.jpg') },
    // Стол под доской
    { url: `${BASE}/wood-surface/1200/1200`, out: path.join(images, 'table', 'surface.jpg') },
    // Карточки (квадрат для превью в модалках)
    { url: `${BASE}/card-go/600/600`, out: path.join(images, 'cards', 'go.jpg') },
    { url: `${BASE}/card-street/600/600`, out: path.join(images, 'cards', 'street.jpg') },
    { url: `${BASE}/card-chance/600/600`, out: path.join(images, 'cards', 'chance.jpg') },
    { url: `${BASE}/card-community/600/600`, out: path.join(images, 'cards', 'community_chest.jpg') },
    { url: `${BASE}/card-tax/600/600`, out: path.join(images, 'cards', 'tax.jpg') },
    { url: `${BASE}/card-railroad/600/600`, out: path.join(images, 'cards', 'railroad.jpg') },
    { url: `${BASE}/card-jail/600/600`, out: path.join(images, 'cards', 'jail.jpg') },
    { url: `${BASE}/card-utility/600/600`, out: path.join(images, 'cards', 'utility.jpg') },
    { url: `${BASE}/card-parking/600/600`, out: path.join(images, 'cards', 'free_parking.jpg') },
    { url: `${BASE}/card-gojail/600/600`, out: path.join(images, 'cards', 'go_to_jail.jpg') },
    { url: `${BASE}/card-default/600/600`, out: path.join(images, 'cards', 'default.jpg') },
    // Декор (рамки/углы — по желанию)
    { url: `${BASE}/decoration-frame/800/600`, out: path.join(images, 'decoration', 'frame.jpg') },
    { url: `${BASE}/decoration-corner/400/400`, out: path.join(images, 'decoration', 'corner.jpg') },
  ];

  console.log('Downloading images (Lorem Picsum, free to use)...');
  for (const { url, out } of tasks) {
    try {
      await download(url, out);
    } catch (e) {
      console.error('FAIL', out, e.message);
    }
  }
  console.log('Done.');
}

main();
