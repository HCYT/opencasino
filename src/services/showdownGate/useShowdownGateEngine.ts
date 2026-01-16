import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, NPCProfile } from '../../types';
import { createDeck } from '../pokerLogic';
import { RANK_VALUE } from '../../constants';
import { playSound as defaultPlaySound } from '../sound';
import {
    GatePhase,
    GatePlayer,
    GateSeat,
    GateResult,
    GuessDirection,
} from './types';
import { calculateAIBet, getAIQuote } from './ai';

export interface UseShowdownGateEngineParams {
    seats: GateSeat[];
    anteBet: number;
    npcProfiles: NPCProfile[];
    resolveChips: (name: string) => number;
    onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: GateResult }>) => void;
    playSound?: (name: string) => void;
}

/**
 * 判斷結果
 */
function evaluateGate(
    low: number,
    high: number,
    third: number,
    guess: GuessDirection
): GateResult {
    // 同點門柱
    if (low === high) {
        if (third === low) return 'TRIPLE_POST'; // 撞柱賠三倍
        if (guess === 'HIGH' && third > low) return 'WIN';
        if (guess === 'LOW' && third < low) return 'WIN';
        return 'LOSE';
    }

    // 標準門柱
    if (third === low || third === high) return 'POST'; // 撞柱賠二倍
    if (third > low && third < high) return 'WIN';
    return 'LOSE';
}

/**
 * 計算賠付
 * @returns 正數表示玩家贏，負數表示玩家輸
 */
function calculatePayout(result: GateResult, bet: number): number {
    switch (result) {
        case 'WIN':
            return bet;
        case 'LOSE':
            return -bet;
        case 'POST':
            return -bet * 2;
        case 'TRIPLE_POST':
            return -bet * 3;
        default:
            return 0;
    }
}

