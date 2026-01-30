/**
 * Game room: lobby + game state, turn logic, persistence to Redis.
 * Server-authoritative; all moves validated here.
 */
import { BOARD, getCell, getRent, CELL_TYPES } from './Board.js';
import { createPlayer, isBankrupt, isDisconnected, STARTING_MONEY } from './Player.js';
import { CHANCE_CARDS, COMMUNITY_CHEST_CARDS, shuffleCards, drawCard } from './cards.js';
import { saveRoomState, loadRoomState } from '../utils/redisClient.js';

const TOTAL_CELLS = 20;
const JAIL_POSITION = 9;
const GO_POSITION = 0;
const JAIL_BAIL = 50;
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 4;
/** Окно переподключения (мс): игрок может вернуться в уже идущую партию. */
const REJOIN_WINDOW_MS = 30 * 1000;

/** Generate 6-char room code. */
export function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/**
 * Create or load room state.
 * @param {string} code - Room code
 * @param {string} hostSocketId - Creator's socket id
 * @param {string} hostName - Creator's name
 */
export async function getOrCreateRoom(code, hostSocketId, hostName) {
  let state = await loadRoomState(code);
  if (state) return state;
  const player = createPlayer(hostSocketId, hostName);
  player.orderIndex = 0;
  state = {
    code,
    phase: 'lobby', // lobby | playing | finished
    players: [player],
    currentPlayerIndex: 0,
    properties: {}, // cellIndex -> ownerSocketId
    chanceDeck: shuffleCards([...CHANCE_CARDS]),
    communityChestDeck: shuffleCards([...COMMUNITY_CHEST_CARDS]),
    createdAt: Date.now(),
  };
  await saveRoomState(code, state);
  return state;
}

/**
 * Очистить игроков, у которых истекло окно переподключения (30 с).
 */
function cleanExpiredDisconnects(state) {
  const now = Date.now();
  for (const p of state.players) {
    if (p.disconnectedAt != null && now - p.disconnectedAt > REJOIN_WINDOW_MS) {
      p.bankrupt = true;
      p.money = -1;
      delete p.disconnectedAt;
    }
  }
  const alive = state.players.filter((p) => !isBankrupt(p));
  if (alive.length <= 1) {
    state.phase = 'finished';
    state.winnerId = alive[0]?.id ?? null;
    return;
  }
  while (isBankrupt(state.players[state.currentPlayerIndex])) {
    state.currentPlayerIndex = nextActivePlayerIndex(state);
    const next = state.players[state.currentPlayerIndex];
    state.pendingAction = next?.inJail ? 'jail_choice' : 'roll';
  }
}

/**
 * Индекс следующего активного игрока (не банкрот и не в окне отключения).
 */
function nextActivePlayerIndex(state) {
  const n = state.players.length;
  let next = (state.currentPlayerIndex + 1) % n;
  let steps = 0;
  while (steps < n) {
    const p = state.players[next];
    if (!isBankrupt(p) && !isDisconnected(p)) return next;
    next = (next + 1) % n;
    steps++;
  }
  return state.currentPlayerIndex;
}

/**
 * Join room. Returns updated state or null if full/invalid.
 * В фазе lobby — обычный вход. В фазе playing — только rejoin по имени в течение 30 с.
 */
export async function joinRoom(code, socketId, name) {
  const state = await loadRoomState(code);
  if (!state) return null;
  const normalizedName = String(name || 'Player').trim().slice(0, 20);

  if (state.phase === 'lobby') {
    if (state.players.some((p) => p.id === socketId)) return state;
    if (state.players.length >= MAX_PLAYERS) return null;
    const player = createPlayer(socketId, normalizedName);
    player.orderIndex = state.players.length;
    state.players.push(player);
    await saveRoomState(code, state);
    return state;
  }

  if (state.phase === 'playing') {
    cleanExpiredDisconnects(state);
    const player = state.players.find(
      (p) =>
        p.name === normalizedName &&
        p.disconnectedAt != null &&
        Date.now() - p.disconnectedAt <= REJOIN_WINDOW_MS
    );
    if (!player) return null;
    const oldId = player.id;
    player.id = socketId;
    delete player.disconnectedAt;
    for (const [cellIndex, ownerId] of Object.entries(state.properties)) {
      if (ownerId === oldId) state.properties[cellIndex] = socketId;
    }
    await saveRoomState(code, state);
    return state;
  }

  return null;
}

