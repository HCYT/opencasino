
import { Card, Suit, Rank, HandEvaluation, Player, HandRank } from '../types';
import { SUITS, RANKS, RANK_VALUE, HAND_VALUES } from '../constants';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({
        suit,
        rank,
        value: RANK_VALUE[rank],
        isFaceUp: false
      });
    }
  }
  return shuffle(deck);
};

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const evaluateHand = (cards: Card[]): HandEvaluation => {
  if (cards.length === 0) return { rank: 'High Card', score: 0, label: '無牌' };

  const sorted = [...cards].sort((a, b) => b.value - a.value);
  const values = sorted.map(c => c.value);
  const counts: Record<number, number> = {};
  values.forEach(v => { counts[v] = (counts[v] || 0) + 1; });

  const groups = Object.entries(counts)
    .map(([value, count]) => ({ value: Number(value), count }))
    .sort((a, b) => (b.count - a.count) || (b.value - a.value));

  const isFlush = cards.length === 5 && cards.every(c => c.suit === cards[0].suit);

  let isStraight = false;
  let straightHigh = 0;
  if (cards.length === 5) {
    const unique = Array.from(new Set(values));
    if (unique.length === 5) {
      const consecutive = unique.every((v, i) => i === 0 || unique[i - 1] - v === 1);
      if (consecutive) {
        isStraight = true;
        straightHigh = unique[0];
      } else if (unique[0] === 14 && unique[1] === 5 && unique[2] === 4 && unique[3] === 3 && unique[4] === 2) {
        isStraight = true;
        straightHigh = 5;
      }
    }
  }

  let rank: HandRank = 'High Card';
  let label = '高牌';
  let tiebreakers: number[] = values;

  if (isFlush && isStraight) {
    if (straightHigh === 14 && values.includes(10)) {
      rank = 'Royal Flush';
      label = '同花大順';
    } else {
      rank = 'Straight Flush';
      label = '同花順';
    }
    tiebreakers = [straightHigh];
  } else if (groups[0]?.count === 4) {
    rank = 'Four of a Kind';
    label = '鐵支';
    tiebreakers = [groups[0].value, groups[1]?.value || 0];
  } else if (groups[0]?.count === 3 && groups[1]?.count === 2) {
    rank = 'Full House';
    label = '葫蘆';
    tiebreakers = [groups[0].value, groups[1].value];
  } else if (isFlush) {
    rank = 'Flush';
    label = '同花';
    tiebreakers = values;
  } else if (isStraight) {
    rank = 'Straight';
    label = '順子';
    tiebreakers = [straightHigh];
  } else if (groups[0]?.count === 3) {
    rank = 'Three of a Kind';
    label = '三條';
    const kickers = groups.slice(1).map(g => g.value).sort((a, b) => b - a);
    tiebreakers = [groups[0].value, ...kickers];
  } else if (groups[0]?.count === 2 && groups[1]?.count === 2) {
    rank = 'Two Pair';
    label = '兩對';
    const pairs = groups.filter(g => g.count === 2).map(g => g.value).sort((a, b) => b - a);
    const kicker = groups.find(g => g.count === 1)?.value || 0;
    tiebreakers = [pairs[0], pairs[1], kicker];
  } else if (groups[0]?.count === 2) {
    rank = 'One Pair';
    label = '一對';
    const kickers = groups.slice(1).map(g => g.value).sort((a, b) => b - a);
    tiebreakers = [groups[0].value, ...kickers];
  }

  const baseScore = HAND_VALUES[rank] * 1000000000;
  const kickerScore = tiebreakers.reduce((acc, v) => acc * 15 + v, 0);

  return { rank, score: baseScore + kickerScore, label };
};

export const getAIAction = (player: Player, currentMaxBet: number, pot: number, communityCardsCount: number): { action: string, amount: number } => {
  const visibleCards = player.cards.filter(c => c.isFaceUp || player.cards.length === 5);
  const evalResult = evaluateHand(visibleCards);
  const handStrength = HAND_VALUES[evalResult.rank];
  const callAmount = currentMaxBet - player.currentBet;
  
  const random = Math.random();

  if (handStrength >= 4) { // Three of a Kind or better
    if (random > 0.6) return { action: 'RAISE', amount: 100 + Math.floor(random * 100) };
    return { action: 'CALL', amount: callAmount };
  }

  if (handStrength >= 2) { // Pair
    if (callAmount > player.chips * 0.5) return { action: 'FOLD', amount: 0 };
    if (random > 0.8) return { action: 'RAISE', amount: 50 };
    return { action: 'CALL', amount: callAmount };
  }

  if (callAmount === 0) return { action: 'CHECK', amount: 0 };
  if (callAmount > player.chips * 0.15 && random > 0.4) return { action: 'FOLD', amount: 0 };
  
  return { action: 'CALL', amount: callAmount };
};
