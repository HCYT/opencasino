import { Card, Rank } from '../../types';
import { createDeck } from '../pokerLogic';
import { BlackjackStatus, CutRatioRange } from './types';

export const getCardValue = (rank: Rank) => {
  if (rank === 'A') return 11;
  if (rank === 'K' || rank === 'Q' || rank === 'J') return 10;
  return Number(rank);
};

export const DEFAULT_SHOE_DECKS = 6;

export const getHandValue = (cards: Card[]) => {
  let total = 0;
  let aces = 0;
  cards.forEach(card => {
    if (card.rank === 'A') aces += 1;
    total += getCardValue(card.rank);
  });
  while (total > 21 && aces > 0) {
    total -= 10;
    aces -= 1;
  }
  const soft = cards.some(card => card.rank === 'A') && total <= 21 && aces > 0;
  return { total, soft };
};

export const isBlackjack = (cards: Card[]) => cards.length === 2 && getHandValue(cards).total === 21;

export const shouldHit = (total: number, dealerUp: number, soft: boolean) => {
  if (total <= 11) return true;
  if (soft && total <= 17) return true;
  if (total >= 17) return false;
  if (total === 12) return dealerUp >= 4 && dealerUp <= 6 ? false : true;
  if (total >= 13 && total <= 16) return dealerUp >= 2 && dealerUp <= 6 ? false : true;
  return dealerUp >= 7;
};

export const shouldSplit = (rank: Rank, dealerUp: number) => {
  if (rank === 'A' || rank === '8') return true;
  if (rank === '2' || rank === '3') return dealerUp >= 2 && dealerUp <= 7;
  if (rank === '4') return dealerUp >= 5 && dealerUp <= 6;
  if (rank === '6') return dealerUp >= 2 && dealerUp <= 6;
  if (rank === '7') return dealerUp >= 2 && dealerUp <= 7;
  if (rank === '9') return (dealerUp >= 2 && dealerUp <= 6) || dealerUp === 8 || dealerUp === 9;
  return false;
};

export const getSplitStatus = (cards: Card[]): BlackjackStatus => {
  const total = getHandValue(cards).total;
  if (total > 21) return 'BUST';
  if (total === 21) return 'STAND';
  return 'PLAYING';
};

export const shuffleCards = <T,>(cards: T[]) => {
  const deck = [...cards];
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
};

export const buildShoe = (decks: number, cutRatioRange: CutRatioRange) => {
  let shoe: Card[] = [];
  for (let i = 0; i < decks; i++) {
    shoe = shoe.concat(createDeck());
  }
  const shuffled = shuffleCards(shoe);
  const penetration = cutRatioRange.min + Math.random() * (cutRatioRange.max - cutRatioRange.min);
  const cutRemaining = Math.max(15, Math.floor(shuffled.length * penetration));
  return { deck: shuffled, cutRemaining };
};

export const rollCutCardOwner = (names: string[]) => {
  if (names.length === 0) {
    return { owner: '', rolls: {} as Record<string, number> };
  }
  let rolls: Record<string, number> = {};
  let winner = '';
  let guard = 0;
  while (guard < 5 && !winner) {
    rolls = names.reduce<Record<string, number>>((acc, name) => {
      acc[name] = 1 + Math.floor(Math.random() * 6);
      return acc;
    }, {});
    const values = Object.values(rolls);
    const max = Math.max(...values);
    const winners = names.filter(name => rolls[name] === max);
    if (winners.length === 1) {
      winner = winners[0];
      break;
    }
    guard += 1;
  }
  if (!winner) winner = names[Math.floor(Math.random() * names.length)];
  return { owner: winner, rolls };
};
