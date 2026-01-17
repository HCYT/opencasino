import { NPCProfile } from '../../types';
import { BetType, BaccaratResult, BaccaratBet } from './types';

/**
 * AI 下注策略
 * 基於真實賭場數據：莊家勝率約 45.86%，閒家約 44.62%，和局約 9.52%
 * AI 傾向下注莊家（扣佣後仍有較高期望值）
 */
export const calculateAIBet = (
    chips: number,
    minBet: number
): BaccaratBet[] => {
    const bets: BaccaratBet[] = [];

    // 確保有足夠籌碼下注
    if (chips < minBet) return bets;

    // 決定主要下注金額（籌碼的 5-15%）
    const betRatio = 0.05 + Math.random() * 0.10;
    const mainBetAmount = Math.max(minBet, Math.floor(chips * betRatio / minBet) * minBet);

    // 決定下注類型
    const roll = Math.random();

    if (roll < 0.55) {
        // 55% 機率下注莊家
        bets.push({ type: 'BANKER', amount: mainBetAmount });
    } else if (roll < 0.95) {
        // 40% 機率下注閒家
        bets.push({ type: 'PLAYER', amount: mainBetAmount });
    } else {
        // 5% 機率下注和局（高風險高回報）
        bets.push({ type: 'TIE', amount: Math.max(minBet, Math.floor(mainBetAmount / 2)) });
    }

    // 10% 機率額外下注對子
    if (Math.random() < 0.1 && chips >= mainBetAmount + minBet) {
        const pairType: BetType = Math.random() < 0.5 ? 'BANKER_PAIR' : 'PLAYER_PAIR';
        bets.push({ type: pairType, amount: minBet });
    }

    return bets;
};

/**
 * 獲取 AI 對話
 */
export const getAIQuote = (
    result: BaccaratResult,
    playerBets: BaccaratBet[],
    profile: NPCProfile
): string => {
    // 判斷 AI 是否贏了
    const betOnBanker = playerBets.some(b => b.type === 'BANKER');
    const betOnPlayer = playerBets.some(b => b.type === 'PLAYER');
    const betOnTie = playerBets.some(b => b.type === 'TIE');

    let won = false;
    if (result === 'BANKER_WIN' && betOnBanker) won = true;
    if (result === 'PLAYER_WIN' && betOnPlayer) won = true;
    if (result === 'TIE' && betOnTie) won = true;

    const quotes = won ? profile.quotes.WIN : profile.quotes.LOSE;
    return quotes[Math.floor(Math.random() * quotes.length)] || '';
};

/**
 * 百家樂專用對話生成
 */
export const getBaccaratQuote = (
    eventType: 'NATURAL' | 'TIE' | 'BIG_WIN' | 'PAIR' | 'WAITING',
    profile: NPCProfile
): string => {
    const specialQuotes: Record<string, string[]> = {
        NATURAL: ['天牌！', '例牌！漂亮！', '八九不離十！'],
        TIE: ['和局！', '竟然和了！', '打成平手！'],
        BIG_WIN: ['大贏！', '發了！', '運氣真好！'],
        PAIR: ['對子！', '中對子了！', '雙雙對對！'],
        WAITING: profile.quotes.WAITING
    };

    const quotes = specialQuotes[eventType] || profile.quotes.WAITING;
    return quotes[Math.floor(Math.random() * quotes.length)] || '';
};
