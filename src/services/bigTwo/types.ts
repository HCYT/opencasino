import { AITactic, Card } from '../../types';

export type BigTwoResult = 'WIN' | 'LOSE';

export interface BigTwoSeat {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  isAI: boolean;
}

export type ComboType =
  | 'SINGLE'
  | 'PAIR'
  | 'TRIPLE'
  | 'STRAIGHT'
  | 'FULL_HOUSE'
  | 'FOUR_KIND'
  | 'STRAIGHT_FLUSH'
  | 'DRAGON';

export interface ComboEval {
  type: ComboType;
  strength: number;
  cutRank: number;
}

export interface TrickState extends ComboEval {
  cards: Card[];
  playerIndex: number;
}

export interface BigTwoPlayer extends BigTwoSeat {
  hand: Card[];
  passed: boolean;
  finished: boolean;
  quote?: string;
  tactic?: AITactic;
}
