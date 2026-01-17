import { SicBoBet, SicBoBetType, SICBO_PAYOUTS } from './types';

/**
 * 擲骰子 - 產生三顆 1-6 隨機骰子
 */
export const rollDice = (): [number, number, number] => {
    return [
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
        Math.floor(Math.random() * 6) + 1,
    ];
};

/**
 * 計算骰子總點數
 */
export const getDiceTotal = (dice: [number, number, number]): number => {
    return dice[0] + dice[1] + dice[2];
};

/**
 * 判斷是否為圍骰（三顆相同）
 */
export const isTriple = (dice: [number, number, number]): boolean => {
    return dice[0] === dice[1] && dice[1] === dice[2];
};

/**
 * 取得圍骰的點數（如果是圍骰的話）
 */
export const getTripleValue = (dice: [number, number, number]): number | null => {
    if (isTriple(dice)) {
        return dice[0];
    }
    return null;
};

/**
 * 計算每個點數出現的次數
 */
export const countDiceValues = (dice: [number, number, number]): Map<number, number> => {
    const counts = new Map<number, number>();
    for (const d of dice) {
        counts.set(d, (counts.get(d) || 0) + 1);
    }
    return counts;
};

/**
 * 判斷是否有對子（至少兩顆相同）
 */
export const hasDouble = (dice: [number, number, number], value: number): boolean => {
    const counts = countDiceValues(dice);
    return (counts.get(value) || 0) >= 2;
};

/**
 * 判斷是否包含特定的雙骰組合
 */
export const hasPairCombination = (
    dice: [number, number, number],
    val1: number,
    val2: number
): boolean => {
    const sorted = [...dice].sort((a, b) => a - b);
    const target = [val1, val2].sort((a, b) => a - b);

    // 檢查是否包含這兩個值
    let found1 = false;
    let found2 = false;
    for (const d of sorted) {
        if (d === target[0] && !found1) found1 = true;
        else if (d === target[1] && !found2) found2 = true;
    }
    return found1 && found2;
};

/**
 * 計算指定點數出現的次數
 */
export const countSingleValue = (dice: [number, number, number], value: number): number => {
    return dice.filter(d => d === value).length;
};

/**
 * 判斷單一下注是否勝出
 */
export const checkBetWin = (
    betType: SicBoBetType,
    dice: [number, number, number]
): boolean => {
    const total = getDiceTotal(dice);
    const triple = isTriple(dice);

    // 大/小：圍骰通吃
    if (betType === 'BIG') {
        return !triple && total >= 11 && total <= 17;
    }
    if (betType === 'SMALL') {
        return !triple && total >= 4 && total <= 10;
    }

    // 單/雙：圍骰通吃
    if (betType === 'ODD') {
        return !triple && total % 2 === 1;
    }
    if (betType === 'EVEN') {
        return !triple && total % 2 === 0;
    }

    // 總點數
    if (betType.startsWith('TOTAL_')) {
        const targetTotal = parseInt(betType.replace('TOTAL_', ''), 10);
        return total === targetTotal;
    }

    // 對子（雙骰組合）
    if (betType.startsWith('PAIR_')) {
        const [, v1, v2] = betType.split('_');
        return hasPairCombination(dice, parseInt(v1, 10), parseInt(v2, 10));
    }

    // 雙子（至少兩顆相同）
    if (betType.startsWith('DOUBLE_')) {
        const value = parseInt(betType.replace('DOUBLE_', ''), 10);
        return hasDouble(dice, value);
    }

    // 圍骰（三顆相同指定）
    if (betType.startsWith('TRIPLE_')) {
        const value = parseInt(betType.replace('TRIPLE_', ''), 10);
        return triple && dice[0] === value;
    }

    // 任意圍骰
    if (betType === 'ANY_TRIPLE') {
        return triple;
    }

    // 單點
    if (betType.startsWith('SINGLE_')) {
        const value = parseInt(betType.replace('SINGLE_', ''), 10);
        return countSingleValue(dice, value) >= 1;
    }

    return false;
};

/**
 * 計算單一下注的賠付
 * @returns 正數表示贏得金額，負數表示輸掉金額
 */
export const calculateBetPayout = (
    bet: SicBoBet,
    dice: [number, number, number]
): number => {
    const { type, amount } = bet;
    const win = checkBetWin(type, dice);

    if (!win) {
        return -amount;
    }

    // 單點根據出現次數有不同賠率
    if (type.startsWith('SINGLE_')) {
        const value = parseInt(type.replace('SINGLE_', ''), 10);
        const count = countSingleValue(dice, value);
        const payoutKey = `SINGLE_${count}` as keyof typeof SICBO_PAYOUTS;
        return amount * SICBO_PAYOUTS[payoutKey];
    }

    // 對子
    if (type.startsWith('PAIR_')) {
        return amount * SICBO_PAYOUTS.PAIR;
    }

    // 雙子
    if (type.startsWith('DOUBLE_')) {
        return amount * SICBO_PAYOUTS.DOUBLE;
    }

    // 圍骰
    if (type.startsWith('TRIPLE_')) {
        return amount * SICBO_PAYOUTS.TRIPLE;
    }

    // 其他下注類型
    return amount * (SICBO_PAYOUTS[type] || 1);
};

/**
 * 計算所有下注的總賠付
 */
export const calculateTotalPayout = (
    bets: SicBoBet[],
    dice: [number, number, number]
): number => {
    return bets.reduce((total, bet) => {
        return total + calculateBetPayout(bet, dice);
    }, 0);
};

/**
 * 獲取下注類型的賠率描述
 */
export const getBetPayoutDescription = (type: SicBoBetType): string => {
    if (type === 'BIG' || type === 'SMALL' || type === 'ODD' || type === 'EVEN') {
        return '1:1';
    }
    if (type.startsWith('TOTAL_')) {
        const total = parseInt(type.replace('TOTAL_', ''), 10);
        return `1:${SICBO_PAYOUTS[type] || SICBO_PAYOUTS[`TOTAL_${total}`]}`;
    }
    if (type.startsWith('PAIR_')) {
        return `1:${SICBO_PAYOUTS.PAIR}`;
    }
    if (type.startsWith('DOUBLE_')) {
        return `1:${SICBO_PAYOUTS.DOUBLE}`;
    }
    if (type.startsWith('TRIPLE_')) {
        return `1:${SICBO_PAYOUTS.TRIPLE}`;
    }
    if (type === 'ANY_TRIPLE') {
        return `1:${SICBO_PAYOUTS.ANY_TRIPLE}`;
    }
    if (type.startsWith('SINGLE_')) {
        return '1:1/2:1/3:1';
    }
    return '1:1';
};
