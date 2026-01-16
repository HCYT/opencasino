import { Card, Rank, Suit } from '../../types';
import { ComboEval, ComboType, TrickState } from './types';

export const RANK_ORDER: Rank[] = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
export const SUIT_ORDER: Record<Suit, number> = {
  Clubs: 1,
  Diamonds: 2,
  Hearts: 3,
  Spades: 4
};
export const THREE_CLUBS_KEY = '3-Clubs';

export const rankValue = (rank: Rank) => RANK_ORDER.indexOf(rank);
export const suitValue = (suit: Suit) => SUIT_ORDER[suit];
export const cardValue = (card: Card) => rankValue(card.rank) * 4 + suitValue(card.suit);
export const cardKey = (card: Card) => `${card.rank}-${card.suit}`;
export const setStrength = (cards: Card[]) => rankValue(cards[0].rank) * 10 + Math.max(...cards.map(card => suitValue(card.suit)));

export const sortCards = (cards: Card[]) =>
  [...cards].sort((a, b) => {
    const rankDiff = rankValue(a.rank) - rankValue(b.rank);
    if (rankDiff !== 0) return rankDiff;
    return suitValue(a.suit) - suitValue(b.suit);
  });

export const isStraight = (cards: Card[]) => {
  if (cards.length !== 5) return false;
  if (cards.some(card => card.rank === '2')) return false;
  const values = Array.from(new Set(cards.map(c => rankValue(c.rank)))).sort((a, b) => a - b);
  if (values.length !== 5) return false;
  return values.every((v, i) => i === 0 || v - values[i - 1] === 1);
};

export const getStraightHighCardValue = (cards: Card[]) => {
  const maxRank = Math.max(...cards.map(c => rankValue(c.rank)));
  const candidates = cards.filter(c => rankValue(c.rank) === maxRank);
  const best = candidates.reduce((bestCard, c) => (suitValue(c.suit) > suitValue(bestCard.suit) ? c : bestCard), candidates[0]);
  return cardValue(best);
};

export const evaluateCombo = (cards: Card[]): ComboEval | null => {
  const len = cards.length;
  const sorted = sortCards(cards);
  if (len === 1) {
    return { type: 'SINGLE', strength: cardValue(sorted[0]), cutRank: 0 };
  }
  if (len === 2) {
    if (sorted[0].rank === sorted[1].rank) {
      return { type: 'PAIR', strength: setStrength(sorted), cutRank: 0 };
    }
    return null;
  }
  if (len === 3) {
    if (sorted[0].rank === sorted[1].rank && sorted[1].rank === sorted[2].rank) {
      return { type: 'TRIPLE', strength: setStrength(sorted), cutRank: 0 };
    }
    return null;
  }
  if (len === 5) {
    const suits = new Set(sorted.map(c => c.suit));
    const isFlush = suits.size === 1;
    const straight = isStraight(sorted);

    const counts: Record<string, number> = {};
    sorted.forEach(c => {
      counts[c.rank] = (counts[c.rank] || 0) + 1;
    });
    const countValues = Object.values(counts).sort((a, b) => b - a);
    const rankEntries = Object.entries(counts).map(([rank, count]) => ({ rank: rank as Rank, count }));

    if (straight && isFlush) {
      return { type: 'STRAIGHT_FLUSH', strength: getStraightHighCardValue(sorted), cutRank: 2 };
    }

    if (countValues[0] === 4) {
      const quadRank = rankEntries.find(r => r.count === 4)?.rank as Rank;
      return { type: 'FOUR_KIND', strength: rankValue(quadRank), cutRank: 1 };
    }

    if (countValues[0] === 3 && countValues[1] === 2) {
      const tripleRank = rankEntries.find(r => r.count === 3)?.rank as Rank;
      return { type: 'FULL_HOUSE', strength: rankValue(tripleRank), cutRank: 0 };
    }

    if (straight && !isFlush) {
      return { type: 'STRAIGHT', strength: getStraightHighCardValue(sorted), cutRank: 0 };
    }

    return null;
  }
  if (len === 13) {
    const ranks = new Set(sorted.map(c => c.rank));
    if (ranks.size === 13) {
      return { type: 'DRAGON', strength: 0, cutRank: 3 };
    }
    return null;
  }
  return null;
};

export const canBeat = (play: ComboEval, current: TrickState | null) => {
  if (!current) return true;
  const playIsCut = play.cutRank > 0;
  const currentIsCut = current.cutRank > 0;

  if (playIsCut && !currentIsCut) return true;
  if (!playIsCut && currentIsCut) return false;

  if (playIsCut && currentIsCut) {
    if (play.cutRank !== current.cutRank) return play.cutRank > current.cutRank;
    return play.strength > current.strength;
  }

  if (play.type !== current.type) return false;
  return play.strength > current.strength;
};

export const getNextActiveIndex = (players: Array<{ finished: boolean }>, from: number) => {
  if (players.length === 0) return 0;
  let idx = (from + 1) % players.length;
  let safety = 0;
  while (safety < players.length) {
    if (!players[idx].finished) return idx;
    idx = (idx + 1) % players.length;
    safety += 1;
  }
  return from;
};

export const getPlayableSingles = (hand: Card[], minStrength: number) => {
  return sortCards(hand).filter(card => cardValue(card) > minStrength).map(card => [card]);
};

