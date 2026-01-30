/**
 * Monopoly Online — Premium Client
 * Entry point: Socket.IO, applyState, lobby/game handlers. UI and state in ui.js / gameState.js.
 */

import { getState, setState, setMyId, getMyId } from './gameState.js';
import { setLang, getLang, t, tParams } from './i18n.js';
import {
  showScreen,
  renderBoard,
  renderPlayerTokens,
  renderPlayers,
  updateGameUI,
} from './ui.js';
import {
  formatMoney,
  showLoading,
  showReconnect,
  addEventToLog,
  showModal,
  showToast,
  setupModalClose,
  createConfetti,
  shakeElement,
} from './utils.js';

const socket = window.io
  ? window.io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    })
  : null;

const roomScreen = document.getElementById('roomScreen');
const gameScreen = document.getElementById('gameScreen');
const roomCodeEl = document.getElementById('roomCode');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');

(function initI18n() {
  const stored = localStorage.getItem('monopolyLang');
  setLang(stored && ['en', 'ru', 'zh', 'hi', 'ar'].includes(stored) ? stored : 'en');
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = getLang();
    langSelect.addEventListener('change', () => setLang(langSelect.value));
  }
})();

function getActionHandlers() {
  if (!socket) return {};
  return {
    onRoll(cb) {
      socket.emit('roll', null, cb);
    },
    onBuy(cb) {
      socket.emit('buy', null, cb);
    },
    onSkip(cb) {
      socket.emit('skip_buy', null, cb);
    },
    onEndTurn(cb) {
      socket.emit('end_turn', null, cb);
    },
    onJailPay(cb) {
      socket.emit('jail_pay', null, cb);
    },
    onJailWait(cb) {
      socket.emit('jail_wait', null, cb);
    },
  };
}

const ROOM_STORAGE_KEY = 'monopolyRoomCode';
const NAME_STORAGE_KEY = 'monopolyPlayerName';

function saveRoomToStorage(state) {
  if (!state?.code || !state?.players) return;
  const me = state.players.find((p) => p.id === getMyId());
  if (me?.name) {
    try {
      localStorage.setItem(ROOM_STORAGE_KEY, state.code);
      localStorage.setItem(NAME_STORAGE_KEY, me.name);
    } catch (_) {}
  }
}

function clearRoomFromStorage() {
  try {
    localStorage.removeItem(ROOM_STORAGE_KEY);
    localStorage.removeItem(NAME_STORAGE_KEY);
  } catch (_) {}
}

function applyState(newState) {
  const oldPhase = getState()?.phase;
  setState(newState);
  const state = getState();
  if (!state) return;

  if (state.phase === 'lobby' || state.phase === 'playing' || state.phase === 'finished') {
    saveRoomToStorage(state);
  }

  if (state.phase === 'lobby') {
    showScreen(roomScreen);
    if (roomCodeEl) roomCodeEl.textContent = state.code;
    renderPlayers(state.players, null, false);

    const statusEl = document.getElementById('roomStatus');
    if (statusEl) {
      statusEl.textContent =
        state.players.every((p) => p.ready) && state.players.length >= 2
          ? t('room_status_start')
          : t('room_status_wait');
    }
  } else if (state.phase === 'playing' || state.phase === 'finished') {
    if (oldPhase !== 'playing' && oldPhase !== 'finished') {
      showScreen(gameScreen);
      addEventToLog('Game started!', 'info');
    }
    renderBoard(state.properties);
    renderPlayerTokens();
    updateGameUI(getActionHandlers());
  }
}

// Theme toggle, hall theme, chat toggle, modals (unchanged from original)
const HALL_THEME_KEY = 'monopolyHallTheme';
const HALL_THEMES = ['america50', 'classic', 'artdeco', 'scandinavian', 'wood', 'neon', 'luxury'];

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

function copyRoomCodeToClipboard() {
  const code = roomCodeEl?.textContent?.trim();
  if (!code) return;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(code).then(() => showToast(t('copied'), 'success')).catch(() => {});
  } else {
    const ta = document.createElement('textarea');
    ta.value = code;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      showToast(t('copied'), 'success');
    } catch (_) {}
    document.body.removeChild(ta);
    ta.remove();
  }
}

roomCodeEl?.addEventListener('click', copyRoomCodeToClipboard);
roomCodeEl?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    copyRoomCodeToClipboard();
  }
});

