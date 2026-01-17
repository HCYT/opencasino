// 遊戲階段
export type SicBoPhase = 'BETTING' | 'ROLLING' | 'RESULT';

// 下注類型
export type SicBoBetType =
    // 大/小
    | 'BIG'
    | 'SMALL'
    // 單/雙
    | 'ODD'
    | 'EVEN'
    // 總點數 (4-17)
    | 'TOTAL_4'
    | 'TOTAL_5'
    | 'TOTAL_6'
    | 'TOTAL_7'
    | 'TOTAL_8'
    | 'TOTAL_9'
    | 'TOTAL_10'
    | 'TOTAL_11'
    | 'TOTAL_12'
    | 'TOTAL_13'
    | 'TOTAL_14'
    | 'TOTAL_15'
    | 'TOTAL_16'
    | 'TOTAL_17'
    // 對子（雙骰組合）- 如 1+2
    | 'PAIR_1_2'
    | 'PAIR_1_3'
    | 'PAIR_1_4'
    | 'PAIR_1_5'
    | 'PAIR_1_6'
    | 'PAIR_2_3'
    | 'PAIR_2_4'
    | 'PAIR_2_5'
    | 'PAIR_2_6'
    | 'PAIR_3_4'
    | 'PAIR_3_5'
    | 'PAIR_3_6'
    | 'PAIR_4_5'
    | 'PAIR_4_6'
    | 'PAIR_5_6'
    // 雙子（至少兩顆相同）
    | 'DOUBLE_1'
    | 'DOUBLE_2'
    | 'DOUBLE_3'
    | 'DOUBLE_4'
    | 'DOUBLE_5'
    | 'DOUBLE_6'
    // 圍骰（三顆相同指定點數）
    | 'TRIPLE_1'
    | 'TRIPLE_2'
    | 'TRIPLE_3'
    | 'TRIPLE_4'
    | 'TRIPLE_5'
    | 'TRIPLE_6'
    // 任意圍骰
    | 'ANY_TRIPLE'
    // 單點（指定點數出現次數）
    | 'SINGLE_1'
    | 'SINGLE_2'
    | 'SINGLE_3'
    | 'SINGLE_4'
    | 'SINGLE_5'
    | 'SINGLE_6';

// 玩家下注結果
export type BetOutcome = 'WIN' | 'LOSE' | 'PUSH';

// 座位基礎類型
export interface SicBoSeat {
    id: string;
    name: string;
    avatar: string;
    chips: number;
    isAI: boolean;
}

// 單一下注
export interface SicBoBet {
    type: SicBoBetType;
    amount: number;
}

// 玩家狀態
export interface SicBoPlayer extends SicBoSeat {
    bets: SicBoBet[];
    totalBetAmount: number;
    roundWinnings: number;
    quote?: string;
    roundStartChips?: number;
}

// 骰子結果
export interface DiceResult {
    dice: [number, number, number];
    total: number;
    isTriple: boolean;
    timestamp: number;
}

// 遊戲狀態
export interface SicBoGameState {
    players: SicBoPlayer[];
    dice: [number, number, number];
    phase: SicBoPhase;
    message: string;
    minBet: number;
}

// 賠率配置（採用外國/澳門標準）
export const SICBO_PAYOUTS: Record<string, number> = {
    // 大/小
    BIG: 1,
    SMALL: 1,
    // 單/雙
    ODD: 1,
    EVEN: 1,
    // 總點數
    TOTAL_4: 60,
    TOTAL_5: 20,
    TOTAL_6: 18,
    TOTAL_7: 12,
    TOTAL_8: 8,
    TOTAL_9: 6,
    TOTAL_10: 6,
    TOTAL_11: 6,
    TOTAL_12: 6,
    TOTAL_13: 8,
    TOTAL_14: 12,
    TOTAL_15: 18,
    TOTAL_16: 20,
    TOTAL_17: 60,
    // 對子（雙骰組合）
    PAIR: 5,
    // 雙子（至少兩顆相同）
    DOUBLE: 10,
    // 圍骰（三顆相同指定）
    TRIPLE: 180,
    // 任意圍骰
    ANY_TRIPLE: 30,
    // 單點（依出現次數）
    SINGLE_1: 1,  // 出現1次
    SINGLE_2: 2,  // 出現2次
    SINGLE_3: 3,  // 出現3次
} as const;
