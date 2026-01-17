import { AITactic, Card, Suit, Rank } from '../../types';

export type SevensGameVariant = 'STANDARD' | 'TIMED';
export type SevensResult = 'WIN' | 'LOSE';
export type SevensPhase = 'DEALING' | 'PLAYING' | 'RESULT';

export interface SevensSeat {
    id: string;
    name: string;
    avatar: string;
    chips: number;
    isAI: boolean;
}

export interface SevensPlayer extends SevensSeat {
    hand: Card[];
    passedCards: Card[];
    finished: boolean;
    quote?: string;
    tactic?: AITactic;
}

// The board represents the four suit piles
// For each suit, we track the lowest and highest rank currently on the board
export interface SuitPile {
    suit: Suit;
    low: number;   // Lowest rank value on pile (A=1, 2=2, ..., K=13), -1 if 7 not played
    high: number;  // Highest rank value on pile, -1 if 7 not played
    cards: Card[]; // All cards on this pile
}

export interface SevensBoard {
    Spades: SuitPile;
    Hearts: SuitPile;
    Diamonds: SuitPile;
    Clubs: SuitPile;
}

// Rank mapping for Sevens (different from Big Two)
export const SEVENS_RANK_VALUE: Record<Rank, number> = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13
};

// For scoring passed cards
export const SEVENS_SCORE_VALUE: Record<Rank, number> = {
    'A': 1,
    '2': 2,
    '3': 3,
    '4': 4,
    '5': 5,
    '6': 6,
    '7': 7,
    '8': 8,
    '9': 9,
    '10': 10,
    'J': 11,
    'Q': 12,
    'K': 13
};
