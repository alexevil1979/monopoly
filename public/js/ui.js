/**
 * DOM updates: board, players, modals, game HUD.
 * Reads state from gameState; receives action handlers from client.
 */

import {
  getState,
  getMyId,
  setPreviousPosition,
  setPreviousMoney,
  getPreviousPosition,
  getPreviousMoney,
  BOARD_CELLS,
  getCardImageUrl,
  isCornerCell,
} from './gameState.js';
import { getCellDisplay, getCardText, t, tParams } from './i18n.js';
import {
  TOKEN_COLORS,
  getPlayerToken,
  formatMoney,
  getInitials,
  animateDiceRoll,
  getDiceEmoji,
  showModal,
  showToast,
  createConfetti,
} from './utils.js';

const boardEl = document.getElementById('board');
const playersList = document.getElementById('playersList');
const playersPanel = document.getElementById('playersPanel');
const gameStatus = document.getElementById('gameStatus');
const gameActions = document.getElementById('gameActions');
const diceContainer = document.getElementById('diceContainer');
const dice1 = document.getElementById('dice1');
const dice2 = document.getElementById('dice2');

/** Последние отображённые кубики: только при изменении запускаем анимацию (не при каждом updateGameUI) */
let lastDisplayedDiceKey = null;

const lobbyScreen = document.getElementById('lobbyScreen');
const roomScreen = document.getElementById('roomScreen');
const gameScreen = document.getElementById('gameScreen');
const roomCodeEl = document.getElementById('roomCode');

export function showScreen(screen) {
  lobbyScreen?.classList.remove('active');
  roomScreen?.classList.remove('active');
  gameScreen?.classList.remove('active');
  screen?.classList.add('active');
  document.body.classList.toggle('in-game', screen === gameScreen);
}

/**
 * Render circular board with cells
 */
export function renderBoard(properties = {}) {
  const state = getState();
  if (!boardEl) return;

  const currentPlayer = state?.players?.[state?.currentPlayerIndex];
  const landedCellIndex = currentPlayer != null ? (currentPlayer.position ?? 0) : null;

  boardEl.innerHTML = '';

  BOARD_CELLS.forEach((cell) => {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'board-cell';
    cellDiv.dataset.index = cell.index;
    cellDiv.dataset.type = cell.type;
    if (cell.color) cellDiv.dataset.color = cell.color;

    const card = document.createElement('div');
    card.className = 'cell-card';
    card.dataset.type = cell.type;
    if (cell.color) card.dataset.color = cell.color;
    const ownerId = properties[cell.index];
    let ownerIdx = -1;
    if (ownerId) {
      card.classList.add('owned');
      ownerIdx = state?.players?.findIndex((p) => p.id === ownerId) ?? -1;
      if (ownerIdx >= 0) card.dataset.ownerIndex = String(ownerIdx);
    }
    if (landedCellIndex === cell.index) card.classList.add('landed');
    if (isCornerCell(cell)) card.classList.add('cell-card--corner');
    card.classList.add('cell-card-has-img');

    const cardBg = document.createElement('div');
    cardBg.className = 'cell-card-bg';
    cardBg.style.backgroundImage = `url(${getCardImageUrl(cell)})`;
    card.appendChild(cardBg);

    const overlay = document.createElement('div');
    overlay.className = 'cell-card-overlay';

    const content = document.createElement('div');
    content.className = 'cell-card-content';

    if (ownerId && ownerIdx >= 0 && state?.players?.[ownerIdx]) {
      const ownerBadge = document.createElement('div');
      ownerBadge.className = 'cell-owner-badge';
      ownerBadge.title = state.players[ownerIdx].name;
      const token = getPlayerToken(ownerIdx);
      ownerBadge.style.backgroundColor = token.color;
      ownerBadge.textContent = getInitials(state.players[ownerIdx].name);
      content.appendChild(ownerBadge);
    }

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

    const tokenSpot = document.createElement('div');
    tokenSpot.className = 'cell-token-spot';
    tokenSpot.dataset.index = cell.index;

    content.appendChild(name);
    if (cell.price) content.appendChild(price);
    content.appendChild(tokens);
    card.appendChild(overlay);
    card.appendChild(content);
    card.appendChild(tokenSpot);
    cellDiv.appendChild(card);
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const buyInfo = state?.pendingBuyCell && state.landedCell?.index === cell.index ? state.pendingBuyCell : null;
      showPropertyModal(cell, buyInfo);
    });
    boardEl.appendChild(cellDiv);
  });

  if (state?.players) renderPlayerTokens();
}

/**
 * Render player tokens on board — фишка ставится в центр клетки (в .cell-token-spot)
 */
