import { Card } from '../../types';

// 遊戲階段
export type GatePhase = 'BETTING' | 'PLAYER_TURN' | 'RESULT';

// 玩家回合狀態
export type TurnStatus = 'WAITING' | 'GATE_REVEALED' | 'BET_PLACED' | 'RESOLVED';

// 同點門柱時的猜測方向
export type GuessDirection = 'HIGH' | 'LOW' | null;

// 結果類型
export type GateResult = 'WIN' | 'LOSE' | 'POST' | 'TRIPLE_POST' | null;

// 座位基礎類型
export interface GateSeat {
  id: string;
  name: string;
  avatar: string;
  chips: number;
  isAI: boolean;
}

// 玩家狀態
export interface GatePlayer extends GateSeat {
  gateCards: Card[];        // 門柱牌（0-2張）
  thirdCard: Card | null;   // 第三張牌
  currentBet: number;       // 當前下注
  guess: GuessDirection;    // 同點時的猜測
  turnStatus: TurnStatus;   // 回合狀態
  result: GateResult;       // 結果
  quote?: string;           // 對話
  roundStartChips?: number; // 回合開始時的籌碼
}

// 遊戲狀態
export interface GateGameState {
  players: GatePlayer[];
  pot: number;              // 彩池
  anteBet: number;          // 底注金額
  deck: Card[];             // 牌組
  phase: GatePhase;
  currentPlayerIndex: number;
  message: string;
}