window.__onLangChange = () => {
  const state = getState();
  if (state?.phase === 'lobby') {
    const statusEl = document.getElementById('roomStatus');
    if (statusEl) {
      statusEl.textContent = state.players.every((p) => p.ready) && state.players.length >= 2 ? t('room_status_start') : t('room_status_wait');
    }
  } else if (state && (state.phase === 'playing' || state.phase === 'finished')) {
    renderBoard(state.properties);
    renderPlayerTokens();
    updateGameUI(getActionHandlers());
  }
};

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
      svg.innerHTML = `<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>`;
    }
  }
});

let chatCollapsed = false;
document.getElementById('chatToggle')?.addEventListener('click', () => {
  chatCollapsed = !chatCollapsed;
  document.getElementById('chatContainer')?.classList.toggle('collapsed', chatCollapsed);
  document.getElementById('chatToggle').textContent = chatCollapsed ? '+' : '−';
});

setupModalClose('propertyModal');
setupModalClose('cardModal');
setupModalClose('bankruptModal');
setupModalClose('winModal');

// Socket.IO
if (socket) {
  socket.on('connect', () => {
    setMyId(socket.id);
    showLoading(false);
    showReconnect(false);
    addEventToLog('Connected to server', 'success');

    if (getState()?.code) {
      socket.emit('sync_state', null, (res) => {
        if (res?.ok && res.state) applyState(res.state);
      });
      return;
    }

    const savedCode = localStorage.getItem(ROOM_STORAGE_KEY);
    const savedName = localStorage.getItem(NAME_STORAGE_KEY);
    if (savedCode && savedName) {
      const code = String(savedCode).trim().toUpperCase().slice(0, 6);
      showLoading(true);
      socket.emit('join_room', { code, name: String(savedName).trim() || 'Player' }, (res) => {
        showLoading(false);
        if (res?.ok && res.state) {
          applyState(res.state);
          showToast(t('rejoined_room'), 'success');
        } else {
          clearRoomFromStorage();
          if (res?.error) showToast(res.error, 'warning');
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
    const state = getState();
    if (state) setTimeout(() => renderPlayerTokens(), 100);
  });

  socket.on('property_purchased', (data) => {
    addEventToLog(`${data.playerName} bought ${data.propertyName}`, 'success');
    const state = getState();
    if (state) renderBoard(state.properties);
  });

  socket.on('money_transfer', (data) => {
    addEventToLog(`${data.from} paid ${formatMoney(data.amount)} to ${data.to}`, 'info');
  });

  socket.on('player_bankrupt', (data) => {
    addEventToLog(`${data.playerName} went bankrupt!`, 'warning');
    if (data.playerId === getMyId()) {
      showModal('bankruptModal');
      const text = document.getElementById('bankruptModalText');
      if (text) text.textContent = `${t('bankrupt_text')} ${data.reason || ''}`;
    }
    shakeElement(document.body);
  });

  socket.on('chat', (msg) => {
    if (!chatLog) return;

    const li = document.createElement('div');
    li.className = 'chat-message';
    if (msg.id === getMyId()) li.classList.add('mine');
    const sender = document.createElement('span');
    sender.className = 'sender';
    sender.textContent = `${msg.name}: `;
    li.appendChild(sender);
    li.appendChild(document.createTextNode(msg.text));

    chatLog.appendChild(li);
    chatLog.scrollTop = chatLog.scrollHeight;

    while (chatLog.children.length > 50) {
      chatLog.removeChild(chatLog.firstChild);
    }
  });
} else {
  const errorEl = document.getElementById('lobbyError');
  if (errorEl) {
    errorEl.textContent = t('error_socket');
    errorEl.style.display = 'block';
  }
  showToast('Socket.IO not loaded.', 'error');
}

// Lobby
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
      const err = res?.error || 'Failed to create room';
      showToast(err, 'error');
      if (errorEl) {
        errorEl.textContent = err;
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
    showToast(t('error_enter_code'), 'warning');
    if (errorEl) {
      errorEl.textContent = t('error_enter_code');
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
      const err = res?.error || 'Cannot join room';
      showToast(err, 'error');
      if (errorEl) {
        errorEl.textContent = err;
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
      const err = res?.error || 'Cannot set ready';
      showToast(err, 'error');
      if (errorEl) {
        errorEl.textContent = err;
        errorEl.style.display = 'block';
      }
    }
  });
});

chatInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const text = chatInput.value.trim();
    if (text && socket) {
      socket.emit('chat', text);
      chatInput.value = '';
    }
  }
});

renderBoard();
