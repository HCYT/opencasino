import { SicBoBet, SicBoBetType, DiceResult } from './types';
import { NPCProfile } from '../../types';

// Helper: Analyze history for hot numbers (last 20 rounds)
const getHotNumbers = (history: DiceResult[]): number[] => {
    const recent = history.slice(-20);
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    recent.forEach(res => {
        res.dice.forEach(d => counts[d]++);
    });
    // Return numbers that appear significantly more than expected (> 20% freq)
    // Expected freq for one number in 20 rounds (60 dice) is 10.
    return Object.entries(counts)
        .filter(([_, count]) => count >= 12)
        .map(([num]) => parseInt(num, 10));
};

// Helper: Analyze streak (Big/Small)
const getStreak = (history: DiceResult[]) => {
    if (history.length === 0) return { type: null, count: 0 };

    let type: 'BIG' | 'SMALL' | 'TRIPLE' | null = null;
    let count = 0;

    // Check last result
    const last = history[history.length - 1];
    if (last.isTriple) type = 'TRIPLE';
    else if (last.total >= 11 && last.total <= 17) type = 'BIG';
    else if (last.total >= 4 && last.total <= 10) type = 'SMALL';

    if (!type) return { type: null, count: 0 };

    // Count backwards
    for (let i = history.length - 1; i >= 0; i--) {
        const res = history[i];
        let currentType = null;
        if (res.isTriple) currentType = 'TRIPLE';
        else if (res.total >= 11 && res.total <= 17) currentType = 'BIG';
        else if (res.total >= 4 && res.total <= 10) currentType = 'SMALL';

        if (currentType === type) count++;
        else break;
    }
    return { type, count };
};

/**
 * AI 下注策略
 * 現在會參考歷史紀錄，並採取"集中下注"策略，避免亂槍打鳥
 */
