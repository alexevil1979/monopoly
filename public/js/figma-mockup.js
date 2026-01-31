/**
 * Макет страницы игры для загрузки в Figma (1440×900).
 * Рендерит стол с картами, панель игроков, HUD, чат.
 */

import { BOARD_CELLS, getCardImageUrl, isCornerCell } from './gameState.js';
import { formatMoney, getPlayerToken, getInitials, TOKEN_COLORS } from './utils.js';
import { getCellDisplay, setLang, getLang } from './i18n.js';

const boardEl = document.getElementById('board');
const playersPanel = document.getElementById('playersPanel');
const gameActions = document.getElementById('gameActions');
const chatLog = document.getElementById('chatLog');

const MOCK_PLAYERS = [
  { name: 'Alice', money: 1500, isCurrent: true },
  { name: 'Bob', money: 1420, isCurrent: false },
  { name: 'Carol', money: 1380, isCurrent: false },
];

const MOCK_CHAT = [
  { sender: 'Bob', text: 'Good luck everyone!' },
  { sender: 'Alice', text: 'Rolling...' },
  { sender: 'System', text: "It's Alice's turn." },
];

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
    if (cell.index === 3) card.classList.add('landed');

    const cardBg = document.createElement('div');
    cardBg.className = 'cell-card-bg';
    cardBg.style.backgroundImage = `url(${getCardImageUrl(cell)})`;
    card.appendChild(cardBg);

    const overlay = document.createElement('div');
    overlay.className = 'cell-card-overlay';
    card.appendChild(overlay);

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
    card.appendChild(content);

    const tokenSpot = document.createElement('div');
    tokenSpot.className = 'cell-token-spot';
    tokenSpot.dataset.index = String(cell.index);
    card.appendChild(tokenSpot);

    cellDiv.appendChild(card);
    boardEl.appendChild(cellDiv);
  });

  // Один токен на клетке 3 (для макета)
  const tokenSpot3 = document.querySelector('.cell-token-spot[data-index="3"]');
  if (tokenSpot3) {
    const token = getPlayerToken(0);
    const tokenEl = document.createElement('div');
    tokenEl.className = 'player-token';
    tokenEl.setAttribute('data-player-index', '0');
    tokenEl.title = 'Alice';
    tokenEl.style.backgroundColor = token.color;
    tokenEl.textContent = token.icon;
    tokenSpot3.appendChild(tokenEl);
  }
}

function renderPlayers() {
  if (!playersPanel) return;
  playersPanel.innerHTML = '';
  MOCK_PLAYERS.forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    if (p.isCurrent) card.classList.add('current');
    const token = getPlayerToken(i);
    const header = document.createElement('div');
    header.className = 'player-header';
    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    avatar.style.background = `linear-gradient(135deg, ${token.color}, ${TOKEN_COLORS[(i + 1) % TOKEN_COLORS.length]})`;
    avatar.textContent = getInitials(p.name);
    const info = document.createElement('div');
    info.className = 'player-info';
    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = p.name;
    const money = document.createElement('div');
    money.className = 'player-money';
    const moneyIcon = document.createElement('span');
    moneyIcon.className = 'money-icon';
    moneyIcon.textContent = '💰';
    money.appendChild(moneyIcon);
    money.appendChild(document.createTextNode(formatMoney(p.money)));
    info.appendChild(name);
    info.appendChild(money);
    header.appendChild(avatar);
    header.appendChild(info);
    card.appendChild(header);
    playersPanel.appendChild(card);
  });
}

function renderGameActions() {
  if (!gameActions) return;
  gameActions.innerHTML = '';
  const rollBtn = document.createElement('button');
  rollBtn.className = 'action-btn primary';
  rollBtn.textContent = 'Roll dice';
  const endBtn = document.createElement('button');
  endBtn.className = 'action-btn secondary';
  endBtn.textContent = 'End turn';
  gameActions.appendChild(rollBtn);
  gameActions.appendChild(endBtn);
}

function renderChat() {
  if (!chatLog) return;
  chatLog.innerHTML = '';
  MOCK_CHAT.forEach((msg) => {
    const div = document.createElement('div');
    div.className = 'chat-message';
    const sender = document.createElement('span');
    sender.className = 'sender';
    sender.textContent = msg.sender + ': ';
    div.appendChild(sender);
    div.appendChild(document.createTextNode(msg.text));
    chatLog.appendChild(div);
  });
}

(function init() {
  const stored = localStorage.getItem('monopolyLang');
  if (stored && ['en', 'ru', 'zh', 'hi', 'ar'].indexOf(stored) !== -1) setLang(stored);
  renderBoard();
  renderPlayers();
  renderGameActions();
  renderChat();
})();