export function renderPlayerTokens() {
  const state = getState();
  if (!state?.players) return;

  document.querySelectorAll('.player-token').forEach((el) => el.remove());

  state.players.forEach((player, idx) => {
    if (player.bankrupt) return;

    const token = getPlayerToken(idx);
    const cellIndex = player.position ?? 0;
    const tokenSpot = document.querySelector(`.cell-token-spot[data-index="${cellIndex}"]`);
    if (!tokenSpot) return;

    const tokenEl = document.createElement('div');
    tokenEl.className = 'player-token';
    tokenEl.id = `token-${player.id}`;
    tokenEl.textContent = token.icon;
    tokenEl.style.backgroundColor = token.color;
    tokenEl.style.borderColor = token.color;
    tokenEl.title = player.name;

    const prevPos = getPreviousPosition(player.id);
    const sameCell = prevPos === cellIndex;
    if (!sameCell && prevPos !== undefined) {
      tokenEl.classList.add('token-just-moved');
    }

    tokenSpot.appendChild(tokenEl);
    setPreviousPosition(player.id, cellIndex);
  });
}

/**
 * Render players list (lobby or game panel)
 */
export function renderPlayers(players, currentIndex, isGame) {
  const state = getState();
  const list = isGame ? playersPanel : playersList;
  if (!list) return;

  list.innerHTML = '';

  (players || []).forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    if (i === currentIndex) card.classList.add('current');
    if (p.bankrupt) card.classList.add('bankrupt');
    if (p.disconnectedAt) card.classList.add('disconnected');

    const token = getPlayerToken(i);
    const initials = getInitials(p.name);

    const header = document.createElement('div');
    header.className = 'player-header';

    const avatar = document.createElement('div');
    avatar.className = 'player-avatar';
    avatar.style.background = `linear-gradient(135deg, ${token.color}, ${TOKEN_COLORS[(i + 1) % TOKEN_COLORS.length]})`;
    avatar.textContent = initials;

    const info = document.createElement('div');
    info.className = 'player-info';

    const name = document.createElement('div');
    name.className = 'player-name';
    name.textContent = p.name;
    if (p.ready && !isGame) name.textContent += ' ✓';

    const money = document.createElement('div');
    money.className = 'player-money';
    const moneyIcon = document.createElement('span');
    moneyIcon.className = 'money-icon';
    moneyIcon.textContent = '💰';
    money.appendChild(moneyIcon);
    money.appendChild(document.createTextNode(formatMoney(p.money)));

    const prevMoney = getPreviousMoney(p.id);
    if (prevMoney !== undefined && prevMoney !== p.money) {
      const diff = p.money - prevMoney;
      money.classList.add(diff > 0 ? 'positive' : 'negative');
      setTimeout(() => money.classList.remove('positive', 'negative'), 500);
    }

    info.appendChild(name);
    info.appendChild(money);
    header.appendChild(avatar);
    header.appendChild(info);

    if (isGame) {
      const properties = document.createElement('div');
      properties.className = 'player-properties';
      const playerProperties = Object.entries(state.properties || {})
        .filter(([, ownerId]) => ownerId === p.id)
        .map(([cellIdx]) => BOARD_CELLS[parseInt(cellIdx, 10)]);

      if (playerProperties.length > 0) {
        playerProperties.forEach((prop) => {
          if (prop.type === 'street') {
            const chip = document.createElement('div');
            chip.className = 'property-chip';
            chip.dataset.color = prop.color;
            chip.textContent = prop.name.split(' ')[0];
            properties.appendChild(chip);
          }
        });
      } else {
        const noProps = document.createElement('div');
        noProps.style.color = 'var(--text-muted)';
        noProps.style.fontSize = '0.8rem';
        noProps.textContent = t('no_properties');
        properties.appendChild(noProps);
      }

      const status = document.createElement('div');
      status.className = 'player-status';
      if (p.disconnectedAt) status.innerHTML = t('player_disconnected');
      else if (p.inJail) status.innerHTML = '🔒 In Jail';
      if (p.lastDice?.[0] && !p.disconnectedAt) {
        const diceText = document.createElement('span');
        diceText.textContent = `🎲 ${p.lastDice[0]}+${p.lastDice[1]}`;
        status.appendChild(diceText);
      }

      card.appendChild(header);
      card.appendChild(properties);
      if (status.textContent) card.appendChild(status);
    } else {
      card.appendChild(header);
    }

    list.appendChild(card);
    setPreviousMoney(p.id, p.money);
  });
}

/**
 * Update game HUD: status, dice, action buttons. handlers: { onRoll, onBuy, onSkip, onEndTurn, onJailPay, onJailWait }
 */
