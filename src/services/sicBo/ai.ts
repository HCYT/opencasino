import { SicBoBet, SicBoBetType, DiceResult } from './types';
import { NPCProfile } from '../../types';

// ==========================================
// 1. Helpers & Analysis
// ==========================================

// Strict Hot Number Detection (Freq >= 30% in last 20 rounds, or count >= 6)
// Expected count is 3.33. 6 is significant.
const getHotNumbers = (history: DiceResult[]): number[] => {
    const recent = history.slice(-20);
    if (recent.length < 5) return [];

    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
    recent.forEach(res => {
        res.dice.forEach(d => counts[d]++);
    });

    return Object.entries(counts)
        .filter(([_, count]) => count >= 6)
        .map(([num]) => parseInt(num, 10));
};

// Streak Analysis
const getStreak = (history: DiceResult[]) => {
    if (history.length === 0) return { type: null, count: 0 };

    // Check last result
    const last = history[history.length - 1];
    let type: 'BIG' | 'SMALL' | 'TRIPLE' | null = null;

    if (last.isTriple) type = 'TRIPLE';
    else if (last.total >= 11 && last.total <= 17) type = 'BIG';
    else if (last.total >= 4 && last.total <= 10) type = 'SMALL';

    if (!type) return { type: null, count: 0 };

    let count = 0;
    // Count backwards from end
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

// ==========================================
// 2. Core Logic: Scoring & Templates
// ==========================================

export const calculateAIBet = (
    playerChips: number,
    minBet: number,
    history: DiceResult[],
    profile?: NPCProfile
): SicBoBet[] => {
    const bets: SicBoBet[] = [];

    // --- A. Persona Parsing ---
    const aggWeight = profile?.tacticWeights?.['AGGRESSIVE'] || 0;
    const consWeight = profile?.tacticWeights?.['CONSERVATIVE'] || 0;
    const decWeight = profile?.tacticWeights?.['DECEPTIVE'] || 0; // 反路或怪招

    // Determine Persona Category
    let persona: 'CONSERVATIVE' | 'BALANCED' | 'AGGRESSIVE' = 'BALANCED';
    if (consWeight > 0.6) persona = 'CONSERVATIVE';
    if (aggWeight > 0.6) persona = 'AGGRESSIVE';

    // --- B. Budget Control (Fixed Rhythm) ---
    let budgetRatio = 0.03; // Default Balanced (3%)

    if (persona === 'CONSERVATIVE') {
        const base = 0.01; // 1%
        const noise = Math.random() * 0.02; // +0~2%
        budgetRatio = base + noise;
    } else if (persona === 'AGGRESSIVE') {
        const base = 0.05; // 5%
        const noise = Math.random() * 0.05; // +0~5%
        budgetRatio = base + noise;

        // Trigger: Aggressive bump if losing (Simple Martingale-lite check not implemented here, using Streak instead)
        // If long dragon, aggressive player bets more
        const { count } = getStreak(history);
        if (count >= 4) budgetRatio += 0.05; // Boost 5%
    } else {
        // Balanced
        budgetRatio = 0.03 + Math.random() * 0.02; // 3-5%
    }

    let totalBudget = Math.floor((playerChips * budgetRatio) / minBet) * minBet;
    totalBudget = Math.max(minBet, totalBudget);

    // Safety Cap
    if (playerChips > minBet * 100) {
        totalBudget = Math.min(totalBudget, playerChips * 0.25);
    }

    // --- C. Scoring System (Big vs Small) ---
    let bigScore = 50;
    let smallScore = 50;

    // 1. Randomness (Base Noise so they don't always agree)
    bigScore += (Math.random() - 0.5) * 40;
    smallScore += (Math.random() - 0.5) * 40;

    // 2. Streak Influence
    const { type: streakType, count: streakCount } = getStreak(history);
    if (streakCount >= 2 && (streakType === 'BIG' || streakType === 'SMALL')) {
        const isCounter = Math.random() < decWeight; // Deceptive chars bet against
        const weight = streakCount * 10; // Stronger streak = Stronger pull

        if (streakType === 'BIG') {
            if (isCounter) smallScore += weight; // Counter-bet
            else bigScore += weight; // Follow
        } else {
            if (isCounter) bigScore += weight;
            else smallScore += weight;
        }
    }

    // Decision
    const mainTargetStr = bigScore > smallScore ? 'BIG' : 'SMALL';

    // --- D. Template Selection ---
    // Templates:
    // 1. PURE: 100% Main
    // 2. INSURANCE: 80% Main + 20% Hedging Total
    // 3. BONUS: 85% Main + 15% Lucky Double
    // 4. HUNTER: Single + Triple (Hot Numbers) - Special case

    let template: 'PURE' | 'INSURANCE' | 'BONUS' | 'HUNTER' = 'PURE';

    const roll = Math.random();
    const hotNumbers = getHotNumbers(history);

    if (decWeight > 0.7 && hotNumbers.length > 0 && roll < 0.4) {
        template = 'HUNTER';
    } else if (aggWeight > 0.5 && roll < 0.3) {
        template = 'BONUS';
    } else if (consWeight > 0.5 && roll < 0.3) {
        template = 'INSURANCE';
    } else {
        // Default distribution for balanced
        if (roll < 0.7) template = 'PURE';
        else if (roll < 0.85 && hotNumbers.length > 0) template = 'BONUS';
        else template = 'INSURANCE';
    }

    // --- E. Construct Bets ---

    // Helper to add valid bet
    const add = (t: SicBoBetType, amt: number) => {
        if (amt >= minBet) bets.push({ type: t, amount: amt });
    };

    if (template === 'PURE') {
        add(mainTargetStr, totalBudget);

    } else if (template === 'INSURANCE') {
        // Main Bet
        const mainAmt = Math.floor(totalBudget * 0.8 / minBet) * minBet;
        add(mainTargetStr, mainAmt);

        // Insurance Bet (Opposite side Total)
        // If betting BIG, insure with Small Total (e.g., 9)
        // If betting SMALL, insure with Big Total (e.g., 12)
        const sideAmt = totalBudget - mainAmt;
        if (sideAmt >= minBet) {
            let insuranceTarget: SicBoBetType | null = null;
            if (mainTargetStr === 'BIG') {
                // Pick a small total (5-9)
                const val = 5 + Math.floor(Math.random() * 5);
                insuranceTarget = `TOTAL_${val}` as SicBoBetType;
            } else {
                // Pick a big total (12-16)
                const val = 12 + Math.floor(Math.random() * 5);
                insuranceTarget = `TOTAL_${val}` as SicBoBetType;
            }
            add(insuranceTarget, sideAmt);
        }

    } else if (template === 'BONUS') {
        // Main Bet
        const mainAmt = Math.floor(totalBudget * 0.85 / minBet) * minBet;
        add(mainTargetStr, mainAmt);

        // Bonus Bet (Correlated, Aggressive)
        // If BIG, bet High Double (4,5,6)
        // If SMALL, bet Low Double (1,2,3)
        // OR if there is a Hot Number compatible, bet that Double
        const sideAmt = totalBudget - mainAmt;
        if (sideAmt >= minBet) {
            let bonusNum = 0;
            const compatibleHot = hotNumbers.find(n =>
                (mainTargetStr === 'BIG' && n >= 4) || (mainTargetStr === 'SMALL' && n <= 3)
            );

            if (compatibleHot) {
                bonusNum = compatibleHot; // Use hot number if fits direction
            } else {
                // Random compatible
                if (mainTargetStr === 'BIG') bonusNum = 4 + Math.floor(Math.random() * 3);
                else bonusNum = 1 + Math.floor(Math.random() * 3);
            }

            add(`DOUBLE_${bonusNum}` as SicBoBetType, sideAmt);
        }

    } else if (template === 'HUNTER') {
        // Hunter ignores Big/Small score, purely hunts numbers
        if (hotNumbers.length > 0) {
            const targetNum = hotNumbers[Math.floor(Math.random() * hotNumbers.length)];

            // 70% Single
            const singleAmt = Math.floor(totalBudget * 0.7 / minBet) * minBet;
            add(`SINGLE_${targetNum}` as SicBoBetType, singleAmt);

            // 30% Triple (High Risk)
            const tripleAmt = totalBudget - singleAmt;
            if (tripleAmt >= minBet) {
                add(`TRIPLE_${targetNum}` as SicBoBetType, tripleAmt);
            }
        } else {
            // Fallback if prediction failed
            add(mainTargetStr, totalBudget);
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
