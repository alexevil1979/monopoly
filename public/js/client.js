/**
 * Monopoly Online — Premium Client
 * Enhanced UI with animations, circular board, and modern design
 */

import {
  TOKEN_ICONS,
  TOKEN_COLORS,
  getPlayerToken,
  formatMoney,
  getInitials,
  createMoneyParticle,
  createConfetti,
  shakeElement,
  showLoading,
  showReconnect,
  getCellPosition,
  animateTokenMovement,
  animateDiceRoll,
  getDiceEmoji,
  addEventToLog,
  showModal,
  hideModal,
  setupModalClose,
} from './utils.js';

const BOARD_CELLS = [
  { index: 0, type: 'go', name: 'Go', description: 'Collect $200 salary as you pass. Start of the board.' },
  { index: 1, type: 'street', name: 'Mediterranean Ave', color: 'brown', price: 60, rent: 6, description: 'Brown set. Lowest rent. Build houses and hotel.' },
  { index: 2, type: 'community_chest', name: 'Community Chest', description: 'Draw a card. Follow the instructions (pay, receive, or move).' },
  { index: 3, type: 'street', name: 'Baltic Ave', color: 'brown', price: 60, rent: 6, description: 'Brown set. Complete the set to double the rent.' },
  { index: 4, type: 'tax', name: 'Income Tax', amount: 200, description: 'Pay $200 or 10% of your total assets (cash, property, buildings).' },
  { index: 5, type: 'railroad', name: 'Reading Railroad', price: 200, rent: 25, description: 'Rent: $25 (1), $50 (2), $100 (3), $200 (4 railroads).' },
  { index: 6, type: 'street', name: 'Oriental Ave', color: 'lightblue', price: 100, rent: 10, description: 'Light Blue set. Rent $10. Build to increase rent.' },
  { index: 7, type: 'chance', name: 'Chance', description: 'Draw a Chance card. Advance, pay, receive money, or go to Jail.' },
  { index: 8, type: 'street', name: 'Vermont Ave', color: 'lightblue', price: 100, rent: 10, description: 'Light Blue set. Complete the color set for bonuses.' },
  { index: 9, type: 'jail', name: 'Jail', description: 'Just visiting — no penalty. Or you are in jail (wait or pay $50).' },
  { index: 10, type: 'street', name: 'St. Charles Place', color: 'pink', price: 140, rent: 14, description: 'Pink set. Rent $14. Good for building.' },
  { index: 11, type: 'utility', name: 'Electric Company', price: 150, description: 'Rent: 4× dice roll (one utility) or 10× (both utilities).' },
  { index: 12, type: 'street', name: 'States Ave', color: 'pink', price: 140, rent: 14, description: 'Pink set. Rent $14.' },
  { index: 13, type: 'railroad', name: 'Pennsylvania Railroad', price: 200, rent: 25, description: 'Second railroad. Same rent scale as Reading.' },
  { index: 14, type: 'chance', name: 'Chance', description: 'Draw a Chance card.' },
  { index: 15, type: 'street', name: 'Tennessee Ave', color: 'orange', price: 180, rent: 18, description: 'Orange set. Rent $18. Often landed on.' },
  { index: 16, type: 'community_chest', name: 'Community Chest', description: 'Draw a Community Chest card.' },
  { index: 17, type: 'street', name: 'New York Ave', color: 'orange', price: 200, rent: 20, description: 'Orange set. Rent $20. Highest in the set.' },
  { index: 18, type: 'free_parking', name: 'Free Parking', description: 'Free rest. Sometimes house rule: collect the tax pool here.' },
  { index: 19, type: 'go_to_jail', name: 'Go to Jail', description: 'Go directly to Jail. Do not pass Go. Do not collect $200.' },
];

/** URL карточки клетки (локальные изображения в public/images/cards/) */
function getCardImageUrl(cell) {
  const type = (cell && cell.type) ? cell.type : 'default';
  const known = ['go', 'street', 'chance', 'community_chest', 'tax', 'railroad', 'jail', 'utility', 'free_parking', 'go_to_jail'];
  const file = known.includes(type) ? type : 'default';
  return `/images/cards/${file}.svg`;
}

const TOTAL_CELLS = BOARD_CELLS.length;
const BOARD_RADIUS = 350; // pixels from center

const socket = window.io
  ? window.io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
  : null;

let state = null;
let myId = null;
let previousPlayerPositions = {}; // Track positions for animations
let previousPlayerMoney = {}; // Track money for animations

