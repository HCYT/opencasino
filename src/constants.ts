
import { Suit, Rank } from './types';

export const SUITS: Suit[] = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];
export const RANKS: Rank[] = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

export const RANK_VALUE: Record<string, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
  'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

export const SUIT_VALUE: Record<Suit, number> = {
  'Spades': 4,
  'Hearts': 3,
  'Clubs': 2,
  'Diamonds': 1
};

export const HAND_VALUES: Record<string, number> = {
  'High Card': 1,
  'One Pair': 2,
  'Two Pair': 3,
  'Three of a Kind': 4,
  'Straight': 5,
  'Flush': 6,
  'Full House': 7,
  'Four of a Kind': 8,
  'Straight Flush': 9,
  'Royal Flush': 10
};

export const INITIAL_CHIPS_OPTIONS = [5000, 10000, 50000, 100000];
export const MIN_BET = 100;
export const LOAN_AMOUNT = 20000;


export const PLAYER_QUOTES = [
  "投降輸一半！",
  "想跟我鬥？你還未夠班！",
  "我全梭了！",
  "開牌見我！",
  "你是來爭第二的嗎？",
  "這張牌，專贏老千！",
  "公海到了沒？",
  "我看你印堂發黑，必輸無疑。",
  "從來沒人敢在我面前偷雞。",
  "各位觀眾！五隻煙！",
  "糟糕，忘記搓牌了...",
  "我不跟你賭錢，我跟你賭命！",
  "只拿 AK 你也敢梭？"
];
