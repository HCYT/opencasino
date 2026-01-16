import { Card } from '../../types';
import { RANK_VALUE } from '../../constants';
import { GatePlayer, GuessDirection } from './types';

/**
 * 計算 AI 下注金額與猜測方向
 */
export function calculateAIBet(
    gateCards: Card[],
    pot: number,
    anteBet: number,
    playerChips: number
): { amount: number; guess: GuessDirection } {
    if (gateCards.length < 2) {
        return { amount: anteBet, guess: null };
    }

    const v1 = RANK_VALUE[gateCards[0].rank];
    const v2 = RANK_VALUE[gateCards[1].rank];
    const low = Math.min(v1, v2);
    const high = Math.max(v1, v2);
    const gap = high - low;

    // 同點門柱：隨機猜測，保守下注
    if (gap === 0) {
        const guess: GuessDirection = Math.random() > 0.5 ? 'HIGH' : 'LOW';
        // 同點風險高，僅下底注
        return { amount: Math.min(anteBet, playerChips, pot), guess };
    }

    // 相鄰（間距1）：無法中門，直接 pass（下最低注）
    if (gap === 1) {
        return { amount: Math.min(anteBet, playerChips, pot), guess: null };
    }

    // 根據間距計算信心
    // gap = 2 → 1 個可能中門的點
    // gap = 12 (A vs 2) → 11 個可能中門的點
    const possibleWins = gap - 1;
    const confidence = possibleWins / 11; // 標準化到 0~1

    // 根據信心調整下注
    // 高信心：願意下更多
    // 低信心：保守
    let betRatio = 0;
    if (confidence >= 0.7) {
        // 7+ gap，激進下注
        betRatio = 0.4 + Math.random() * 0.4; // 40% ~ 80% of pot
    } else if (confidence >= 0.4) {
        // 4-6 gap，中等
        betRatio = 0.2 + Math.random() * 0.3; // 20% ~ 50% of pot
    } else {
        // 2-3 gap，保守
        betRatio = 0.1 + Math.random() * 0.15; // 10% ~ 25% of pot
    }

    const maxBet = Math.min(pot, playerChips);
    const idealBet = Math.floor(pot * betRatio);
    const amount = Math.max(anteBet, Math.min(idealBet, maxBet));

    return { amount, guess: null };
}

/**
 * 根據 NPC profiles 獲取對話
 */
export function getAIQuote(
    player: GatePlayer,
    result: 'WIN' | 'LOSE' | 'POST' | 'TRIPLE_POST' | null,
    npcProfiles: { name: string; quotes: Record<string, string[]> }[]
): string | undefined {
    const profile = npcProfiles.find(p => p.name === player.name);
    if (!profile) return undefined;

    let quoteType: string;
    switch (result) {
        case 'WIN':
            quoteType = 'WIN';
            break;
        case 'LOSE':
        case 'POST':
        case 'TRIPLE_POST':
            quoteType = 'LOSE';
            break;
        default:
            quoteType = 'WAITING';
    }

    const quotes = profile.quotes[quoteType];
    if (!quotes || quotes.length === 0) return undefined;

    return quotes[Math.floor(Math.random() * quotes.length)];
}