// DOM Elements
const lobbyScreen = document.getElementById('lobbyScreen');
const roomScreen = document.getElementById('roomScreen');
const gameScreen = document.getElementById('gameScreen');
const roomCodeEl = document.getElementById('roomCode');
const playersList = document.getElementById('playersList');
const playersPanel = document.getElementById('playersPanel');
const boardEl = document.getElementById('board');
const gameStatus = document.getElementById('gameStatus');
const gameActions = document.getElementById('gameActions');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const diceContainer = document.getElementById('diceContainer');
const dice1 = document.getElementById('dice1');
const dice2 = document.getElementById('dice2');
const chatContainer = document.getElementById('chatContainer');
const chatToggle = document.getElementById('chatToggle');

// Hall theme (оформление зала): America 50s по умолчанию, сохранение в localStorage
const HALL_THEME_KEY = 'monopolyHallTheme';
const HALL_THEMES = ['america50', 'classic', 'artdeco', 'scandinavian', 'wood', 'neon'];

function getHallTheme() {
  const saved = localStorage.getItem(HALL_THEME_KEY);
  return HALL_THEMES.includes(saved) ? saved : 'america50';
}

function setHallTheme(theme) {
  if (!HALL_THEMES.includes(theme)) return;
  document.body.setAttribute('data-hall-theme', theme);
  localStorage.setItem(HALL_THEME_KEY, theme);
  document.querySelectorAll('.theme-picker-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-hall-theme') === theme);
  });
}

(function initHallTheme() {
  const initial = getHallTheme();
  document.body.setAttribute('data-hall-theme', initial);
  document.querySelectorAll('.theme-picker-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-hall-theme') === initial);
    btn.addEventListener('click', () => setHallTheme(btn.getAttribute('data-hall-theme')));
  });
})();

// Theme Toggle (светлая/тёмная)
const themeToggle = document.getElementById('themeToggle');
let isDarkTheme = true;