export const getCombinations = (cards: Card[], size: number) => {
  const results: Card[][] = [];
  const sorted = sortCards(cards);
  const walk = (start: number, combo: Card[]) => {
    if (combo.length === size) {
      results.push([...combo]);
      return;
    }
    for (let i = start; i <= sorted.length - (size - combo.length); i += 1) {
      combo.push(sorted[i]);
      walk(i + 1, combo);
      combo.pop();
    }
  };
  walk(0, []);
  return results;
};

export const getPlayablePairs = (hand: Card[], minStrength: number) => {
  const groups: Record<string, Card[]> = {};
  hand.forEach(card => {
    const key = card.rank;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });
  const combos = Object.entries(groups)
    .filter(([, cards]) => cards.length >= 2)
    .flatMap(([, cards]) => getCombinations(cards, 2));
  return combos
    .map(cards => ({ cards: sortCards(cards), strength: setStrength(cards) }))
    .filter(combo => combo.strength > minStrength)
    .sort((a, b) => a.strength - b.strength)
    .map(combo => combo.cards);
};

export const getPlayableTriples = (hand: Card[], minStrength: number) => {
  const groups: Record<string, Card[]> = {};
  hand.forEach(card => {
    const key = card.rank;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });
  const combos = Object.entries(groups)
    .filter(([, cards]) => cards.length >= 3)
    .flatMap(([, cards]) => getCombinations(cards, 3));
  return combos
    .map(cards => ({ cards: sortCards(cards), strength: setStrength(cards) }))
    .filter(combo => combo.strength > minStrength)
    .sort((a, b) => a.strength - b.strength)
    .map(combo => combo.cards);
};

export const buildStraightCombos = (hand: Card[], sequence: number[]) => {
  const optionsByRank = sequence.map(rankVal =>
    sortCards(hand.filter(card => rankValue(card.rank) === rankVal))
  );
  if (optionsByRank.some(options => options.length === 0)) return [];

  const results: Card[][] = [];
  const walk = (index: number, combo: Card[]) => {
    if (index === optionsByRank.length) {
      results.push([...combo]);
      return;
    }
    optionsByRank[index].forEach(card => {
      combo.push(card);
      walk(index + 1, combo);
      combo.pop();
    });
  };
  walk(0, []);
  return results;
};

export const getStraightCombos = (hand: Card[]) => {
  const combos: Card[][] = [];
  for (let start = 0; start <= 7; start++) {
    const seq = [start, start + 1, start + 2, start + 3, start + 4];
    combos.push(...buildStraightCombos(hand, seq));
  }
  return combos;
};

export const getStraightFlushCombos = (hand: Card[]) => {
  const combos: Card[][] = [];
  const suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'] as Suit[];
  suits.forEach(suit => {
    const suited = hand.filter(card => card.suit === suit);
    if (suited.length < 5) return;
    combos.push(...getStraightCombos(suited));
  });
  return combos;
};

export const getFullHouseCombos = (hand: Card[], minStrength: number) => {
  const groups: Record<string, Card[]> = {};
  hand.forEach(card => {
    const key = card.rank;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });
  const triples = Object.entries(groups)
    .filter(([, cards]) => cards.length >= 3)
    .map(([rank, cards]) => ({ rank: rank as Rank, combos: getCombinations(cards, 3) }))
    .filter(group => rankValue(group.rank) > minStrength)
    .sort((a, b) => rankValue(a.rank) - rankValue(b.rank));

  const pairs = Object.entries(groups)
    .filter(([, cards]) => cards.length >= 2)
    .map(([rank, cards]) => ({ rank: rank as Rank, combos: getCombinations(cards, 2) }))
    .sort((a, b) => rankValue(a.rank) - rankValue(b.rank));

  const combos: Card[][] = [];
  triples.forEach(triple => {
    pairs.filter(pair => pair.rank !== triple.rank).forEach(pair => {
      triple.combos.forEach(tripleCards => {
        pair.combos.forEach(pairCards => {
          combos.push([...tripleCards, ...pairCards]);
        });
      });
    });
  });
  return combos;
};

export const getFourKindCombos = (hand: Card[], minStrength: number) => {
  const groups: Record<string, Card[]> = {};
  hand.forEach(card => {
    const key = card.rank;
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });
  const quads = Object.entries(groups)
    .filter(([, cards]) => cards.length >= 4)
    .map(([rank, cards]) => ({ rank: rank as Rank, combos: getCombinations(cards, 4) }))
    .filter(group => rankValue(group.rank) > minStrength)
    .sort((a, b) => rankValue(a.rank) - rankValue(b.rank));

  const combos: Card[][] = [];
  quads.forEach(quad => {
    const kickers = sortCards(hand.filter(card => card.rank !== quad.rank));
    quad.combos.forEach(quadCards => {
      kickers.forEach(kicker => {
        combos.push([...quadCards, kicker]);
      });
    });
  });
  return combos;
};

export const canSplitDragon = (hand: Card[]) => hand.length === 13 && new Set(hand.map(c => c.rank)).size === 13;

export const COMBO_TYPE_ORDER: Record<ComboType, number> = {
  STRAIGHT: 0,
  FULL_HOUSE: 1,
  FOUR_KIND: 2,
  STRAIGHT_FLUSH: 3,
  TRIPLE: 4,
  PAIR: 5,
  SINGLE: 6,
  DRAGON: 7
};