/**
 * Set ready. Start game when >= 2 players and all ready.
 */
export async function setReady(code, socketId) {
  const state = await loadRoomState(code);
  if (!state || state.phase !== 'lobby') return null;
  const player = state.players.find((p) => p.id === socketId);
  if (!player) return null;
  player.ready = true;
  const allReady = state.players.every((p) => p.ready);
  const canStart = state.players.length >= MIN_PLAYERS && allReady;
  if (canStart) {
    state.phase = 'playing';
    state.currentPlayerIndex = 0;
    const first = state.players[0];
    state.pendingAction = first.inJail ? 'jail_choice' : 'roll';
    state.lastDice = [0, 0];
  }
  await saveRoomState(code, state);
  return state;
}

/**
 * Leave room (disconnect).
 * В lobby — помечаем банкротом и удаляем из «живых».
 * В playing — не банкротим: ставим disconnectedAt; в течение 30 с игрок может rejoin.
 */
export async function leaveRoom(code, socketId) {
  const state = await loadRoomState(code);
  if (!state) return null;
  const idx = state.players.findIndex((p) => p.id === socketId);
  if (idx === -1) return state;

  if (state.phase === 'playing') {
    const player = state.players[idx];
    player.disconnectedAt = Date.now();
    if (state.currentPlayerIndex === idx) {
      state.currentPlayerIndex = nextActivePlayerIndex(state);
      const nextPlayer = state.players[state.currentPlayerIndex];
      state.pendingAction = nextPlayer?.inJail ? 'jail_choice' : 'roll';
    }
    await saveRoomState(code, state);
    return state;
  }

  state.players[idx].bankrupt = true;
  state.players[idx].money = -1;
  const alive = state.players.filter((p) => !isBankrupt(p));
  if (alive.length <= 1) {
    state.phase = 'finished';
    state.winnerId = alive[0]?.id ?? null;
  }
  await saveRoomState(code, state);
  return state;
}

/**
 * Roll dice (2d6). Validate: must be current player, pendingAction === 'roll'.
 * Apply move, landing action, doubles.
 */
export async function rollDice(code, socketId) {
  const state = await loadRoomState(code);
  if (!state || state.phase !== 'playing') return null;
  cleanExpiredDisconnects(state);
  if (state.phase === 'finished') {
    await saveRoomState(code, state);
    return state;
  }
  if (state.pendingAction !== 'roll') return null;
  const current = state.players[state.currentPlayerIndex];
  if (current.id !== socketId || current.bankrupt) return null;
  if (current.inJail) {
    // Must use jail_choice first (pay or wait)
    return null;
  }
  const d1 = 1 + Math.floor(Math.random() * 6);
  const d2 = 1 + Math.floor(Math.random() * 6);
  const sum = d1 + d2;
  const doubles = d1 === d2;
  current.lastDice = [d1, d2];
  state.lastDice = [d1, d2];
  if (doubles) current.doublesCount = (current.doublesCount || 0) + 1;
  else current.doublesCount = 0;

  if (current.doublesCount >= 3) {
    sendToJail(state, current);
    state.pendingAction = 'end_turn';
    await saveRoomState(code, state);
    return state;
  }

  current.position = (current.position + sum) % TOTAL_CELLS;
  const cell = getCell(current.position);
  state.landedCell = cell;
  state.landedCellIndex = current.position;

  // Pass Go
  if (current.position < (current.position - sum + TOTAL_CELLS) % TOTAL_CELLS && current.position !== GO_POSITION) {
    current.money += 200;
  }

  await applyLandingAction(state, current, cell, code);
  await saveRoomState(code, state);
  return state;
}

function sendToJail(state, player) {
  player.position = JAIL_POSITION;
  player.inJail = true;
  player.jailTurnsLeft = 3;
}