export function useShowdownGateEngine({
    seats,
    anteBet,
    npcProfiles,
    resolveChips,
    onProfilesUpdate,
    playSound = defaultPlaySound,
}: UseShowdownGateEngineParams) {
    const [players, setPlayers] = useState<GatePlayer[]>(() =>
        seats.map(seat => ({
            ...seat,
            chips: resolveChips(seat.name),
            gateCards: [],
            thirdCard: null,
            currentBet: 0,
            guess: null,
            turnStatus: 'WAITING',
            result: null,
            quote: undefined,
            roundStartChips: undefined,
        }))
    );
    const [pot, setPot] = useState(0);
    const [deck, setDeck] = useState<Card[]>([]);
    const [phase, setPhase] = useState<GatePhase>('BETTING');
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [message, setMessage] = useState('');
    const npcTimerRef = useRef<number | null>(null);

    // Refs for cyclic dependencies
    const handleAITurnRef = useRef<any>(null);
    const advanceTurnRef = useRef<any>(null);

    const playerIndex = players.findIndex(p => !p.isAI);
    const player = players[playerIndex];
    const currentPlayer = players[currentPlayerIndex];
    const isPlayerTurn = phase === 'PLAYER_TURN' && currentPlayerIndex === playerIndex;

    // 清理 timer
    useEffect(() => () => {
        if (npcTimerRef.current) window.clearTimeout(npcTimerRef.current);
    }, []);

    /**
     * 發一張牌
     */
    const drawCard = useCallback((currentDeck: Card[], faceUp: boolean): { card: Card; deck: Card[] } | null => {
        if (currentDeck.length === 0) return null;
        const newDeck = [...currentDeck];
        const card = newDeck.pop()!;
        return { card: { ...card, isFaceUp: faceUp }, deck: newDeck };
    }, []);

    /**
     * 結束回合
     */
    const endRound = useCallback((currentPlayers: GatePlayer[], msg: string) => {
        // 計算結果更新
        const updates = currentPlayers
            .filter(p => p.result !== null)
            .map(p => ({
                name: p.name,
                chips: p.chips,
                result: p.result!,
            }));

        setPhase('RESULT');
        setMessage(msg);
        onProfilesUpdate(updates);
    }, [onProfilesUpdate]);

    /**
     * 發門柱牌給指定玩家
     */
    const dealGateCards = useCallback((
        currentPlayers: GatePlayer[],
        currentDeck: Card[],
        targetIndex: number,
        currentPot: number
    ) => {
        let workingDeck = [...currentDeck];
        const card1 = drawCard(workingDeck, true);
        if (!card1) return;
        workingDeck = card1.deck;

        const card2 = drawCard(workingDeck, true);
        if (!card2) return;
        workingDeck = card2.deck;

        const updatedPlayers = currentPlayers.map((p, i) =>
            i === targetIndex
                ? { ...p, gateCards: [card1.card, card2.card], turnStatus: 'GATE_REVEALED' as const }
                : p
        );

        setPlayers(updatedPlayers);
        setDeck(workingDeck);
        playSound('deal');

        const targetPlayer = updatedPlayers[targetIndex];
        setMessage(`${targetPlayer.name} 的門柱牌已發`);

        // 如果是 AI，自動下注
        if (targetPlayer.isAI) {
            npcTimerRef.current = window.setTimeout(() => {
                if (handleAITurnRef.current) {
                    handleAITurnRef.current(updatedPlayers, workingDeck, targetIndex, currentPot);
                }
            }, 1500);
        }
    }, [drawCard, playSound]);

    /**
     * 進入下一位玩家
     */
    const advanceTurn = useCallback((
        currentPlayers: GatePlayer[],
        currentDeck: Card[],
        currentPot: number,
        finishedIndex: number
    ) => {
        // 檢查彩池是否清空
        if (currentPot <= 0) {
            endRound(currentPlayers, '彩池清空！');
            return;
        }

        // 找下一位有籌碼的玩家
        const nextIndex = (finishedIndex + 1) % currentPlayers.length;

        // 如果繞回到第一位玩家，本輪結束
        if (nextIndex === 0) {
            endRound(currentPlayers, '本輪結束');
            return;
        }

        // 檢查下一位是否有足夠籌碼
        if (currentPlayers[nextIndex].chips < anteBet) {
            // 跳過沒籌碼的玩家，遞歸找下一位
            setCurrentPlayerIndex(nextIndex);
            // 使用 setTimeout 避免堆棧溢出
            setTimeout(() => {
                if (advanceTurnRef.current) {
                    advanceTurnRef.current(currentPlayers, currentDeck, currentPot, nextIndex);
                }
            }, 100);
            return;
        }

        // 繼續下一位
        setCurrentPlayerIndex(nextIndex);
        dealGateCards(currentPlayers, currentDeck, nextIndex, currentPot);
    }, [anteBet, dealGateCards, endRound]);

    // Update ref
    useEffect(() => {
        advanceTurnRef.current = advanceTurn;
    }, [advanceTurn]);

    /**
     * 開第三張牌並結算
     */
    const revealThirdCard = useCallback((
        currentPlayers: GatePlayer[],
        currentDeck: Card[],
        targetIndex: number,
        currentPot: number
    ) => {
        const result = drawCard(currentDeck, true);
        if (!result) return;

        const targetPlayer = currentPlayers[targetIndex];
        const [card1, card2] = targetPlayer.gateCards;
        const v1 = RANK_VALUE[card1.rank];
        const v2 = RANK_VALUE[card2.rank];
        const low = Math.min(v1, v2);
        const high = Math.max(v1, v2);
        const thirdValue = RANK_VALUE[result.card.rank];

        const gateResult = evaluateGate(low, high, thirdValue, targetPlayer.guess);
        const payout = calculatePayout(gateResult, targetPlayer.currentBet);

        // 計算新的彩池和玩家籌碼
        let newPot = currentPot;
        let winnerChips = targetPlayer.chips;

        if (payout > 0) {
            // 玩家贏，從彩池拿錢
            const actualWin = Math.min(payout, newPot);
            winnerChips += actualWin;
            newPot -= actualWin;
        } else if (payout < 0) {
            // 玩家輸，錢進彩池
            const loss = Math.abs(payout);
            const actualLoss = Math.min(loss, winnerChips);
            winnerChips -= actualLoss;
            newPot += actualLoss;
        }

        const updatedPlayers = currentPlayers.map((p, i) => {
            if (i !== targetIndex) return p;
            return {
                ...p,
                chips: winnerChips,
                thirdCard: result.card,
                turnStatus: 'RESOLVED' as const,
                result: gateResult,
                quote: p.isAI ? getAIQuote(p, gateResult, npcProfiles) : undefined,
            };
        });

        // 安全檢查：確保彩池不會變成負數
        const safePot = Math.max(0, newPot);

        setPlayers(updatedPlayers);
        setDeck(result.deck);
        setPot(safePot);
        playSound(payout > 0 ? 'win' : 'lose');

        // 結果訊息
        const resultMessages: Record<GateResult, string> = {
            'WIN': '中門！',
            'LOSE': '射歪！',
            'POST': '撞柱！賠二倍',
            'TRIPLE_POST': '撞柱！賠三倍',
        };
        setMessage(`${targetPlayer.name} ${resultMessages[gateResult!] || ''}`);

        // 延遲後進入下一位或結束
        npcTimerRef.current = window.setTimeout(() => {
            if (advanceTurnRef.current) {
                advanceTurnRef.current(updatedPlayers, result.deck, newPot, targetIndex);
            }
        }, 2000);
    }, [npcProfiles, drawCard, playSound]);

    /**
     * AI 自動下注
     */
    const handleAITurn = useCallback((
        currentPlayers: GatePlayer[],
        currentDeck: Card[],
        aiIndex: number,
        currentPot: number
    ) => {
        const aiPlayer = currentPlayers[aiIndex];
        const { amount, guess } = calculateAIBet(
            aiPlayer.gateCards,
            currentPot,
            anteBet,
            aiPlayer.chips
        );

        // 更新下注狀態
        const afterBetPlayers = currentPlayers.map((p, i) =>
            i === aiIndex
                ? { ...p, currentBet: amount, guess, turnStatus: 'BET_PLACED' as const }
                : p
        );
        setPlayers(afterBetPlayers);
        setMessage(`${aiPlayer.name} 下注 $${amount}`);
        playSound('chip');

        // 延遲後開第三張牌
        npcTimerRef.current = window.setTimeout(() => {
            revealThirdCard(afterBetPlayers, currentDeck, aiIndex, currentPot);
        }, 1200);
    }, [anteBet, playSound, revealThirdCard]);

    // Update ref
    useEffect(() => {
        handleAITurnRef.current = handleAITurn;
    }, [handleAITurn]);

    /**
     * 收取 Ante 開始新回合
     */
    const startRound = useCallback(() => {
        const newDeck = createDeck();
        // 保留現有彩池餘額（確保不為負數），累積新的底注
        let newPot = Math.max(0, pot);

        // 收取所有玩家的 ante
        const updatedPlayers = players.map(p => {
            const contribution = Math.min(anteBet, Math.max(0, p.chips));
            newPot += contribution;
            return {
                ...p,
                chips: Math.max(0, p.chips - contribution),
                gateCards: [],
                thirdCard: null,
                currentBet: 0,
                guess: null,
                turnStatus: 'WAITING' as const,
                result: null,
                quote: undefined,
                roundStartChips: Math.max(0, p.chips - contribution),
            };
        });

        // 確保最終 pot 不為負數
        const safePot = Math.max(0, newPot);

        setPlayers(updatedPlayers);
        setPot(safePot);
        setDeck(newDeck);
        setPhase('PLAYER_TURN');
        setCurrentPlayerIndex(0);
        setMessage(`新回合開始，彩池 $${safePot.toLocaleString()}`);
        playSound('chip');

        // 發第一位玩家的門柱牌
        dealGateCards(updatedPlayers, newDeck, 0, safePot);
    }, [players, anteBet, pot, playSound, dealGateCards]);

    /**
     * 玩家下注
     */
    const placeBet = useCallback((amount: number, guess: GuessDirection = null) => {
        if (!isPlayerTurn) return;
        if (currentPlayer.turnStatus !== 'GATE_REVEALED') return;

        // 驗證下注金額
        const validAmount = Math.max(anteBet, Math.min(amount, pot, currentPlayer.chips));

        const updatedPlayers = players.map((p, i) =>
            i === currentPlayerIndex
                ? { ...p, currentBet: validAmount, guess, turnStatus: 'BET_PLACED' as const }
                : p
        );
        setPlayers(updatedPlayers);
        setMessage(`${currentPlayer.name} 下注 $${validAmount}`);
        playSound('chip');

        // 開第三張牌 - 保存當前 pot 值
        const currentPot = pot;
        setTimeout(() => {
            revealThirdCard(updatedPlayers, deck, currentPlayerIndex, currentPot);
        }, 800);
    }, [isPlayerTurn, currentPlayer, currentPlayerIndex, players, pot, anteBet, deck, playSound, revealThirdCard]);

    /**
     * 重置開始新局（保留彩池餘額）
     */
    const resetToBetting = useCallback(() => {
        const updatedPlayers = players.map(p => ({
            ...p,
            gateCards: [],
            thirdCard: null,
            currentBet: 0,
            guess: null,
            turnStatus: 'WAITING' as const,
            result: null,
            quote: undefined,
        }));
        setPlayers(updatedPlayers);
        // 不重置彩池，保留餘額讓下一局累積
        setPhase('BETTING');
        setCurrentPlayerIndex(0);
        setMessage('');
    }, [players]);

    /**
     * 檢查是否為同點門柱
     */
    const isSameGate = useCallback(() => {
        if (!currentPlayer || currentPlayer.gateCards.length < 2) return false;
        const v1 = RANK_VALUE[currentPlayer.gateCards[0].rank];
        const v2 = RANK_VALUE[currentPlayer.gateCards[1].rank];
        return v1 === v2;
    }, [currentPlayer]);

    /**
     * 計算門柱間距
     */
    const getGateGap = useCallback(() => {
        if (!currentPlayer || currentPlayer.gateCards.length < 2) return 0;
        const v1 = RANK_VALUE[currentPlayer.gateCards[0].rank];
        const v2 = RANK_VALUE[currentPlayer.gateCards[1].rank];
        return Math.abs(v1 - v2);
    }, [currentPlayer]);

    return {
        // 狀態
        players,
        pot,
        phase,
        currentPlayerIndex,
        currentPlayer,
        message,
        isPlayerTurn,
        player,

        // 輔助
        isSameGate,
        getGateGap,
        anteBet,

        // 動作
        startRound,
        placeBet,
        resetToBetting,
    };
}
