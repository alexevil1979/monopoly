/**
 * Chance and Community Chest card definitions.
 * Each card: { id, text, effect } where effect is applied on server.
 */

export const CHANCE_CARDS = [
  { id: 'ch1', text: 'Advance to Go. Collect $200.', effect: 'advance_to_go' },
  { id: 'ch2', text: 'Bank pays you dividend of $200.', effect: 'receive', amount: 200 },
  { id: 'ch3', text: 'Go to Jail. Do not pass Go.', effect: 'go_to_jail' },
  { id: 'ch4', text: 'Pay poor tax of $100.', effect: 'pay', amount: 100 },
  { id: 'ch5', text: 'You have won a crossword competition. Collect $100.', effect: 'receive', amount: 100 },
  { id: 'ch6', text: 'Get out of Jail Free (hold until needed).', effect: 'get_out_of_jail_free' },
];

export const COMMUNITY_CHEST_CARDS = [
  { id: 'cc1', text: 'Advance to Go. Collect $200.', effect: 'advance_to_go' },
  { id: 'cc2', text: 'Bank error in your favor. Collect $200.', effect: 'receive', amount: 200 },
  { id: 'cc3', text: 'Go to Jail. Do not pass Go.', effect: 'go_to_jail' },
  { id: 'cc4', text: 'Doctor\'s fees. Pay $100.', effect: 'pay', amount: 100 },
  { id: 'cc5', text: 'From sale of stock you get $50.', effect: 'receive', amount: 50 },
  { id: 'cc6', text: 'Holiday fund matures. Receive $100.', effect: 'receive', amount: 100 },
];

/** Shuffle and return a copy of array (Fisher–Yates). */
export function shuffleCards(cards) {
  const arr = [...cards];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** Pick one random card from deck, return card and updated deck. */
export function drawCard(deck) {
  if (!deck.length) return { card: null, deck: [] };
  const idx = Math.floor(Math.random() * deck.length);
  const card = deck[idx];
  const newDeck = deck.filter((_, i) => i !== idx);
  return { card, deck: newDeck };
}
