import { useState, useRef, useCallback } from 'react';
import { Card, NPCProfile } from '../../types';
import { playSound as defaultPlaySound } from '../sound';
import { buildShoe, SHOE_CONFIG } from '../shoeService';
import {
    BaccaratPhase,
    BaccaratPlayer,
    BaccaratSeat,
    BaccaratResult,
    BaccaratHistoryItem,
    BetType,
} from './types';
import {
    calculatePoints,
    isNatural,
    isPair,
    shouldPlayerDraw,
    shouldBankerDraw,
    getCardPointValue,
    evaluateResult,
    calculateTotalPayout,
} from './rules';
import { calculateAIBet, getAIQuote } from './ai';

interface UseBaccaratEngineParams {
    seats: BaccaratSeat[];
    minBet: number;
    npcProfiles: NPCProfile[];
    onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: 'WIN' | 'LOSE' | 'PUSH' }>) => void;
    playSound?: (name: string) => void;
    deckCount?: number; // 牌靴副數，默認 8
}

export const useBaccaratEngine = ({
    seats,
    minBet,
    npcProfiles,
    onProfilesUpdate,
    playSound = defaultPlaySound,
}: UseBaccaratEngineParams) => {
    // 初始化玩家狀態
    const initPlayers = (): BaccaratPlayer[] =>
        seats.map(seat => ({
            ...seat,
            bets: [],
            totalBetAmount: 0,
            roundWinnings: 0,
            roundStartChips: seat.chips,
        }));

    const [players, setPlayers] = useState<BaccaratPlayer[]>(initPlayers);
    const [phase, setPhase] = useState<BaccaratPhase>('BETTING');
    const [bankerCards, setBankerCards] = useState<Card[]>([]);
    const [playerCards, setPlayerCards] = useState<Card[]>([]);  // 遊戲的"閒家"

    // 路單歷史
    const [history, setHistory] = useState<BaccaratHistoryItem[]>([]);

    // 牌靴狀態
    const deckCount = SHOE_CONFIG.BACCARAT_DECKS;
    const initialShoe = buildShoe(deckCount);
    const [shoe, setShoe] = useState<Card[]>(() => initialShoe.deck);
    const [shoeSize] = useState(initialShoe.shoeSize);
    const [cutCardPosition] = useState(initialShoe.cutCardPosition);
    const [needsShuffle, setNeedsShuffle] = useState(false);

    const [result, setResult] = useState<BaccaratResult>(null);
    const [message, setMessage] = useState('請下注');

    const isProcessingRef = useRef(false);

    // 獲取人類玩家
    const humanPlayer = players.find(p => !p.isAI);

    // 抽牌
    const drawCard = useCallback((currentDeck: Card[], faceUp: boolean = true): [Card, Card[]] => {
        const [card, ...rest] = currentDeck;
        return [{ ...card, isFaceUp: faceUp }, rest];
    }, []);

    // 下注（人類玩家）
    const placeBet = useCallback((betType: BetType, amount: number) => {
        if (phase !== 'BETTING') return;

        setPlayers(prev => prev.map(p => {
            if (p.isAI) return p;

            // 檢查是否已下注此類型
            const existingBet = p.bets.find(b => b.type === betType);
            const newBets = existingBet
                ? p.bets.map(b => b.type === betType ? { ...b, amount: b.amount + amount } : b)
                : [...p.bets, { type: betType, amount }];

            const totalBetAmount = newBets.reduce((sum, b) => sum + b.amount, 0);

            // 確保不超過籌碼
            if (totalBetAmount > p.chips) return p;

            return { ...p, bets: newBets, totalBetAmount };
        }));

        playSound('chip');
    }, [phase, playSound]);

    // 清除下注
    const clearBets = useCallback(() => {
        if (phase !== 'BETTING') return;

        setPlayers(prev => prev.map(p => ({
            ...p,
            bets: [],
            totalBetAmount: 0,
        })));
    }, [phase]);

    // AI 下注
    const processAIBets = useCallback(() => {
        setPlayers(prev => prev.map(p => {
            if (!p.isAI) return p;

            const aiBets = calculateAIBet(p.chips, minBet);
            const totalBetAmount = aiBets.reduce((sum, b) => sum + b.amount, 0);

            return { ...p, bets: aiBets, totalBetAmount };
        }));
    }, [minBet]);

    // 結算回合
    const settleRound = useCallback((
        finalBankerCards: Card[],
        finalPlayerCards: Card[],
        finalDeck: Card[]
    ) => {
        const bankerPts = calculatePoints(finalBankerCards);
        const playerPts = calculatePoints(finalPlayerCards);
        const gameResult = evaluateResult(bankerPts, playerPts);
        const hasBankerPair = isPair(finalBankerCards);
        const hasPlayerPair = isPair(finalPlayerCards);

        setResult(gameResult);
        setShoe(finalDeck);

        // 更新歷史記錄
        const newHistoryItem: BaccaratHistoryItem = {
            result: gameResult!,
            bankerPoints: bankerPts,
            playerPoints: playerPts,
            bankerPair: hasBankerPair,
            playerPair: hasPlayerPair,
            isNatural: isNatural(bankerPts) || isNatural(playerPts),
        };
        setHistory(prev => [...prev, newHistoryItem]);

        // 檢查是否需要洗牌（已發牌數超過切牌卡位置）
        const cardsUsed = shoeSize - finalDeck.length;
        if (cardsUsed >= cutCardPosition) {
            setNeedsShuffle(true);
        }

        // 結果訊息
        const resultMessages = {
            'BANKER_WIN': `莊家 ${bankerPts} 點勝！`,
            'PLAYER_WIN': `閒家 ${playerPts} 點勝！`,
            'TIE': `和局！雙方 ${bankerPts} 點`,
        };
        setMessage(resultMessages[gameResult!]);

        // 計算賠付
        setPlayers(prev => {
            const updated = prev.map(p => {
                const winnings = calculateTotalPayout(p.bets, gameResult!, hasBankerPair, hasPlayerPair);
                const newChips = p.chips + p.totalBetAmount + winnings; // 退回下注 + 贏得金額

                // 獲取對話
                const profile = npcProfiles.find(np => np.name === p.name);
                const quote = profile ? getAIQuote(gameResult!, p.bets, profile) : undefined;

                return {
                    ...p,
                    chips: newChips,
                    roundWinnings: winnings,
                    quote,
                };
            });

            // 更新 profiles
            const profileUpdates = updated.map(p => ({
                name: p.name,
                chips: p.chips,
                result: p.roundWinnings > 0 ? 'WIN' as const : p.roundWinnings < 0 ? 'LOSE' as const : 'PUSH' as const,
            }));
            onProfilesUpdate(profileUpdates);

            return updated;
        });

        // 播放結果音效
        if (gameResult === 'BANKER_WIN') {
            playSound(players.find(p => !p.isAI)?.bets.some(b => b.type === 'BANKER') ? 'win' : 'lose');
        } else if (gameResult === 'PLAYER_WIN') {
            playSound(players.find(p => !p.isAI)?.bets.some(b => b.type === 'PLAYER') ? 'win' : 'lose');
        } else {
            playSound('chip');
        }

        setPhase('RESULT');
    }, [npcProfiles, onProfilesUpdate, playSound, players, shoeSize, cutCardPosition]);

    // 補牌流程
    const processDrawing = useCallback(async (
        currentBankerCards: Card[],
        currentPlayerCards: Card[],
        currentDeck: Card[],
        playerPts: number,
        bankerPts: number
    ) => {
        let newDeck = currentDeck;
        let newPlayerCards = [...currentPlayerCards];
        let newBankerCards = [...currentBankerCards];
        let playerDrew = false;
        let playerThirdValue: number | undefined;

        // 閒家補牌
        if (shouldPlayerDraw(playerPts)) {
            setMessage('閒家補牌...');
            await new Promise(r => setTimeout(r, 500));

            let card: Card;
            [card, newDeck] = drawCard(newDeck);
            newPlayerCards = [...newPlayerCards, card];
            setPlayerCards(newPlayerCards);
            playSound('card');

            playerDrew = true;
            playerThirdValue = getCardPointValue(card);
        }

        // 莊家補牌
        if (shouldBankerDraw(bankerPts, playerDrew, playerThirdValue)) {
            setMessage('莊家補牌...');
            await new Promise(r => setTimeout(r, 500));

            let card: Card;
            [card, newDeck] = drawCard(newDeck);
            newBankerCards = [...newBankerCards, card];
            setBankerCards(newBankerCards);
            playSound('card');
        }

        await new Promise(r => setTimeout(r, 300));
        settleRound(newBankerCards, newPlayerCards, newDeck);
    }, [drawCard, playSound, settleRound]);

    // 開始發牌
    const startDeal = useCallback(async () => {
        if (phase !== 'BETTING' || isProcessingRef.current) return;

        // 檢查玩家是否有下注
        const human = players.find(p => !p.isAI);
        if (!human || human.bets.length === 0) {
            setMessage('請先下注！');
            return;
        }

        isProcessingRef.current = true;

        // 扣除下注金額
        setPlayers(prev => prev.map(p => ({
            ...p,
            chips: p.chips - p.totalBetAmount,
            roundStartChips: p.chips,
        })));

        // AI 同時下注
        processAIBets();

        // 開始發牌
        setPhase('DEALING');
        setMessage('發牌中...');
        playSound('deal');

        let currentDeck = [...shoe];
        const newPlayerCards: Card[] = [];
        const newBankerCards: Card[] = [];

        // 發牌順序：閒1 -> 莊1 -> 閒2 -> 莊2
        await new Promise(r => setTimeout(r, 300));

        let card: Card;
        [card, currentDeck] = drawCard(currentDeck);
        newPlayerCards.push(card);
        setPlayerCards([...newPlayerCards]);
        playSound('card');

        await new Promise(r => setTimeout(r, 300));
        [card, currentDeck] = drawCard(currentDeck);
        newBankerCards.push(card);
        setBankerCards([...newBankerCards]);
        playSound('card');

        await new Promise(r => setTimeout(r, 300));
        [card, currentDeck] = drawCard(currentDeck);
        newPlayerCards.push(card);
        setPlayerCards([...newPlayerCards]);
        playSound('card');

        await new Promise(r => setTimeout(r, 300));
        [card, currentDeck] = drawCard(currentDeck);
        newBankerCards.push(card);
        setBankerCards([...newBankerCards]);
        playSound('card');

        // 計算初始點數
        const playerPts = calculatePoints(newPlayerCards);
        const bankerPts = calculatePoints(newBankerCards);

        // 檢查天牌
        const playerNatural = isNatural(playerPts);
        const bankerNatural = isNatural(bankerPts);

        if (playerNatural || bankerNatural) {
            // 天牌直接結算
            setMessage(playerNatural && bankerNatural ? '雙方天牌！' : '天牌！');
            await new Promise(r => setTimeout(r, 500));
            settleRound(newBankerCards, newPlayerCards, currentDeck);
        } else {
            // 補牌流程
            await processDrawing(newBankerCards, newPlayerCards, currentDeck, playerPts, bankerPts);
        }

        isProcessingRef.current = false;
    }, [phase, players, shoe, drawCard, processAIBets, playSound, settleRound, processDrawing]);

    // 開始新回合
    const resetRound = useCallback(() => {
        setBankerCards([]);
        setPlayerCards([]);
        setResult(null);
        setMessage('請下注');
        setPhase('BETTING');

        // 重置玩家狀態，保留籌碼
        setPlayers(prev => prev.map(p => ({
            ...p,
            bets: [],
            totalBetAmount: 0,
            roundWinnings: 0,
            quote: undefined,
            roundStartChips: p.chips,
        })));

        // 檢查是否需要洗牌（切牌卡機制）
        if (needsShuffle) {
            const newShoe = buildShoe(deckCount);
            setShoe(newShoe.deck);
            setNeedsShuffle(false);
            setMessage('牌靴已重新洗牌');
            setHistory([]); // 清空路單

            // 重新初始化所有狀態
        }
    }, [needsShuffle, deckCount]);

    // 計算當前點數
    const bankerPoints = calculatePoints(bankerCards);
    const playerPoints = calculatePoints(playerCards);
    const bankerPair = isPair(bankerCards);
    const playerPair = isPair(playerCards);

    // 牌靴資訊
    // 牌靴資訊
    const cardsRemaining = shoe.length;

    return {
        // 狀態
        players,
        phase,
        bankerCards,
        playerCards,
        bankerPoints,
        playerPoints,
        bankerPair,
        playerPair,
        result,
        message,
        minBet,
        humanPlayer,

        // 牌靴資訊
        shoeSize,
        cardsRemaining,
        needsShuffle, // UI 可用此判斷是否顯示洗牌提示
        history,

        // 操作
        placeBet,
        clearBets,
        startDeal,
        resetRound,
    };
};
