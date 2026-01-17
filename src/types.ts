
export type Suit = 'Spades' | 'Hearts' | 'Diamonds' | 'Clubs';
// Fix: Added missing ranks '2' through '7' to support a standard 52-card deck.
export type Rank = '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K' | 'A';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
  isFaceUp: boolean;
}

export interface NPCProfile {
  name: string;
  avatar: string;
  quotes: {
    WIN: string[];
    LOSE: string[];
    FOLD: string[];
    CHECK: string[];
    CALL: string[];
    RAISE: string[];
    ALL_IN: string[];
    WAITING: string[];
  };
  tacticWeights?: Partial<Record<AITactic, number>>;
  tacticQuotes?: Partial<Record<AITactic, string[]>>;
}

export interface UserProfile {
  name: string;
  chips: number;
  wins: number;
  losses: number;
  games: number;
  debt: number;
  avatar?: string;
}

export type AITactic = 'BAIT' | 'CONSERVATIVE' | 'DECEPTIVE' | 'AGGRESSIVE';

export type HandRank =
  | 'High Card'
  | 'One Pair'
  | 'Two Pair'
  | 'Three of a Kind'
  | 'Straight'
  | 'Flush'
  | 'Full House'
  | 'Four of a Kind'
  | 'Straight Flush'
  | 'Royal Flush';

export interface HandEvaluation {
  rank: HandRank;
  score: number;
  label: string;
}

export interface Player {
  id: string;
  name: string;
  chips: number;
  currentBet: number;
  totalBet?: number;
  cards: Card[];
  isFolded: boolean;
  isAI: boolean;
  avatar: string;
  lastAction?: string;
  teamId?: string; // For cooperative AI
  currentQuote?: string; // For Speech Bubble
  wins?: number;
  losses?: number;
  games?: number;
  debt?: number;
}

export enum GamePhase {
  SETTING = 'SETTING',
  DEALING_2 = 'DEALING_2',
  BETTING_2 = 'BETTING_2',
  DEALING_3 = 'DEALING_3',
  BETTING_3 = 'BETTING_3',
  DEALING_4 = 'DEALING_4',
  BETTING_4 = 'BETTING_4',
  DEALING_5 = 'DEALING_5',
  BETTING_5 = 'BETTING_5',
  SHOWDOWN = 'SHOWDOWN',
  RESULT = 'RESULT'
}

export type ActionType = 'FOLD' | 'CHECK' | 'CALL' | 'RAISE' | 'ALL_IN';
export type BetMode = 'FIXED_LIMIT' | 'NO_LIMIT';

export interface GameState {
  players: Player[];
  pot: number;
  deck: Card[];
  phase: GamePhase;
  activePlayerIndex: number;
  currentMaxBet: number;
  winners: string[];
  log: string[];
  communityCards?: Card[]; // For Hold'em support later
  teamingEnabled?: boolean;
  betMode?: BetMode;
  buyInChips?: number;
}

// Strategy Pattern for Rules
export interface IPokerRules {
  initialHandSize: number;
  canCheck(player: Player, currentMaxBet: number): boolean;
  getNextPhase(currentPhase: GamePhase, players: Player[]): GamePhase;
  dealCards(deck: Card[], players: Player[], phase: GamePhase): { updatedDeck: Card[], updatedPlayers: Player[] };
  evaluateWinner(players: Player[], communityCards?: Card[]): string[];
  // AI Logic
  getAIAction(player: Player, gameState: GameState): Promise<{ action: ActionType; amount?: number; taunt?: string }>;
}
