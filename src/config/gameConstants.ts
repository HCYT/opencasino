export type GameType = 'SHOWDOWN' | 'BLACKJACK' | 'BIG_TWO' | 'GATE' | 'SLOTS' | 'BACCARAT' | 'SICBO' | 'ROULETTE' | 'SEVENS' | 'TEXAS';
export type BetMode = 'FIXED_LIMIT' | 'NO_LIMIT';
export type BlackjackCutPresetKey = 'DEEP' | 'STANDARD' | 'SHALLOW';

export const BLACKJACK_DECK_OPTIONS = [4, 6, 8];
export const BIG_TWO_BASE_BETS = [5, 50, 1000, 5000];
export const SEVENS_BASE_BETS = [5, 10, 50, 100];
export const BACCARAT_MIN_BETS = [10, 100, 500, 1000];
export const SICBO_MIN_BETS = [10, 50, 100, 500];

export const BLACKJACK_CUT_PRESETS = [
    { key: 'DEEP' as BlackjackCutPresetKey, label: '深 (20%)', min: 0.15, max: 0.2 },
    { key: 'STANDARD' as BlackjackCutPresetKey, label: '標準 (25%)', min: 0.2, max: 0.25 },
    { key: 'SHALLOW' as BlackjackCutPresetKey, label: '淺 (30%)', min: 0.25, max: 0.3 }
] as const;
