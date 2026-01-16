import { Card } from '../../types';

export type BlackjackPhase = 'BETTING' | 'PLAYING' | 'DEALER' | 'RESULT';
export type BlackjackStatus = 'WAITING' | 'PLAYING' | 'STAND' | 'BUST' | 'BLACKJACK';
export type BlackjackResult = 'WIN' | 'LOSE' | 'PUSH' | 'BLACKJACK';

export interface BlackjackSeat {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  isAI: boolean;
}

export interface BlackjackHand {
  id: string;
  cards: Card[];
  bet: number;
  status: BlackjackStatus;
  result?: BlackjackResult;
  isSplitHand?: boolean;
}

export interface BlackjackPlayer extends BlackjackSeat {
  hands: BlackjackHand[];
  quote?: string;
  overallResult?: BlackjackResult;
  roundStartChips?: number;
}

export type TurnRef = { playerIndex: number; handIndex: number };

export type CutRatioRange = { min: number; max: number };
