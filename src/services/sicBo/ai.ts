import { SicBoBet, SicBoBetType } from './types';

/**
 * AI 下注策略
 * 基於莊家優勢選擇下注，大/小是最佳選擇（莊家優勢約 2.78%）
 */
export const calculateAIBet = (
    playerChips: number,
    minBet: number
): SicBoBet[] => {
    const bets: SicBoBet[] = [];
    const maxBet = minBet * 3; // 限制最大下注為底注的 3 倍，避免金額過大造成混淆
    const baseBet = Math.max(minBet, Math.min(maxBet, playerChips * 0.02));

    const rand = Math.random();

    if (rand < 0.8) {
        // 80% 選擇大/小（最低莊家優勢）
        const choice: SicBoBetType = Math.random() < 0.5 ? 'BIG' : 'SMALL';
        bets.push({ type: choice, amount: baseBet });
    } else if (rand < 0.95) {
        // 15% 選擇總點數
        const totals: SicBoBetType[] = [
            'TOTAL_9', 'TOTAL_10', 'TOTAL_11', 'TOTAL_12'
        ];
        const choice = totals[Math.floor(Math.random() * totals.length)];
        bets.push({ type: choice, amount: Math.floor(baseBet * 0.5) });
    } else {
        // 5% 嘗試高賠率項目
        const highRisk: SicBoBetType[] = ['ANY_TRIPLE', 'TRIPLE_1', 'TRIPLE_6'];
        const choice = highRisk[Math.floor(Math.random() * highRisk.length)];
        bets.push({ type: choice, amount: minBet });
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