export const calculateAIBet = (
    playerChips: number,
    minBet: number,
    history: DiceResult[],
    profile?: NPCProfile
): SicBoBet[] => {
    const bets: SicBoBet[] = [];

    // 0. 解析性格與風險
    let riskFactorBase = 1.0;
    let isContrarian = false; // 是否喜歡反路 (Deceptive trait)
    let followsTrend = true;  // 是否喜歡順龍 (Aggressive trait)

    if (profile?.tacticWeights) {
        const agg = profile.tacticWeights['AGGRESSIVE'] || 0;
        const cons = profile.tacticWeights['CONSERVATIVE'] || 0;
        const dec = profile.tacticWeights['DECEPTIVE'] || 0;

        riskFactorBase = 1.0 + (agg * 1.5) - (cons * 1.0);

        // Deceptive bots like to bet against the streak
        if (Math.random() < dec) isContrarian = true;
        // Aggressive bots love long dragons
        if (agg > 0.6) followsTrend = true;
    } else {
        riskFactorBase = 0.5 + Math.random() * 1.5;
    }

    // 引入隨機波動
    const riskFactor = riskFactorBase + (Math.random() - 0.5) * 0.2;

    // 1. 決定總預算 (財富佔比)
    let budgetRatio = 0.02; // Default 2%
    if (riskFactor < 1) budgetRatio = 0.01 + Math.random() * 0.02; // 1-3%
    else if (riskFactor < 1.8) budgetRatio = 0.03 + Math.random() * 0.05; // 3-8%
    else budgetRatio = 0.08 + Math.random() * 0.07; // 8-15%

    // 預算計算
    let maxBudget = Math.floor((playerChips * budgetRatio) / minBet) * minBet;
    maxBudget = Math.max(minBet, maxBudget);

    // 硬上限防止梭哈
    if (playerChips > minBet * 100) {
        maxBudget = Math.min(maxBudget, playerChips * 0.3);
    }

    let remainingBudget = Math.min(playerChips, maxBudget);

    // 2. 分析局勢 (History Analysis)
    const { type: streakType, count: streakCount } = getStreak(history);
    const hotNumbers = getHotNumbers(history);

    // 3. 制定策略 (Strategy Selection)
    // 目標：選定一個"主攻方向"，然後圍繞它下注
    let primaryTarget: 'BIG' | 'SMALL' | 'HOT_NUMBER' | 'RANDOM' = 'RANDOM';
    let targetDetail: number | null = null; // For HOT_NUMBER

    // Strategy A: Dragon Chasing (長龍順勢)
    if (streakCount >= 3 && (streakType === 'BIG' || streakType === 'SMALL') && followsTrend && !isContrarian) {
        primaryTarget = streakType;
    }
    // Strategy B: Contrarian (長龍斬斷)
    else if (streakCount >= 4 && (streakType === 'BIG' || streakType === 'SMALL') && isContrarian) {
        primaryTarget = streakType === 'BIG' ? 'SMALL' : 'BIG';
    }
    // Strategy C: Hot Number Hunter (熱號追蹤)
    else if (hotNumbers.length > 0 && Math.random() < 0.6) {
        primaryTarget = 'HOT_NUMBER';
        targetDetail = hotNumbers[Math.floor(Math.random() * hotNumbers.length)];
    }
    // Strategy D: Random fallback (But consistent)
    else {
        primaryTarget = Math.random() < 0.5 ? 'BIG' : 'SMALL';
    }

    // 4. 執行下注 (Execution)
    const addBet = (type: SicBoBetType, amount: number) => {
        if (remainingBudget >= amount) {
            bets.push({ type, amount });
            remainingBudget -= amount;
        }
    };

    // 分配預算：主注佔 70-80%，輔注佔 20-30%
    const mainBetAmount = Math.floor(remainingBudget * 0.8 / minBet) * minBet;

    // Step 4.1: Main Bet
    if (primaryTarget === 'BIG') {
        if (mainBetAmount > 0) addBet('BIG', mainBetAmount);

        // Coherent Side Bets for BIG: Total 11-17, Doubles 4-6
        while (remainingBudget >= minBet) {
            if (Math.random() < 0.4) break; // Stop casually
            const betAmt = Math.max(minBet, Math.floor(remainingBudget * 0.5 / minBet) * minBet);

            const roll = Math.random();
            if (roll < 0.3) {
                // High Doubles
                const num = [4, 5, 6][Math.floor(Math.random() * 3)];
                addBet(`DOUBLE_${num}` as SicBoBetType, betAmt);
            } else if (roll < 0.6) {
                // High Totals
                const total = 11 + Math.floor(Math.random() * 7); // 11-17
                addBet(`TOTAL_${total}` as SicBoBetType, betAmt);
            } else {
                break;
            }
        }

    } else if (primaryTarget === 'SMALL') {
        if (mainBetAmount > 0) addBet('SMALL', mainBetAmount);

        // Coherent Side Bets for SMALL: Total 4-10, Doubles 1-3
        while (remainingBudget >= minBet) {
            if (Math.random() < 0.4) break;
            const betAmt = Math.max(minBet, Math.floor(remainingBudget * 0.5 / minBet) * minBet);

            const roll = Math.random();
            if (roll < 0.3) {
                // Low Doubles
                const num = [1, 2, 3][Math.floor(Math.random() * 3)];
                addBet(`DOUBLE_${num}` as SicBoBetType, betAmt);
            } else if (roll < 0.6) {
                // Low Totals
                const total = 4 + Math.floor(Math.random() * 7); // 4-10
                addBet(`TOTAL_${total}` as SicBoBetType, betAmt);
            } else {
                break;
            }
        }

    } else if (primaryTarget === 'HOT_NUMBER' && targetDetail) {
        // 重注熱號：Single + Double + Total containing it
        // 這裡不一定下大小，而是專攻數字

        // 1. Single Bet (穩健)
        const singleAmt = Math.floor(mainBetAmount * 0.6 / minBet) * minBet;
        addBet(`SINGLE_${targetDetail}` as SicBoBetType, singleAmt);

        // 2. Double Bet (激進)
        const doubleAmt = Math.floor(mainBetAmount * 0.3 / minBet) * minBet;
        if (doubleAmt >= minBet) addBet(`DOUBLE_${targetDetail}` as SicBoBetType, doubleAmt);

        // 3. Triple (夢想)
        if (remainingBudget >= minBet && riskFactor > 1.2) {
            addBet(`TRIPLE_${targetDetail}` as SicBoBetType, minBet);
        }
    }

    return bets;
};

/**
 * AI 語音反應
 */
export const getAIQuote = (
    won: boolean,
    payout: number,
    profile?: NPCProfile
): string => {
    // 優先使用 NPC 設定的語錄
    if (profile) {
        const quotes = won ? profile.quotes.WIN : profile.quotes.LOSE;
        if (quotes && quotes.length > 0) {
            return quotes[Math.floor(Math.random() * quotes.length)];
        }
    }

    // Fallback if no profile or empty quotes
    if (won) {
        if (payout > 100) {
            return '大豐收！';
        }
        return Math.random() < 0.5 ? '運氣不錯！' : '贏了！';
    }
    return Math.random() < 0.5 ? '可惜...' : '下次再來！';
};
