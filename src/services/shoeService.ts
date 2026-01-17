/**
 * 共享牌靴服務
 * 用於百家樂和21點等需要多副牌靴的遊戲
 */

import { Card } from '../types';
import { SUITS, RANKS, RANK_VALUE } from '../constants';

// 默認配置
export const SHOE_CONFIG = {
    BACCARAT_DECKS: 8,      // 百家樂標準 8 副
    BLACKJACK_DECKS: 6,     // 21 點標準 6 副
    CUT_CARD_DISTANCE: 14,  // 切牌卡距離底部的張數
};

export interface CutRatioRange {
    min: number;
    max: number;
}

export interface ShoeResult {
    deck: Card[];
    shoeSize: number;
    cutCardPosition: number;
}

/**
 * Fisher-Yates 洗牌算法
 */
export const shuffleCards = <T,>(cards: T[]): T[] => {
    const deck = [...cards];
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

/**
 * 創建單副牌（不洗牌）
 */
export const createSingleDeck = (): Card[] => {
    const deck: Card[] = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) {
            deck.push({
                suit,
                rank,
                value: RANK_VALUE[rank],
                isFaceUp: false
            });
        }
    }
    return deck;
};

/**
 * 建立牌靴（多副牌已洗牌）
 * @param deckCount 副數
 * @param cutRatioRange 切牌比例範圍（可選，用於21點的隨機切牌位置）
 */
export const buildShoe = (
    deckCount: number,
    cutRatioRange?: CutRatioRange
): ShoeResult => {
    // 創建多副牌
    let shoe: Card[] = [];
    for (let i = 0; i < deckCount; i++) {
        shoe = shoe.concat(createSingleDeck());
    }

    // 洗牌
    const shuffled = shuffleCards(shoe);
    const shoeSize = shuffled.length;

    // 計算切牌卡位置
    let cutCardPosition: number;
    if (cutRatioRange) {
        // 21點模式：切牌位置隨機
        const penetration = cutRatioRange.min + Math.random() * (cutRatioRange.max - cutRatioRange.min);
        cutCardPosition = shoeSize - Math.max(15, Math.floor(shoeSize * penetration));
    } else {
        // 百家樂模式：固定距離底部
        cutCardPosition = shoeSize - SHOE_CONFIG.CUT_CARD_DISTANCE;
    }

    return {
        deck: shuffled,
        shoeSize,
        cutCardPosition,
    };
};

/**
 * 檢查是否需要洗牌
 * @param cardsUsed 已使用牌數
 * @param cutCardPosition 切牌卡位置
 */
export const shouldReshuffle = (cardsUsed: number, cutCardPosition: number): boolean => {
    return cardsUsed >= cutCardPosition;
};

/**
 * 計算剩餘牌數
 */
export const getCardsRemaining = (shoe: Card[]): number => {
    return shoe.length;
};

/**
 * 計算已發牌數
 */
export const getCardsDealt = (shoeSize: number, shoe: Card[]): number => {
    return shoeSize - shoe.length;
};
