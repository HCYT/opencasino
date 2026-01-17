import { Card } from '../../types';
import { BaccaratResult, BetType, BACCARAT_PAYOUTS } from './types';

/**
 * 計算手牌點數（只算個位數）
 * Ace = 1, 2-9 按面值, 10/J/Q/K = 0
 */
export const calculatePoints = (cards: Card[]): number => {
    const total = cards.reduce((sum, card) => {
        if (card.rank === 'A') return sum + 1;
        if (['10', 'J', 'Q', 'K'].includes(card.rank)) return sum + 0;
        return sum + parseInt(card.rank, 10);
    }, 0);
    return total % 10;
};

/**
 * 判斷是否為天牌（Natural）：首兩張牌點數為 8 或 9
 */
export const isNatural = (points: number): boolean => {
    return points >= 8;
};

/**
 * 判斷是否為對子（首兩張牌點數相同）
 */
export const isPair = (cards: Card[]): boolean => {
    if (cards.length < 2) return false;
    return cards[0].rank === cards[1].rank;
};

/**
 * 閒家補牌規則：點數 0-5 補牌，6-7 不補
 */
export const shouldPlayerDraw = (playerPoints: number): boolean => {
    return playerPoints <= 5;
};

/**
 * 莊家補牌規則（根據維基百科的補牌規則表）
 * @param bankerPoints 莊家首兩張牌點數
 * @param playerDrew 閒家是否補了第三張牌
 * @param playerThirdValue 閒家第三張牌的點數（如果補牌了）
 */
export const shouldBankerDraw = (
    bankerPoints: number,
    playerDrew: boolean,
    playerThirdValue?: number
): boolean => {
    // 如果閒家不補牌，莊家按閒家規則補牌
    if (!playerDrew) {
        return bankerPoints <= 5;
    }

    // 閒家補牌了，根據複雜規則判斷
    if (playerThirdValue === undefined) return false;

    switch (bankerPoints) {
        case 0:
        case 1:
        case 2:
            // 0-2 點：總是補牌
            return true;
        case 3:
            // 3 點：閒家第三張是 8 則不補，其他補
            return playerThirdValue !== 8;
        case 4:
            // 4 點：閒家第三張是 0,1,8,9 則不補，其他補
            return ![0, 1, 8, 9].includes(playerThirdValue);
        case 5:
            // 5 點：閒家第三張是 0,1,2,3,8,9 則不補，其他補
            return ![0, 1, 2, 3, 8, 9].includes(playerThirdValue);
        case 6:
            // 6 點：閒家第三張是 6,7 則補，其他不補
            return [6, 7].includes(playerThirdValue);
        case 7:
            // 7 點：總是不補
            return false;
        default:
            return false;
    }
};

/**
 * 獲取牌的點數值（用於補牌規則判斷）
 */
export const getCardPointValue = (card: Card): number => {
    if (card.rank === 'A') return 1;
    if (['10', 'J', 'Q', 'K'].includes(card.rank)) return 0;
    return parseInt(card.rank, 10);
};

/**
 * 判斷遊戲結果
 */
export const evaluateResult = (
    bankerPoints: number,
    playerPoints: number
): BaccaratResult => {
    if (bankerPoints > playerPoints) return 'BANKER_WIN';
    if (playerPoints > bankerPoints) return 'PLAYER_WIN';
    return 'TIE';
};

/**
 * 計算單一注碼的賠付
 * @returns 正數表示贏得金額，負數表示輸掉金額，0 表示退回
 */
export const calculateBetPayout = (
    betType: BetType,
    betAmount: number,
    result: BaccaratResult,
    hasBankerPair: boolean,
    hasPlayerPair: boolean
): number => {
    switch (betType) {
        case 'BANKER':
            if (result === 'BANKER_WIN') return betAmount * BACCARAT_PAYOUTS.BANKER;
            if (result === 'TIE') return 0; // 和局退回
            return -betAmount;

        case 'PLAYER':
            if (result === 'PLAYER_WIN') return betAmount * BACCARAT_PAYOUTS.PLAYER;
            if (result === 'TIE') return 0; // 和局退回
            return -betAmount;

        case 'TIE':
            if (result === 'TIE') return betAmount * BACCARAT_PAYOUTS.TIE;
            return -betAmount;

        case 'BANKER_PAIR':
            if (hasBankerPair) return betAmount * BACCARAT_PAYOUTS.BANKER_PAIR;
            return -betAmount;

        case 'PLAYER_PAIR':
            if (hasPlayerPair) return betAmount * BACCARAT_PAYOUTS.PLAYER_PAIR;
            return -betAmount;

        default:
            return 0;
    }
};

/**
 * 計算玩家總賠付
 */
export const calculateTotalPayout = (
    bets: Array<{ type: BetType; amount: number }>,
    result: BaccaratResult,
    hasBankerPair: boolean,
    hasPlayerPair: boolean
): number => {
    return bets.reduce((total, bet) => {
        return total + calculateBetPayout(bet.type, bet.amount, result, hasBankerPair, hasPlayerPair);
    }, 0);
};