export function updateGameUI(handlers = {}) {
  const state = getState();
  const myId = getMyId();
  if (!state || (state.phase !== 'playing' && state.phase !== 'finished')) return;

  renderPlayers(state.players, state.currentPlayerIndex, true);
  renderBoard(state.properties);
  renderPlayerTokens();

  const current = state.players[state.currentPlayerIndex];
  const isMyTurn = current && current.id === myId && !current.bankrupt;
  const canRoll = isMyTurn && state.pendingAction === 'roll';
  const canBuy = isMyTurn && state.pendingAction === 'buy';
  const canEnd = isMyTurn && state.pendingAction === 'end_turn';
  const canJailPay = isMyTurn && state.pendingAction === 'jail_choice' && current?.inJail;

  let statusText = '';
  let statusClass = 'waiting';

  if (state.phase === 'finished') {
    statusText = state.winnerId === myId ? t('you_win') : t('game_over');
    statusClass = '';
    if (state.winnerId === myId) {
      createConfetti(100);
      showModal('winModal');
      const winText = document.getElementById('winModalText');
      if (winText) {
        const winner = state.players.find((p) => p.id === state.winnerId);
        winText.textContent = winner ? tParams('win_text_player', { name: winner.name }) : t('win_text');
      }
    }
  } else if (state.landedCell) {
    const landedDisplay = getCellDisplay(state.landedCell.index);
    statusText = tParams('landed_on', { name: landedDisplay.name });
    statusClass = '';
  } else if (state.drawnCard) {
    statusText = `${t('card_label')}: ${getCardText(state.drawnCard.id, state.drawnCard.text || '')}`;
    statusClass = '';
  } else if (isMyTurn) {
    statusText = t('your_turn');
    statusClass = 'your-turn';
  } else if (current) {
    statusText = tParams('waiting_for', { name: current.name });
    statusClass = 'waiting';
  }

  if (gameStatus) {
    gameStatus.textContent = statusText;
    gameStatus.className = `hud-status ${statusClass}`;
  }

  if (current?.lastDice?.[0] != null) {
    if (diceContainer) diceContainer.style.display = 'flex';
    const d1 = current.lastDice[0];
    const d2 = current.lastDice[1];
    const key = `${state.currentPlayerIndex}-${d1}-${d2}`;
    if (key !== lastDisplayedDiceKey) {
      lastDisplayedDiceKey = key;
      /* Анимация броска только когда это ход текущего игрока (он только что бросил), не при смене хода */
      if (isMyTurn) {
        if (dice1) animateDiceRoll(dice1, d1);
        if (dice2) animateDiceRoll(dice2, d2);
      } else {
        if (dice1) dice1.textContent = getDiceEmoji(d1);
        if (dice2) dice2.textContent = getDiceEmoji(d2);
      }
    } else {
      if (dice1) dice1.textContent = getDiceEmoji(d1);
      if (dice2) dice2.textContent = getDiceEmoji(d2);
    }
  } else {
    lastDisplayedDiceKey = null;
    if (diceContainer) diceContainer.style.display = 'none';
  }

  if (!gameActions) return;
  gameActions.innerHTML = '';
  if (state.phase === 'finished') return;

  const onError = (res) => {
    if (res?.error) showToast(res.error, 'error');
  };

  if (canRoll && handlers.onRoll) {
    const btn = document.createElement('button');
    btn.className = 'action-btn primary';
    btn.textContent = t('roll_dice');
    btn.onclick = () => {
      btn.disabled = true;
      handlers.onRoll((res) => {
        if (res?.error) {
          showToast(res.error, 'error');
          btn.disabled = false;
        }
      });
    };
    gameActions.appendChild(btn);
  }

  if (canBuy && (handlers.onBuy || handlers.onSkip)) {
    const buyBtn = document.createElement('button');
    buyBtn.className = 'action-btn success';
    buyBtn.textContent = `💰 ${t('buy')} (${formatMoney(state.pendingBuyCell?.price ?? 0)})`;
    buyBtn.onclick = () => handlers.onBuy && handlers.onBuy(onError);
    gameActions.appendChild(buyBtn);

    const skipBtn = document.createElement('button');
    skipBtn.className = 'action-btn neutral';
    skipBtn.textContent = 'Skip';
    skipBtn.onclick = () => handlers.onSkip && handlers.onSkip(onError);
    gameActions.appendChild(skipBtn);
  }

  if (canEnd && handlers.onEndTurn) {
    const btn = document.createElement('button');
    btn.className = 'action-btn secondary';
    btn.textContent = t('end_turn');
    btn.onclick = () => handlers.onEndTurn(onError);
    gameActions.appendChild(btn);
  }

  if (canJailPay && (handlers.onJailPay || handlers.onJailWait)) {
    const payBtn = document.createElement('button');
    payBtn.className = 'action-btn success';
    payBtn.textContent = t('pay_50');
    payBtn.onclick = () => handlers.onJailPay && handlers.onJailPay(onError);
    gameActions.appendChild(payBtn);

    const waitBtn = document.createElement('button');
    waitBtn.className = 'action-btn neutral';
    waitBtn.textContent = t('wait');
    waitBtn.onclick = () => handlers.onJailWait && handlers.onJailWait(onError);
    gameActions.appendChild(waitBtn);
  }

  if (state.landedCell && state.pendingAction === 'buy' && isMyTurn) {
    showPropertyModal(state.landedCell, state.pendingBuyCell);
  }
  /* Карточка Chance/Community Chest — только у того, кто бросил */
  if (state.drawnCard && isMyTurn) {
    showCardModal(state.drawnCard);
  }
}

