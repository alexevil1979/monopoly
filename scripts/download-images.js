/**
 * Скачивает бесплатные фото для тем, стола, карточек и декора.
 * Пробует источники по очереди: Picsum → Unsplash Source → LoremFlickr.
 * Запуск: node scripts/download-images.js
 * Требует Node 18+ (fetch).
 *
 * Задержка 3–5 с между картинками, ретраи при 403 (Picsum).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const MIN_DELAY_MS = 3000;
const MAX_DELAY_MS = 5000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 2000;
const DELAY_BETWEEN_SOURCES_MS = 1500;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

function buildUrls(picsumSeed, unsplashTags, w, h) {
  const tags = unsplashTags.replace(/\s+/g, ',');
  return [
    `https://picsum.photos/seed/${picsumSeed}/${w}/${h}`,
    `https://source.unsplash.com/featured/${w}x${h}/?${tags}`,
    `https://loremflickr.com/${w}/${h}/${tags}`,
  ];
}

async function downloadOne(url, filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://picsum.photos/',
  };

  const res = await fetch(url, {
    redirect: 'follow',
    headers,
  });

  if (!res.ok) {
    const err = new Error(`${res.status}`);
    err.status = res.status;
    throw err;
  }

  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < 100) throw new Error('Empty or tiny response');
  fs.writeFileSync(filePath, buf);
}

async function downloadWithRetry(url, filePath) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await downloadOne(url, filePath);
      return;
    } catch (e) {
      lastError = e;
      if (e.status === 403 && attempt < MAX_RETRIES) {
        const backoff = INITIAL_BACKOFF_MS * Math.pow(2, attempt - 1);
        await sleep(backoff);
      } else {
        throw e;
      }
    }
  }
  throw lastError;
}

async function trySources(urls, filePath) {
  const names = ['Picsum', 'Unsplash', 'LoremFlickr'];
  for (let i = 0; i < urls.length; i++) {
    try {
      if (i === 0) {
        await downloadWithRetry(urls[i], filePath);
      } else {
        await downloadOne(urls[i], filePath);
      }
      return names[i];
    } catch (e) {
      if (i < urls.length - 1) {
        await sleep(DELAY_BETWEEN_SOURCES_MS);
      } else {
        throw e;
      }
    }
  }
}

async function downloadAll() {
  const images = path.join(ROOT, 'public', 'images');

  const tasks = [
    { urls: buildUrls('america50-retro', 'america retro', 1920, 1080), out: path.join(images, 'themes', 'america50.jpg') },
    { urls: buildUrls('classic-green', 'classic green', 1920, 1080), out: path.join(images, 'themes', 'classic.jpg') },
    { urls: buildUrls('artdeco-gold', 'artdeco gold', 1920, 1080), out: path.join(images, 'themes', 'artdeco.jpg') },
    { urls: buildUrls('scandinavian-light', 'scandinavian light', 1920, 1080), out: path.join(images, 'themes', 'scandinavian.jpg') },
    { urls: buildUrls('wood-table', 'wood table', 1920, 1080), out: path.join(images, 'themes', 'wood.jpg') },
    { urls: buildUrls('neon-dark', 'neon dark', 1920, 1080), out: path.join(images, 'themes', 'neon.jpg') },
    { urls: buildUrls('wood-surface', 'wood surface', 1200, 1200), out: path.join(images, 'table', 'surface.jpg') },
    { urls: buildUrls('card-go', 'card go', 600, 600), out: path.join(images, 'cards', 'go.jpg') },
    { urls: buildUrls('card-street', 'street house', 600, 600), out: path.join(images, 'cards', 'street.jpg') },
    { urls: buildUrls('card-chance', 'chance dice', 600, 600), out: path.join(images, 'cards', 'chance.jpg') },
    { urls: buildUrls('card-community', 'community chest', 600, 600), out: path.join(images, 'cards', 'community_chest.jpg') },
    { urls: buildUrls('card-tax', 'tax money', 600, 600), out: path.join(images, 'cards', 'tax.jpg') },
    { urls: buildUrls('card-railroad', 'railroad train', 600, 600), out: path.join(images, 'cards', 'railroad.jpg') },
    { urls: buildUrls('card-jail', 'jail prison', 600, 600), out: path.join(images, 'cards', 'jail.jpg') },
    { urls: buildUrls('card-utility', 'utility light', 600, 600), out: path.join(images, 'cards', 'utility.jpg') },
    { urls: buildUrls('card-parking', 'parking car', 600, 600), out: path.join(images, 'cards', 'free_parking.jpg') },
    { urls: buildUrls('card-gojail', 'jail bars', 600, 600), out: path.join(images, 'cards', 'go_to_jail.jpg') },
    { urls: buildUrls('card-default', 'abstract', 600, 600), out: path.join(images, 'cards', 'default.jpg') },
    { urls: buildUrls('decoration-frame', 'frame border', 800, 600), out: path.join(images, 'decoration', 'frame.jpg') },
    { urls: buildUrls('decoration-corner', 'corner decor', 400, 400), out: path.join(images, 'decoration', 'corner.jpg') },
  ];

  console.log('Downloading images. Sources: Picsum → Unsplash → LoremFlickr. Delay 3–5 s between files.');
  let ok = 0;
  let fail = 0;

  for (let i = 0; i < tasks.length; i++) {
    const { urls, out } = tasks[i];
    const outRel = path.relative(ROOT, out);
    if (i > 0) {
      await sleep(randomDelay());
    }
    try {
      const source = await trySources(urls, out);
      console.log('OK', outRel, `(${source})`);
      ok++;
    } catch (e) {
      console.error('FAIL', outRel, e.message);
      fail++;
    }
  }

  console.log('Done.', ok, 'OK,', fail, 'FAIL.');
}

downloadAll().catch((e) => {
  console.error(e);
  process.exit(1);
});