themeToggle?.addEventListener('click', () => {
  isDarkTheme = !isDarkTheme;
  document.documentElement.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  
  const svg = themeToggle.querySelector('svg');
  if (svg) {
    if (isDarkTheme) {
      svg.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
      `;
    } else {
      svg.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    }
  }
});

// Chat Toggle
let chatCollapsed = false;
chatToggle?.addEventListener('click', () => {
  chatCollapsed = !chatCollapsed;
  chatContainer.classList.toggle('collapsed', chatCollapsed);
  chatToggle.textContent = chatCollapsed ? '+' : '−';
});

// Setup modals
setupModalClose('propertyModal');
setupModalClose('cardModal');
setupModalClose('bankruptModal');
setupModalClose('winModal');

function showScreen(screen) {
  lobbyScreen?.classList.remove('active');
  roomScreen?.classList.remove('active');
  gameScreen?.classList.remove('active');
  screen?.classList.add('active');
  // Скрыть лобби/комнату полностью и убрать лог событий во время игры
  document.body.classList.toggle('in-game', screen === gameScreen);
}

/**
 * Render circular board with cells
 */
function renderBoard(properties = {}) {
  if (!boardEl) return;
  
  boardEl.innerHTML = '';
  
  BOARD_CELLS.forEach((cell, idx) => {
    const cellDiv = document.createElement('div');
    cellDiv.className = 'board-cell';
    cellDiv.dataset.index = cell.index;
    cellDiv.dataset.type = cell.type;
    if (cell.color) cellDiv.dataset.color = cell.color;
    
    const card = document.createElement('div');
    card.className = 'cell-card';
    card.dataset.type = cell.type;
    if (cell.color) card.dataset.color = cell.color;
    if (properties[cell.index]) card.classList.add('owned');
    
    const name = document.createElement('div');
    name.className = 'cell-name';
    name.textContent = cell.name;
    
    const price = document.createElement('div');
    price.className = 'cell-price';
    if (cell.price) {
      price.textContent = formatMoney(cell.price);
    }
    
    const tokens = document.createElement('div');
    tokens.className = 'cell-tokens';
    tokens.id = `cell-tokens-${cell.index}`;
    
    card.appendChild(name);
    if (cell.price) card.appendChild(price);
    card.appendChild(tokens);
    cellDiv.appendChild(card);
    boardEl.appendChild(cellDiv);
  });
  
  // Render player tokens
  if (state?.players) {
    renderPlayerTokens();
  }
}

/**
 * Render player tokens on board
 */
function renderPlayerTokens() {
  if (!state?.players) return;
  
  // Remove old tokens
  document.querySelectorAll('.player-token').forEach((el) => el.remove());
  
  const boardCircle = document.querySelector('.board-circle');
  if (!boardCircle) return;
  
  state.players.forEach((player, idx) => {
    if (player.bankrupt) return;
    
    const token = getPlayerToken(idx);
    const pos = getCellPosition(player.position || 0, TOTAL_CELLS, BOARD_RADIUS);
    
    const tokenEl = document.createElement('div');
    tokenEl.className = 'player-token';
    tokenEl.id = `token-${player.id}`;
    tokenEl.textContent = token.icon;
    tokenEl.style.backgroundColor = token.color;
    tokenEl.style.borderColor = token.color;
    tokenEl.style.left = `calc(50% + ${pos.x}px)`;
    tokenEl.style.top = `calc(50% + ${pos.y}px)`;
    tokenEl.title = player.name;
    
    boardCircle.appendChild(tokenEl);
    
    // Animate if position changed
    if (previousPlayerPositions[player.id] !== undefined && 
        previousPlayerPositions[player.id] !== player.position) {
      animateTokenMovement(
        tokenEl,
        previousPlayerPositions[player.id],
        player.position,
        TOTAL_CELLS,
        BOARD_RADIUS
      );
    }
    
    previousPlayerPositions[player.id] = player.position;
  });
}

/**
 * Render players panel
 */
function renderPlayers(players, currentIndex, isGame) {
  const list = isGame ? playersPanel : playersList;
  if (!list) return;
  
  list.innerHTML = '';
  
  (players || []).forEach((p, i) => {
    const card = document.createElement('div');
    card.className = 'player-card';
    if (i === currentIndex) card.classList.add('current');
    if (p.bankrupt) card.classList.add('bankrupt');
    
    const token = getPlayerToken(i);
    const initials = getInitials(p.name);
    
    // Header with avatar and name
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
    
    // Animate money changes
    if (previousPlayerMoney[p.id] !== undefined && 
        previousPlayerMoney[p.id] !== p.money) {
      const diff = p.money - previousPlayerMoney[p.id];
      money.classList.add(diff > 0 ? 'positive' : 'negative');
      setTimeout(() => {
        money.classList.remove('positive', 'negative');
      }, 500);
    }
    
    info.appendChild(name);
    info.appendChild(money);
    header.appendChild(avatar);
    header.appendChild(info);
    
    // Properties (only in game)
    if (isGame) {
      const properties = document.createElement('div');
      properties.className = 'player-properties';
      
      // Get player's properties
      const playerProperties = Object.entries(state.properties || {})
        .filter(([_, ownerId]) => ownerId === p.id)
        .map(([cellIdx]) => BOARD_CELLS[parseInt(cellIdx)]);
      
      if (playerProperties.length > 0) {
        playerProperties.forEach((prop) => {
          if (prop.type === 'street') {
            const chip = document.createElement('div');
            chip.className = 'property-chip';
            chip.dataset.color = prop.color;
            chip.textContent = prop.name.split(' ')[0]; // Short name
            properties.appendChild(chip);
          }
        });
      } else {
        const noProps = document.createElement('div');
        noProps.style.color = 'var(--text-muted)';
        noProps.style.fontSize = '0.8rem';
        noProps.textContent = 'No properties';
        properties.appendChild(noProps);
      }
      
      // Status
      const status = document.createElement('div');
      status.className = 'player-status';
      if (p.inJail) {
        status.innerHTML = '🔒 In Jail';
      }
      if (p.lastDice?.[0]) {
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
    previousPlayerMoney[p.id] = p.money;
  });
}

/**
 * Update game UI
 */
function updateGameUI() {
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
  
  // Update status
  let statusText = '';
  let statusClass = 'waiting';
  
  if (state.phase === 'finished') {
    statusText = state.winnerId === myId ? '🎉 You Win!' : 'Game Over';
    statusClass = '';
    if (state.winnerId === myId) {
      createConfetti(100);
      showModal('winModal');
      const winText = document.getElementById('winModalText');
      if (winText) {
        const winner = state.players.find((p) => p.id === state.winnerId);
        winText.textContent = winner ? `Congratulations ${winner.name}! You won!` : 'Congratulations! You won!';
      }
    }
  } else if (state.landedCell) {
    statusText = `Landed on: ${state.landedCell.name}`;
    statusClass = '';
  } else if (state.drawnCard) {
    statusText = `Card: ${state.drawnCard.text}`;
    statusClass = '';
  } else if (isMyTurn) {
    statusText = 'Your Turn!';
    statusClass = 'your-turn';
  } else if (current) {
    statusText = `Waiting for ${current.name}...`;
    statusClass = 'waiting';
  }
  
  if (gameStatus) {
    gameStatus.textContent = statusText;
    gameStatus.className = `hud-status ${statusClass}`;
  }
  
  // Show dice if rolled
  if (current?.lastDice?.[0]) {
    if (diceContainer) diceContainer.style.display = 'flex';
    if (dice1) animateDiceRoll(dice1, current.lastDice[0]);
    if (dice2) animateDiceRoll(dice2, current.lastDice[1]);
  } else {
    if (diceContainer) diceContainer.style.display = 'none';
  }
  
  // Render actions
  if (!gameActions) return;
  gameActions.innerHTML = '';
  
  if (state.phase === 'finished') return;
  
  if (canRoll) {
    const btn = document.createElement('button');
    btn.className = 'action-btn primary';
    btn.textContent = '🎲 Roll Dice';
    btn.onclick = () => {
      btn.disabled = true;
      socket.emit('roll', null, (res) => {
        if (res?.error) {
          if (gameStatus) gameStatus.textContent = res.error;
          btn.disabled = false;
        }
      });
    };
    gameActions.appendChild(btn);
  }
  
  if (canBuy) {
    const buyBtn = document.createElement('button');
    buyBtn.className = 'action-btn success';
    buyBtn.textContent = `💰 Buy (${formatMoney(state.pendingBuyCell?.price ?? 0)})`;
    buyBtn.onclick = () => {
      socket.emit('buy', null, (res) => {
        if (res?.error && gameStatus) gameStatus.textContent = res.error;
      });
    };
    gameActions.appendChild(buyBtn);
    
    const skipBtn = document.createElement('button');
    skipBtn.className = 'action-btn neutral';
    skipBtn.textContent = 'Skip';
    skipBtn.onclick = () => {
      socket.emit('skip_buy', null, (res) => {
        if (res?.error && gameStatus) gameStatus.textContent = res.error;
      });
    };
    gameActions.appendChild(skipBtn);
  }
  
  if (canEnd) {
    const btn = document.createElement('button');
    btn.className = 'action-btn secondary';
    btn.textContent = 'End Turn';
    btn.onclick = () => {
      socket.emit('end_turn', null, (res) => {
        if (res?.error && gameStatus) gameStatus.textContent = res.error;
      });
    };
    gameActions.appendChild(btn);
  }
  
  if (canJailPay) {
    const payBtn = document.createElement('button');
    payBtn.className = 'action-btn success';
    payBtn.textContent = 'Pay $50';
    payBtn.onclick = () => {
      socket.emit('jail_pay', null, (res) => {
        if (res?.error && gameStatus) gameStatus.textContent = res.error;
      });
    };
    gameActions.appendChild(payBtn);
    
    const waitBtn = document.createElement('button');
    waitBtn.className = 'action-btn neutral';
    waitBtn.textContent = 'Wait';
    waitBtn.onclick = () => {
      socket.emit('jail_wait', null, (res) => {
        if (res?.error && gameStatus) gameStatus.textContent = res.error;
      });
    };
    gameActions.appendChild(waitBtn);
  }
  
  // Show property modal if landed on property
  if (state.landedCell && state.pendingAction === 'buy') {
    showPropertyModal(state.landedCell, state.pendingBuyCell);
  }
  
  // Show card modal if card drawn
  if (state.drawnCard) {
    showCardModal(state.drawnCard);
  }
}

/**
 * Show property modal — крупное фото карточки, описание, цена/действия
 */
function showPropertyModal(cell, buyInfo) {
  const modal = document.getElementById('propertyModal');
  const title = document.getElementById('propertyModalTitle');
  const img = document.getElementById('propertyModalImage');
  const desc = document.getElementById('propertyModalDescription');
  const content = document.getElementById('propertyModalContent');
  
  if (!modal || !title || !content) return;
  
  title.textContent = cell.name;
  if (img) {
    img.src = getCardImageUrl(cell);
    img.alt = cell.name;
  }
  if (desc) {
    desc.textContent = cell.description || (cell.type === 'street' ? 'Property. Buy to collect rent.' : cell.type);
  }
  content.innerHTML = '';
  if (buyInfo && (buyInfo.price || buyInfo.amount)) {
    const price = buyInfo.price ?? buyInfo.amount ?? 0;
    content.innerHTML += `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Price:</span>
        <strong style="color: var(--accent-gold);">${formatMoney(price)}</strong>
      </div>
    `;
  }
  if (cell.rent !== undefined && cell.rent > 0) {
    content.innerHTML += `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
        <span>Rent:</span>
        <strong>${formatMoney(cell.rent)}</strong>
      </div>
    `;
  }
  if (buyInfo && buyInfo.rent !== undefined && buyInfo.rent > 0) {
    content.innerHTML += `
      <div style="display: flex; justify-content: space-between;">
        <span>Rent:</span>
        <strong>${formatMoney(buyInfo.rent)}</strong>
      </div>
    `;
  }
  if (cell.type === 'tax' && cell.amount) {
    content.innerHTML += `
      <div style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary);">
        Pay $200 or 10% of total assets.
      </div>
    `;
  }
  if (cell.type === 'utility') {
    content.innerHTML += `
      <div style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary);">
        Rent: 4× dice (one utility) or 10× (both).
      </div>
    `;
  }
  if (cell.type === 'railroad') {
    content.innerHTML += `
      <div style="margin-top: 8px; font-size: 0.9rem; color: var(--text-secondary);">
        Rent: $25 / $50 / $100 / $200 (by number of railroads owned).
      </div>
    `;
  }
  if (!content.innerHTML.trim()) {
    content.innerHTML = '<p style="color: var(--text-muted); margin: 0;">No purchase. Follow the cell rule.</p>';
  }
  
  showModal('propertyModal');
}

/**
 * Show card modal with flip animation
 */
function showCardModal(card) {
  const modal = document.getElementById('cardModal');
  const flip = document.getElementById('cardFlip');
  const type = document.getElementById('cardModalType');
  const title = document.getElementById('cardModalTitle');
  const text = document.getElementById('cardModalText');
  
  if (!modal || !flip || !type || !title || !text) return;
  
  const isChance = card.type === 'chance';
  type.textContent = isChance ? 'Chance' : 'Community Chest';
  title.textContent = card.title || (isChance ? 'Chance' : 'Community Chest');
  text.textContent = card.text || '';
  
  flip.classList.remove('flipped');
  showModal('cardModal');
  
  // Auto-flip after a moment
  setTimeout(() => {
    flip.classList.add('flipped');
  }, 500);
}

/**
 * Get emoji for cell type
 */
function getCellEmoji(type) {
  const emojis = {
    go: '🏁',
    jail: '🔒',
    free_parking: '🅿️',
    go_to_jail: '👮',
    tax: '💰',
    chance: '❓',
    community_chest: '📦',
    street: '🏠',
    railroad: '🚂',
    utility: '⚡',
  };
  return emojis[type] || '📍';
}

/**
 * Apply game state
 */
function applyState(newState) {
  const oldPhase = state?.phase;
  state = newState;
  
  if (!state) return;
  
  if (state.phase === 'lobby') {
    showScreen(roomScreen);
    if (roomCodeEl) roomCodeEl.textContent = state.code;
    renderPlayers(state.players, null, false);
    
    const statusEl = document.getElementById('roomStatus');
    if (statusEl) {
      statusEl.textContent =
        state.players.every((p) => p.ready) && state.players.length >= 2
          ? 'All ready! Game will start when host starts.'
          : 'Waiting for players. Click "I\'m ready" when everyone has joined.';
    }
  } else if (state.phase === 'playing' || state.phase === 'finished') {
    if (oldPhase !== 'playing' && oldPhase !== 'finished') {
      showScreen(gameScreen);
      addEventToLog('Game started!', 'info');
    }
    renderBoard(state.properties);
    updateGameUI();
  }
}

// Socket.IO Events
if (socket) {
  socket.on('connect', () => {
    myId = socket.id;
    showLoading(false);
    showReconnect(false);
    addEventToLog('Connected to server', 'success');
    
    if (state?.code) {
      socket.emit('sync_state', null, (res) => {
        if (res?.ok && res.state) {
          applyState(res.state);
        }
      });
    }
  });
  
  socket.on('disconnect', () => {
    showReconnect(true);
    addEventToLog('Disconnected. Reconnecting...', 'warning');
  });
  
  socket.on('connect_error', () => {
    showLoading(true);
  });
  
  socket.on('room_state', (newState) => {
    applyState(newState);
  });
  
  socket.on('game_started', (newState) => {
    applyState(newState);
    createConfetti(30);
    addEventToLog('Game started!', 'success');
  });
  
  socket.on('game_ended', (newState) => {
    applyState(newState);
  });
  
  socket.on('player_moved', (data) => {
    addEventToLog(`${data.playerName} moved to ${data.cellName}`, 'info');
    // Re-render to show new positions
    if (state) {
      setTimeout(() => {
        renderPlayerTokens();
      }, 100);
    }
  });
  
  socket.on('property_purchased', (data) => {
    addEventToLog(`${data.playerName} bought ${data.propertyName}`, 'success');
    if (state) {
      renderBoard(state.properties);
    }
  });
  
  socket.on('money_transfer', (data) => {
    addEventToLog(
      `${data.from} paid ${formatMoney(data.amount)} to ${data.to}`,
      'info'
    );
  });
  
  socket.on('player_bankrupt', (data) => {
    addEventToLog(`${data.playerName} went bankrupt!`, 'warning');
    if (data.playerId === myId) {
      showModal('bankruptModal');
      const text = document.getElementById('bankruptModalText');
      if (text) {
        text.textContent = `You have gone bankrupt! ${data.reason || ''}`;
      }
    }
    shakeElement(document.body);
  });
  
  socket.on('chat', (msg) => {
    if (!chatLog) return;
    
    const li = document.createElement('div');
    li.className = 'chat-message';
    const sender = document.createElement('span');
    sender.className = 'sender';
    sender.textContent = `${msg.name}: `;
    li.appendChild(sender);
    li.appendChild(document.createTextNode(msg.text));
    
    chatLog.appendChild(li);
    chatLog.scrollTop = chatLog.scrollHeight;
    
    // Keep only last 50 messages
    while (chatLog.children.length > 50) {
      chatLog.removeChild(chatLog.firstChild);
    }
  });
} else {
  const errorEl = document.getElementById('lobbyError');
  if (errorEl) {
    errorEl.textContent = 'Socket.IO not loaded.';
    errorEl.style.display = 'block';
  }
}

// Lobby Events
document.getElementById('btnCreate')?.addEventListener('click', () => {
  const name = document.getElementById('playerName')?.value.trim() || 'Player';
  showLoading(true);
  socket.emit('create_room', name, (res) => {
    showLoading(false);
    const errorEl = document.getElementById('lobbyError');
    if (res?.ok) {
      applyState(res.state);
      if (errorEl) errorEl.style.display = 'none';
    } else {
      if (errorEl) {
        errorEl.textContent = res?.error || 'Failed to create room';
        errorEl.style.display = 'block';
      }
    }
  });
});

document.getElementById('btnJoin')?.addEventListener('click', () => {
  const code = document.getElementById('joinCode')?.value.trim().toUpperCase().slice(0, 6);
  const name = document.getElementById('playerName')?.value.trim() || 'Player';
  const errorEl = document.getElementById('lobbyError');
  
  if (!code) {
    if (errorEl) {
      errorEl.textContent = 'Enter room code';
      errorEl.style.display = 'block';
    }
    return;
  }
  
  showLoading(true);
  socket.emit('join_room', { code, name }, (res) => {
    showLoading(false);
    if (res?.ok) {
      applyState(res.state);
      if (errorEl) errorEl.style.display = 'none';
    } else {
      if (errorEl) {
        errorEl.textContent = res?.error || 'Cannot join room';
        errorEl.style.display = 'block';
      }
    }
  });
});

document.getElementById('btnReady')?.addEventListener('click', () => {
  socket.emit('set_ready', null, (res) => {
    const errorEl = document.getElementById('roomError');
    if (res?.ok) {
      applyState(res.state);
      if (errorEl) errorEl.style.display = 'none';
    } else {
      if (errorEl) {
        errorEl.textContent = res?.error || 'Cannot set ready';
        errorEl.style.display = 'block';
      }
    }
  });
});

// Chat Input
chatInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const text = chatInput.value.trim();
    if (text && socket) {
      socket.emit('chat', text);
      chatInput.value = '';
    }
  }
});

// Initial render
renderBoard();
