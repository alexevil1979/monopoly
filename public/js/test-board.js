/**
 * Тестовая страница доски: рендер без комнаты и сервера.
 * Использует gameState (BOARD_CELLS, getCardImageUrl) и utils (formatMoney).
 */

import { BOARD_CELLS, getCardImageUrl, isCornerCell } from './gameState.js';
import { formatMoney } from './utils.js';
import { getCellDisplay, setLang, getLang, applyPage } from './i18n.js';

const boardEl = document.getElementById('board');
const themePicker = document.getElementById('themePicker');
const themeToggle = document.getElementById('themeToggle');

const THEMES = ['america50', 'classic', 'artdeco', 'scandinavian', 'wood', 'neon', 'luxury'];

function renderBoard() {
  if (!boardEl) return;

  boardEl.innerHTML = '';

  BOARD_CELLS.forEach((cell) => {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'board-cell';
    cellDiv.dataset.index = cell.index;
    cellDiv.dataset.type = cell.type;
    if (cell.color) cellDiv.dataset.color = cell.color;

    const card = document.createElement('div');
    card.className = 'cell-card cell-card-has-img' + (isCornerCell(cell) ? ' cell-card--corner' : '');
    card.dataset.type = cell.type;
    if (cell.color) card.dataset.color = cell.color;

    const cardBg = document.createElement('div');
    cardBg.className = 'cell-card-bg';
    cardBg.style.backgroundImage = `url(${getCardImageUrl(cell)})`;
    card.appendChild(cardBg);

    const overlay = document.createElement('div');
    overlay.className = 'cell-card-overlay';

    const content = document.createElement('div');
    content.className = 'cell-card-content';

    const display = getCellDisplay(cell.index);
    const name = document.createElement('div');
    name.className = 'cell-name';
    name.textContent = display.name;

    const price = document.createElement('div');
    price.className = 'cell-price';
    if (cell.price) price.textContent = formatMoney(cell.price);

    const tokens = document.createElement('div');
    tokens.className = 'cell-tokens';
    tokens.id = `cell-tokens-${cell.index}`;

    content.appendChild(name);
    if (cell.price) content.appendChild(price);
    content.appendChild(tokens);
    card.appendChild(overlay);
    card.appendChild(content);
    cellDiv.appendChild(card);
    boardEl.appendChild(cellDiv);
  });
}

function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  document.body.setAttribute('data-hall-theme', theme);
  localStorage.setItem('monopolyHallTheme', theme);
  themePicker.querySelectorAll('.theme-picker-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.hallTheme === theme);
  });
  renderBoard();
}

function cycleTheme() {
  const current = document.body.getAttribute('data-hall-theme') || 'america50';
  const idx = THEMES.indexOf(current);
  const next = THEMES[(idx + 1) % THEMES.length];
  setTheme(next);
}

(function initLang() {
  const stored = localStorage.getItem('monopolyLang');
  if (stored && ['en', 'ru', 'zh', 'hi', 'ar'].includes(stored)) setLang(stored);
  const langSelect = document.getElementById('langSelectTest');
  if (langSelect) {
    langSelect.value = getLang();
    langSelect.addEventListener('change', () => {
      setLang(langSelect.value);
      renderBoard();
    });
  }
})();

renderBoard();

const currentTheme = document.body.getAttribute('data-hall-theme') || 'america50';
themePicker?.querySelectorAll('.theme-picker-btn').forEach((btn) => {
  btn.classList.toggle('active', btn.dataset.hallTheme === currentTheme);
});

themePicker?.addEventListener('click', (e) => {
  const btn = e.target.closest('.theme-picker-btn');
  if (btn) setTheme(btn.dataset.hallTheme);
});

themeToggle?.addEventListener('click', cycleTheme);
