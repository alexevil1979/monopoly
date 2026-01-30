/**
 * Генерация красивых карточек клеток (градиенты, иконки, единый стиль).
 * Заменяет PNG в public/images/cards/.
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
const R = 16;
const BORDER = 14;
const STRIPE_H = 72;

/** Цвета: stripe (верх), fill1 (фон сверху), fill2 (фон снизу), icon (иконка) — для градиентов и контраста */
const CARD_CONFIG = [
  { name: 'go', stripe: '#1a6b6b', fill1: '#2d9d9d', fill2: '#1e7a7a', icon: '#fff' },
  { name: 'street', stripe: '#8b6914', fill1: '#f8f0e4', fill2: '#ede0d0', icon: '#5c4a32' },
  { name: 'chance', stripe: '#c44a3a', fill1: '#ffe4c0', fill2: '#ffd4a0', icon: '#8b3a2a' },
  { name: 'community_chest', stripe: '#1a6bb3', fill1: '#e8f2ff', fill2: '#d0e4ff', icon: '#1a5a9e' },
  { name: 'tax', stripe: '#b8860b', fill1: '#fffde8', fill2: '#fff4c4', icon: '#7a5a08' },
  { name: 'railroad', stripe: '#2d2d2d', fill1: '#f5f4f2', fill2: '#e8e6e2', icon: '#333' },
  { name: 'jail', stripe: '#5c3d1e', fill1: '#e8ddd0', fill2: '#d8c8b8', icon: '#3d2817' },
  { name: 'utility', stripe: '#c9a82a', fill1: '#fffce8', fill2: '#fff4c4', icon: '#8b7312' },
  { name: 'free_parking', stripe: '#1a7ab8', fill1: '#e6f2ff', fill2: '#cce0ff', icon: '#1a6aa0' },
  { name: 'go_to_jail', stripe: '#a01830', fill1: '#ffe8e8', fill2: '#ffd0d0', icon: '#801020' },
  { name: 'default', stripe: '#666', fill1: '#f0f0f0', fill2: '#e0e0e0', icon: '#555' },
];

/** Простые иконки SVG (центр карточки): путь или группа, viewBox 0 0 100 100, масштаб под ~160px */
const ICONS = {
  go: '<circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" stroke-width="6"/><text x="50" y="62" font-family="Georgia,serif" font-size="36" font-weight="bold" fill="currentColor" text-anchor="middle">GO</text>',
  street: '<path d="M50 25 L75 55 L75 85 L25 85 L25 55 Z" fill="none" stroke="currentColor" stroke-width="5"/><rect x="42" y="55" width="16" height="30" fill="currentColor"/>',
  chance: '<circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" stroke-width="5"/><text x="50" y="68" font-family="Georgia,serif" font-size="48" font-weight="bold" fill="currentColor" text-anchor="middle">?</text>',
  community_chest: '<rect x="20" y="45" width="60" height="40" rx="4" fill="none" stroke="currentColor" stroke-width="4"/><rect x="35" y="35" width="30" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="3"/><line x1="35" y1="52" x2="65" y2="52" stroke="currentColor" stroke-width="2"/>',
  tax: '<text x="50" y="68" font-family="Georgia,serif" font-size="42" font-weight="bold" fill="currentColor" text-anchor="middle">%</text><rect x="30" y="75" width="40" height="6" fill="currentColor"/>',
  railroad: '<rect x="22" y="45" width="56" height="32" rx="4" fill="none" stroke="currentColor" stroke-width="4"/><circle cx="35" cy="72" r="8" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="65" cy="72" r="8" fill="none" stroke="currentColor" stroke-width="3"/><rect x="35" y="38" width="30" height="14" fill="currentColor"/><polygon points="50,25 65,38 35,38" fill="currentColor"/>',
  jail: '<rect x="25" y="35" width="50" height="45" rx="2" fill="none" stroke="currentColor" stroke-width="4"/><line x1="25" y1="48" x2="75" y2="48" stroke="currentColor" stroke-width="3"/><line x1="40" y1="35" x2="40" y2="80" stroke="currentColor" stroke-width="3"/><line x1="55" y1="35" x2="55" y2="80" stroke="currentColor" stroke-width="3"/><line x1="25" y1="62" x2="75" y2="62" stroke="currentColor" stroke-width="3"/>',
  utility: '<path d="M55 20 L35 50 L50 50 L30 80 L55 48 L42 48 Z" fill="currentColor"/>',
  free_parking: '<rect x="32" y="30" width="36" height="50" rx="4" fill="none" stroke="currentColor" stroke-width="4"/><text x="50" y="62" font-family="Georgia,serif" font-size="28" font-weight="bold" fill="currentColor" text-anchor="middle">P</text>',
  go_to_jail: '<rect x="30" y="40" width="40" height="28" rx="3" fill="none" stroke="currentColor" stroke-width="3"/><circle cx="38" cy="54" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="62" cy="54" r="5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M30 52 L22 52 M70 52 L78 52" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  default: '<rect x="30" y="30" width="40" height="40" rx="6" fill="none" stroke="currentColor" stroke-width="4"/>',
};

function buildCardSvg(config) {
  const { name, stripe, fill1, fill2, icon } = config;
  const iconSvg = ICONS[name] || ICONS.default;
  const innerW = W - 2 * BORDER;
  const innerH = H - 2 * BORDER;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg-${name}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${fill1}"/>
      <stop offset="100%" style="stop-color:${fill2}"/>
    </linearGradient>
    <linearGradient id="stripe-${name}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:${stripe};stop-opacity:1"/>
      <stop offset="100%" style="stop-color:${stripe};stop-opacity:0.85"/>
    </linearGradient>
    <filter id="shadow-${name}" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-opacity="0.15"/>
    </filter>
    <linearGradient id="gold-${name}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#e8d48c"/>
      <stop offset="50%" style="stop-color:#d4af37"/>
      <stop offset="100%" style="stop-color:#b8962e"/>
    </linearGradient>
  </defs>
  <!-- Рамка (золотая) -->
  <rect x="0" y="0" width="${W}" height="${H}" rx="${R + 4}" fill="url(#gold-${name})"/>
  <!-- Внутренняя карточка с тенью -->
  <rect x="${BORDER}" y="${BORDER}" width="${innerW}" height="${innerH}" rx="${R}" fill="url(#bg-${name})" filter="url(#shadow-${name})"/>
  <!-- Верхняя полоска -->
  <rect x="${BORDER}" y="${BORDER}" width="${innerW}" height="${STRIPE_H}" rx="${R} ${R} 0 0" fill="url(#stripe-${name})"/>
  <!-- Тонкая линия под полоской -->
  <line x1="${BORDER}" y1="${BORDER + STRIPE_H}" x2="${W - BORDER}" y2="${BORDER + STRIPE_H}" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>
  <!-- Иконка по центру -->
  <g transform="translate(${BORDER + innerW / 2 - 50}, ${BORDER + STRIPE_H + (innerH - STRIPE_H) / 2 - 50})" style="color:${icon}">
    ${iconSvg}
  </g>
</svg>`;
}

async function main() {
  if (!fs.existsSync(CARDS)) fs.mkdirSync(CARDS, { recursive: true });

  console.log('Generating beautiful card images...');
  for (const config of CARD_CONFIG) {
    const svg = buildCardSvg(config);
    const buf = await sharp(Buffer.from(svg))
      .png({ quality: 100 })
      .toBuffer();
    const outPath = path.join(CARDS, `${config.name}.png`);
    fs.writeFileSync(outPath, buf);
    console.log('OK', path.relative(ROOT, outPath));
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