async function applyLandingAction(state, player, cell, code) {
  if (cell.type === CELL_TYPES.GO) {
    state.pendingAction = 'end_turn';
    return;
  }
  if (cell.type === CELL_TYPES.GO_TO_JAIL) {
    sendToJail(state, player);
    state.pendingAction = 'end_turn';
    return;
  }
  if (cell.type === CELL_TYPES.JAIL) {
    state.pendingAction = 'end_turn';
    return;
  }
  if (cell.type === CELL_TYPES.FREE_PARKING) {
    state.pendingAction = 'end_turn';
    return;
  }
  if (cell.type === CELL_TYPES.TAX) {
    const amount = cell.amount ?? 200;
    player.money -= amount;
    state.pendingAction = 'end_turn';
    return;
  }
  if (cell.type === CELL_TYPES.CHANCE) {
    const { card, deck } = drawCard(state.chanceDeck);
    state.chanceDeck = deck.length ? deck : shuffleCards([...CHANCE_CARDS]);
    applyCardEffect(state, player, card);
    state.drawnCard = card;
    state.pendingAction = 'end_turn';
    return;
  }
  if (cell.type === CELL_TYPES.COMMUNITY_CHEST) {
    const { card, deck } = drawCard(state.communityChestDeck);
    state.communityChestDeck = deck.length ? deck : shuffleCards([...COMMUNITY_CHEST_CARDS]);
    applyCardEffect(state, player, card);
    state.drawnCard = card;
    state.pendingAction = 'end_turn';
    return;
  }
  if (cell.type === CELL_TYPES.STREET || cell.type === CELL_TYPES.RAILROAD || cell.type === CELL_TYPES.UTILITY) {
    const ownerId = state.properties[cell.index];
    if (!ownerId) {
      state.pendingAction = 'buy';
      state.pendingBuyCell = cell;
      return;
    }
    if (ownerId === player.id) {
      state.pendingAction = 'end_turn';
      return;
    }
    const owner = state.players.find((p) => p.id === ownerId);
    if (!owner || owner.bankrupt) {
      state.pendingAction = 'end_turn';
      return;
    }
    let rent = getRent(cell, countOwned(state, ownerId, cell));
    if (cell.type === CELL_TYPES.UTILITY) {
      const diceSum = (player.lastDice[0] || 0) + (player.lastDice[1] || 0);
      const utilCount = countUtilities(state, ownerId);
      rent = utilCount === 2 ? diceSum * 10 : diceSum * 4;
    }
    player.money -= rent;
    owner.money += rent;
    state.pendingAction = 'end_turn';
    if (player.money < 0) player.bankrupt = true;
    return;
  }
  state.pendingAction = 'end_turn';
}

function countOwned(state, ownerId, cell) {
  if (cell.type === CELL_TYPES.STREET) {
    const color = cell.color;
    return Object.entries(state.properties).filter(([idx, id]) => id === ownerId && getCell(Number(idx)).color === color).length;
  }
  if (cell.type === CELL_TYPES.RAILROAD) {
    return Object.entries(state.properties).filter(([_, id]) => id === ownerId && getCell(Number(_)).type === CELL_TYPES.RAILROAD).length;
  }
  return 1;
}

function countUtilities(state, ownerId) {
  return Object.entries(state.properties).filter(([idx, id]) => id === ownerId && getCell(Number(idx)).type === CELL_TYPES.UTILITY).length;
}

function applyCardEffect(state, player, card) {
  if (!card) return;
  if (card.effect === 'advance_to_go') {
    player.position = GO_POSITION;
    player.money += 200;
  } else if (card.effect === 'go_to_jail') {
    sendToJail(state, player);
  } else if (card.effect === 'receive') {
    player.money += card.amount ?? 0;
  } else if (card.effect === 'pay') {
    player.money -= card.amount ?? 0;
    if (player.money < 0) player.bankrupt = true;
  } else if (card.effect === 'get_out_of_jail_free') {
    player.getOutOfJailFree = (player.getOutOfJailFree || 0) + 1;
  }
}

/**
 * Buy property. Only when pendingAction === 'buy' and cell matches.
 */
export async function buyProperty(code, socketId) {
  const state = await loadRoomState(code);
  if (!state || state.phase !== 'playing') return null;
  cleanExpiredDisconnects(state);
  if (state.phase === 'finished') return state;
  if (state.pendingAction !== 'buy') return null;
  const current = state.players[state.currentPlayerIndex];
  if (current.id !== socketId || current.bankrupt) return null;
  const cell = state.pendingBuyCell;
  if (!cell || state.properties[cell.index]) return null;
  if (current.money < cell.price) return null;
  current.money -= cell.price;
  state.properties[cell.index] = socketId;
  state.pendingAction = 'end_turn';
  state.pendingBuyCell = null;
  await saveRoomState(code, state);
  return state;
}