/**
 * Show property modal — крупное фото карточки, описание, цена/действия
 */
export function showPropertyModal(cell, buyInfo) {
  const modal = document.getElementById('propertyModal');
  const title = document.getElementById('propertyModalTitle');
  const img = document.getElementById('propertyModalImage');
  const desc = document.getElementById('propertyModalDescription');
  const content = document.getElementById('propertyModalContent');

  if (!modal || !title || !content) return;

  const display = getCellDisplay(cell.index);
  title.textContent = display.name;
  if (img) {
    img.src = getCardImageUrl(cell);
    img.onerror = function () {
      const type = (cell && cell.type) ? cell.type : 'default';
      const known = ['go', 'street', 'chance', 'community_chest', 'tax', 'railroad', 'jail', 'utility', 'free_parking', 'go_to_jail'];
      const file = known.includes(type) ? type : 'default';
      this.src = `/images/cards/${file}.svg`;
    };
    img.alt = cell.name;
  }
  if (desc) {
    desc.textContent = display.description || (cell.type === 'street' ? t('property') : cell.type);
  }
  content.innerHTML = '';
  if (buyInfo && (buyInfo.price || buyInfo.amount)) {
    const price = buyInfo.price ?? buyInfo.amount ?? 0;
    content.innerHTML += `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>${t('price')}:</span>
        <strong style="color: var(--accent-gold);">${formatMoney(price)}</strong>
      </div>
    `;
  }
  if (cell.rent !== undefined && cell.rent > 0) {
    content.innerHTML += `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>${t('rent')}:</span>
        <strong>${formatMoney(cell.rent)}</strong>
      </div>
    `;
  }
  if (buyInfo && buyInfo.rent !== undefined && buyInfo.rent > 0) {
    content.innerHTML += `
      <div style="display: flex; justify-content: space-between;">
        <span>${t('rent')}:</span>
        <strong>${formatMoney(buyInfo.rent)}</strong>
      </div>
    `;
  }
  if (cell.type === 'tax' && cell.amount) {
    content.innerHTML += `
      <div class="card-modal-hint" style="margin-top: 8px;">
        ${t('tax_modal_hint')}
      </div>
    `;
  }
  if (cell.type === 'utility') {
    content.innerHTML += `
      <div class="card-modal-hint" style="margin-top: 8px;">
        ${t('utility_modal_hint')}
      </div>
    `;
  }
  if (cell.type === 'railroad') {
    content.innerHTML += `
      <div class="card-modal-hint" style="margin-top: 8px;">
        ${t('railroad_modal_hint')}
      </div>
    `;
  }
  if (!content.innerHTML.trim()) {
    content.innerHTML = `<p class="card-modal-hint" style="margin: 0;">${t('no_purchase')}</p>`;
  }

  showModal('propertyModal');
}

/**
 * Show card modal with flip animation
 */
export function showCardModal(card) {
  const modal = document.getElementById('cardModal');
  const flip = document.getElementById('cardFlip');
  const typeEl = document.getElementById('cardModalType');
  const title = document.getElementById('cardModalTitle');
  const text = document.getElementById('cardModalText');

  if (!modal || !flip || !typeEl || !title || !text) return;

  const isChance = card.type === 'chance';
  typeEl.textContent = isChance ? t('chance') : t('community_chest');
  title.textContent = card.title || (isChance ? t('chance') : t('community_chest'));
  text.textContent = getCardText(card.id, card.text || '');

  flip.classList.remove('flipped');
  showModal('cardModal');

  setTimeout(() => {
    flip.classList.add('flipped');
  }, 500);
}
