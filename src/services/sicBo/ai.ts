import { SicBoBet, SicBoBetType } from './types';
import { NPCProfile } from '../../types';

/**
 * AI 下注策略
 * 基於莊家優勢選擇下注，大/小是最佳選擇（莊家優勢約 2.78%）
 */
export const calculateAIBet = (
    playerChips: number,
    minBet: number,
    profile?: NPCProfile
): SicBoBet[] => {
    const bets: SicBoBet[] = [];

    // 根據個人特質決定風險偏好
    // 預設值為 1 (平衡)
    let riskFactorBase = 1.0;
    let chaosFactor = 0.1;

    if (profile?.tacticWeights) {
        const agg = profile.tacticWeights['AGGRESSIVE'] || 0;
        const cons = profile.tacticWeights['CONSERVATIVE'] || 0;
        const dec = profile.tacticWeights['DECEPTIVE'] || 0;

        // 風險因子計算：基礎 1.0 + 激進 - 保守
        // 範圍約 0.0 (極保守) ~ 2.0 (極激進)
        riskFactorBase = 1.0 + (agg * 1.5) - (cons * 1.0);

        // 混亂因子：欺騙值越高，行為越隨機
        chaosFactor = Math.max(0.1, dec * 0.5);
    } else {
        // 無檔案時的隨機性格
        riskFactorBase = 0.5 + Math.random() * 1.5;
    }

    // 引入隨機波動，受混亂因子影響
    const riskFactor = riskFactorBase + (Math.random() - 0.5) * chaosFactor * 2;

    // 1. 決定總下注預算
    // 保守：底注的 1-3 倍
    // 平衡：底注的 2-5 倍
    // 激進：底注的 5-10 倍 (或總籌碼的 5%)
    let maxBudget = minBet;
    if (riskFactor < 1) { // Conservative
        maxBudget = minBet * (1 + Math.floor(Math.random() * 3));
    } else if (riskFactor < 2) { // Balanced
        maxBudget = minBet * (2 + Math.floor(Math.random() * 4));
    } else { // Aggressive
        maxBudget = Math.max(minBet * 5, Math.min(playerChips * 0.1, minBet * 20));
    }

    let remainingBudget = Math.min(playerChips, maxBudget);

    // 2. 下注策略
    const addBet = (type: SicBoBetType, amount: number) => {
        if (remainingBudget >= amount) {
            bets.push({ type, amount });
            remainingBudget -= amount;
        }
    };

    // 基礎下注 (大/小) - 幾乎所有人都會考慮
    if (Math.random() < 0.9) {
        const betAmt = Math.min(remainingBudget, minBet * (1 + Math.floor(Math.random() * 3)));
        if (betAmt > 0) {
            addBet(Math.random() < 0.5 ? 'BIG' : 'SMALL', betAmt);
        }
    }

    // 進階下注 (如果還有預算)
    while (remainingBudget >= minBet) {
        const roll = Math.random();

        if (roll < 0.4) {
            // 雙骰 (1:10) - 激進者更愛
            const num = Math.floor(Math.random() * 6) + 1;
            addBet(`DOUBLE_${num}` as SicBoBetType, minBet);
        } else if (roll < 0.7) {
            // 總點數 (1:6 ~ 1:60)
            const total = Math.floor(Math.random() * 14) + 4; // 4-17
            addBet(`TOTAL_${total}` as SicBoBetType, minBet);
        } else if (roll < 0.85 && (riskFactor > 0.5)) {
            // 單點 (1:1)
            const num = Math.floor(Math.random() * 6) + 1;
            addBet(`SINGLE_${num}` as SicBoBetType, minBet);
        } else if (roll < 0.95 && (riskFactor > 1.5)) {
            // 圍骰 (1:180) - 只有激進者敢賭
            const num = Math.floor(Math.random() * 6) + 1;
            addBet(`TRIPLE_${num}` as SicBoBetType, minBet);
        } else if (riskFactor > 1) {
            // 全圍 (1:30)
            addBet('ANY_TRIPLE', minBet);
        } else {
            break; // 保守者停手
        }
    }

    return bets;
};

/**
 * AI 語音反應
 */
export const getAIQuote = (
    won: boolean,
    payout: number
): string => {
    if (won) {
        if (payout > 100) {
            return '大豐收！';
        }
        return Math.random() < 0.5 ? '運氣不錯！' : '贏了！';
    }
    return Math.random() < 0.5 ? '可惜...' : '下次再來！';
};
