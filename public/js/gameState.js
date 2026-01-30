/**
 * Local game state and board config.
 * Single source of truth; UI reads via getState() and renders.
 */

export const BOARD_CELLS = [
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

export const TOTAL_CELLS = BOARD_CELLS.length;
export const BOARD_RADIUS = 350;

let state = null;
let myId = null;
const previousPlayerPositions = {};
const previousPlayerMoney = {};

export function getState() {
  return state;
}

export function setState(newState) {
  state = newState;
}

export function getMyId() {
  return myId;
}

export function setMyId(id) {
  myId = id;
}

export function getPreviousPosition(playerId) {
  return previousPlayerPositions[playerId];
}

export function setPreviousPosition(playerId, position) {
  previousPlayerPositions[playerId] = position;
}

export function getPreviousMoney(playerId) {
  return previousPlayerMoney[playerId];
}

export function setPreviousMoney(playerId, money) {
  previousPlayerMoney[playerId] = money;
}

/** URL карточки клетки (png → jpg → svg fallback) */
export function getCardImageUrl(cell, ext = 'jpg') {
  const type = (cell && cell.type) ? cell.type : 'default';
  const known = ['go', 'street', 'chance', 'community_chest', 'tax', 'railroad', 'jail', 'utility', 'free_parking', 'go_to_jail'];
  const file = known.includes(type) ? type : 'default';
  return `/images/cards/${file}.${ext}`;
}
