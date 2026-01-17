import { Card, Suit, Rank } from '../../types';
import { SevensBoard, SuitPile, SEVENS_RANK_VALUE, SEVENS_SCORE_VALUE } from './types';

// Initialize an empty board
export const initializeBoard = (): SevensBoard => ({
    Spades: { suit: 'Spades', low: -1, high: -1, cards: [] },
    Hearts: { suit: 'Hearts', low: -1, high: -1, cards: [] },
    Diamonds: { suit: 'Diamonds', low: -1, high: -1, cards: [] },
    Clubs: { suit: 'Clubs', low: -1, high: -1, cards: [] }
});

// Get rank value for Sevens
export const getRankValue = (rank: Rank): number => SEVENS_RANK_VALUE[rank];

// Check if a card is a 7
export const isSeven = (card: Card): boolean => card.rank === '7';

// Check if a card can be played on the board
export const canPlayCard = (card: Card, board: SevensBoard): boolean => {
    const pile = board[card.suit];
    const rankVal = getRankValue(card.rank);

    // If 7 hasn't been played for this suit, only 7 can be played
    if (pile.low === -1) {
        return rankVal === 7;
    }

    // Otherwise, card must be adjacent to current pile range
    return rankVal === pile.low - 1 || rankVal === pile.high + 1;
};

// Get all playable cards from a hand
export const getPlayableCards = (hand: Card[], board: SevensBoard): Card[] => {
    return hand.filter(card => canPlayCard(card, board));
};

// Check if Spade 7 is in hand (for determining first player)
export const hasSpade7 = (hand: Card[]): boolean => {
    return hand.some(card => card.suit === 'Spades' && card.rank === '7');
};

// Play a card onto the board
export const playCard = (card: Card, board: SevensBoard): SevensBoard => {
    const newBoard = { ...board };
    const pile = { ...newBoard[card.suit] };
    const rankVal = getRankValue(card.rank);

    if (pile.low === -1) {
        // First card of this suit (must be 7)
        pile.low = 7;
        pile.high = 7;
    } else if (rankVal === pile.low - 1) {
        pile.low = rankVal;
    } else if (rankVal === pile.high + 1) {
        pile.high = rankVal;
    }

    pile.cards = [...pile.cards, card];
    newBoard[card.suit] = pile;
    return newBoard;
};

// Calculate score for passed cards
export const calculateScore = (passedCards: Card[]): number => {
    return passedCards.reduce((sum, card) => sum + SEVENS_SCORE_VALUE[card.rank], 0);
};

// Sort cards by suit then by rank for display
export const sortCards = (cards: Card[]): Card[] => {
    const suitOrder: Record<Suit, number> = {
        Spades: 0,
        Hearts: 1,
        Diamonds: 2,
        Clubs: 3
    };

    return [...cards].sort((a, b) => {
        const suitDiff = suitOrder[a.suit] - suitOrder[b.suit];
        if (suitDiff !== 0) return suitDiff;
        return getRankValue(a.rank) - getRankValue(b.rank);
    });
};

// Get card key for identification
export const cardKey = (card: Card): string => `${card.rank}-${card.suit}`;

// Get next active player index (skip finished players)
export const getNextActiveIndex = (players: Array<{ finished: boolean }>, from: number): number => {
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

// Check if game is over (only one player left with cards)
export const isGameOver = (players: Array<{ finished: boolean }>): boolean => {
    const activePlayers = players.filter(p => !p.finished);
    return activePlayers.length <= 1;
};

// Get pile display info for UI
export const getPileDisplay = (pile: SuitPile): { lowCard: string; highCard: string } | null => {
    if (pile.low === -1) return null;

    const rankDisplay = (val: number): string => {
        if (val === 1) return 'A';
        if (val === 11) return 'J';
        if (val === 12) return 'Q';
        if (val === 13) return 'K';
        return val.toString();
    };

    return {
        lowCard: rankDisplay(pile.low),
        highCard: rankDisplay(pile.high)
    };
};
