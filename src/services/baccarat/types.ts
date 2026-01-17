import { Card } from '../../types';

// 遊戲階段
export type BaccaratPhase = 'BETTING' | 'DEALING' | 'RESULT';

// 下注類型
export type BetType = 'BANKER' | 'PLAYER' | 'TIE' | 'BANKER_PAIR' | 'PLAYER_PAIR';

// 結果類型
export type BaccaratResult = 'BANKER_WIN' | 'PLAYER_WIN' | 'TIE' | null;

// 玩家下注結果
export type BetOutcome = 'WIN' | 'LOSE' | 'PUSH';

// 座位基礎類型
export interface BaccaratSeat {
    id: string;
    name: string;
    avatar: string;
    chips: number;
    isAI: boolean;
}

// 單一下注
export interface BaccaratBet {
    type: BetType;
    amount: number;
}

// 玩家狀態
export interface BaccaratPlayer extends BaccaratSeat {
    bets: BaccaratBet[];        // 當前下注
    totalBetAmount: number;     // 總下注金額
    roundWinnings: number;      // 本輪贏得金額
    quote?: string;             // 對話
    roundStartChips?: number;   // 回合開始時的籌碼
}

// 遊戲狀態
export interface BaccaratGameState {
    players: BaccaratPlayer[];
    bankerCards: Card[];        // 莊家手牌
    playerCards: Card[];        // 閒家手牌（注意：這是遊戲的"閒家"，不是玩家）
    deck: Card[];               // 牌組
    phase: BaccaratPhase;
    result: BaccaratResult;
    bankerPoints: number;       // 莊家點數
    playerPoints: number;       // 閒家點數
    bankerPair: boolean;        // 莊對子
    playerPair: boolean;        // 閒對子
    message: string;
    minBet: number;             // 最低下注
}

// 賠率配置
export const BACCARAT_PAYOUTS = {
    BANKER: 0.95,       // 莊贏賠率（扣5%佣金）
    PLAYER: 1,          // 閒贏賠率
    TIE: 8,             // 和局賠率
    BANKER_PAIR: 11,    // 莊對子賠率
    PLAYER_PAIR: 11,    // 閒對子賠率
} as const;