/**
 * Skip buy (don't buy). Moves to end_turn.
 */
export async function skipBuy(code, socketId) {
  const state = await loadRoomState(code);
  if (!state || state.phase !== 'playing') return null;
  cleanExpiredDisconnects(state);
  if (state.phase === 'finished') return state;
  if (state.pendingAction !== 'buy') return null;
  const current = state.players[state.currentPlayerIndex];
  if (current.id !== socketId) return null;
  state.pendingAction = 'end_turn';
  state.pendingBuyCell = null;
  await saveRoomState(code, state);
  return state;
}

/**
 * Jail choice: pay $50 or wait (use turn).
 */
export async function jailChoice(code, socketId, pay) {
  const state = await loadRoomState(code);
  if (!state || state.phase !== 'playing') return null;
  cleanExpiredDisconnects(state);
  if (state.phase === 'finished') return null;
  const current = state.players[state.currentPlayerIndex];
  if (current.id !== socketId || !current.inJail) return null;
  state.pendingAction = state.pendingAction || 'jail_choice';
  if (pay) {
    if (current.getOutOfJailFree > 0) {
      current.getOutOfJailFree -= 1;
    } else if (current.money >= JAIL_BAIL) {
      current.money -= JAIL_BAIL;
    } else {
      return null;
    }
    current.inJail = false;
    current.jailTurnsLeft = 0;
    state.pendingAction = 'roll';
  } else {
    current.jailTurnsLeft -= 1;
    if (current.jailTurnsLeft <= 0) {
      current.inJail = false;
      state.pendingAction = 'roll';
    } else {
      state.pendingAction = 'end_turn';
    }
  }
  await saveRoomState(code, state);
  return state;
}

/**
 * End turn. Next player; if was doubles, same player rolls again.
 */
export async function endTurn(code, socketId) {
  const state = await loadRoomState(code);
  if (!state || state.phase !== 'playing') return null;
  cleanExpiredDisconnects(state);
  if (state.phase === 'finished') {
    await saveRoomState(code, state);
    return state;
  }
  if (state.pendingAction !== 'end_turn') return null;
  const current = state.players[state.currentPlayerIndex];
  if (current.id !== socketId) return null;
  const hadDoubles = (current.lastDice[0] === current.lastDice[1]) && current.lastDice[0];
  if (hadDoubles && current.doublesCount < 3) {
    state.pendingAction = 'roll';
    await saveRoomState(code, state);
    return state;
  }
  current.doublesCount = 0;
  let next = (state.currentPlayerIndex + 1) % state.players.length;
  while (isBankrupt(state.players[next])) {
    next = (next + 1) % state.players.length;
  }
  state.currentPlayerIndex = next;
  const nextPlayer = state.players[next];
  if (nextPlayer.inJail) {
    state.pendingAction = 'jail_choice';
  } else {
    state.pendingAction = 'roll';
  }
  state.drawnCard = null;
  state.landedCell = null;
  const aliveCount = state.players.filter((p) => !isBankrupt(p)).length;
  if (aliveCount <= 1) {
    state.phase = 'finished';
    state.winnerId = state.players.find((p) => !isBankrupt(p))?.id ?? null;
  }
  await saveRoomState(code, state);
  return state;
}

/**
 * Sync state for reconnect: return public state (no internal fields).
 */
export function getPublicState(state) {
  if (!state) return null;
  return {
    code: state.code,
    phase: state.phase,
    players: state.players.map((p) => ({
      id: p.id,
      name: p.name,
      money: p.money,
      position: p.position,
      inJail: p.inJail,
      jailTurnsLeft: p.jailTurnsLeft,
      ready: p.ready,
      bankrupt: p.bankrupt,
      orderIndex: p.orderIndex,
      lastDice: p.lastDice,
      disconnectedAt: p.disconnectedAt ?? null,
    })),
    currentPlayerIndex: state.currentPlayerIndex,
    properties: { ...state.properties },
    pendingAction: state.pendingAction,
    pendingBuyCell: state.pendingBuyCell || null,
    lastDice: state.lastDice,
    landedCell: state.landedCell || null,
    landedCellIndex: state.landedCellIndex,
    drawnCard: state.drawnCard || null,
    winnerId: state.winnerId || null,
  };
}
