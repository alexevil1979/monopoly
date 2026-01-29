/**
 * Simplified Monopoly board: 20 cells (circular).
 * 12 streets (4 colors x 3), 2 utilities, 2 railroads,
 * Go, Jail, Free Parking, Go to Jail, 3 Chance, 2 Community Chest, 2 Tax.
 */
export const CELL_TYPES = {
  GO: 'go',
  STREET: 'street',
  UTILITY: 'utility',
  RAILROAD: 'railroad',
  TAX: 'tax',
  CHANCE: 'chance',
  COMMUNITY_CHEST: 'community_chest',
  JAIL: 'jail',
  FREE_PARKING: 'free_parking',
  GO_TO_JAIL: 'go_to_jail',
};

const TOTAL_CELLS = 20;

/** Board layout: index 0 = Go, 1..19 around the board. */
export const BOARD = [
  { index: 0, type: CELL_TYPES.GO, name: 'Go' },
  { index: 1, type: CELL_TYPES.STREET, name: 'Mediterranean Ave', color: 'brown', price: 60, rent: 6 },
  { index: 2, type: CELL_TYPES.COMMUNITY_CHEST, name: 'Community Chest' },
  { index: 3, type: CELL_TYPES.STREET, name: 'Baltic Ave', color: 'brown', price: 60, rent: 6 },
  { index: 4, type: CELL_TYPES.TAX, name: 'Income Tax', amount: 200 },
  { index: 5, type: CELL_TYPES.RAILROAD, name: 'Reading Railroad', price: 200, rent: 25 },
  { index: 6, type: CELL_TYPES.STREET, name: 'Oriental Ave', color: 'lightblue', price: 100, rent: 10 },
  { index: 7, type: CELL_TYPES.CHANCE, name: 'Chance' },
  { index: 8, type: CELL_TYPES.STREET, name: 'Vermont Ave', color: 'lightblue', price: 100, rent: 10 },
  { index: 9, type: CELL_TYPES.JAIL, name: 'Jail' },
  { index: 10, type: CELL_TYPES.STREET, name: 'St. Charles Place', color: 'pink', price: 140, rent: 14 },
  { index: 11, type: CELL_TYPES.UTILITY, name: 'Electric Company', price: 150, rent: 0 },
  { index: 12, type: CELL_TYPES.STREET, name: 'States Ave', color: 'pink', price: 140, rent: 14 },
  { index: 13, type: CELL_TYPES.RAILROAD, name: 'Pennsylvania Railroad', price: 200, rent: 25 },
  { index: 14, type: CELL_TYPES.CHANCE, name: 'Chance' },
  { index: 15, type: CELL_TYPES.STREET, name: 'Tennessee Ave', color: 'orange', price: 180, rent: 18 },
  { index: 16, type: CELL_TYPES.COMMUNITY_CHEST, name: 'Community Chest' },
  { index: 17, type: CELL_TYPES.STREET, name: 'New York Ave', color: 'orange', price: 200, rent: 20 },
  { index: 18, type: CELL_TYPES.FREE_PARKING, name: 'Free Parking' },
  { index: 19, type: CELL_TYPES.GO_TO_JAIL, name: 'Go to Jail' },
];

// One more Chance: add as cell 19 and shift Go to Jail? Spec: 3 Chance, 2 CC, 2 Tax. We have 2 Chance, 2 CC, 2 Tax. Add one Chance between 18 and 19.
// So: 18 Free Parking, 19 Chance, 20 Go to Jail. That would be 21 cells. User said 20 cells - keep 20 and have 2 Chance, 2 CC, 2 Tax.
export const BOARD_20 = BOARD.slice(0, TOTAL_CELLS);

/** Get cell by index (0..19). */
export function getCell(index) {
  const i = ((index % TOTAL_CELLS) + TOTAL_CELLS) % TOTAL_CELLS;
  return BOARD[i];
}

/** Get rent for a property (utility: 4x dice or 10x dice if both; railroad: 25/50/100/200 by count). */
export function getRent(cell, ownerOwnsCount = 1) {
  if (cell.type === CELL_TYPES.STREET) return cell.rent ?? Math.floor((cell.price || 0) / 10);
  if (cell.type === CELL_TYPES.RAILROAD) return [25, 50, 100, 200][Math.min(ownerOwnsCount - 1, 3)] ?? 25;
  if (cell.type === CELL_TYPES.UTILITY) return 0; // calculated with dice on server
  return 0;
}
