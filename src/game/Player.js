/**
 * Player model for game state.
 * Stored in room state; server is authoritative.
 */
export const STARTING_MONEY = 1500;

export function createPlayer(socketId, name = 'Player') {
  return {
    id: socketId,
    name: name.slice(0, 20),
    money: STARTING_MONEY,
    position: 0,
    inJail: false,
    jailTurnsLeft: 0,
    getOutOfJailFree: 0,
    ready: false,
    bankrupt: false,
    orderIndex: 0, // 0..n-1 for turn order
    lastDice: [0, 0],
    doublesCount: 0, // consecutive doubles this turn chain
    /** Timestamp отключения; в течение REJOIN_WINDOW_MS игрок может вернуться. */
    disconnectedAt: undefined,
  };
}

/** Check if player is bankrupt (money < 0). */
export function isBankrupt(player) {
  return player.bankrupt || (player.money < 0);
}

/** Check if player is in rejoin window (disconnected but not yet expired). */
export function isDisconnected(player) {
  return player.disconnectedAt != null;
}
