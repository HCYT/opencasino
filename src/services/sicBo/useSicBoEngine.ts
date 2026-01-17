import { useState, useRef, useCallback } from 'react';
import { NPCProfile } from '../../types';
import { playSound as defaultPlaySound } from '../sound';
import {
    SicBoPhase,
    SicBoSeat,
    SicBoPlayer,
    SicBoBet,
    SicBoBetType,
    SicBoGameState,
    DiceResult,
} from './types';
import { rollDice, calculateTotalPayout } from './rules';
import { calculateAIBet, getAIQuote } from './ai';

export interface UseSicBoEngineParams {
    seats: SicBoSeat[];
    minBet: number;
    npcProfiles: NPCProfile[];
    onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: 'WIN' | 'LOSE' | 'PUSH' }>) => void;
    playSound?: (name: string) => void;
}

export const useSicBoEngine = ({
    seats,
    minBet,
    npcProfiles,
    onProfilesUpdate,
    playSound = defaultPlaySound,
}: UseSicBoEngineParams) => {
    // 初始化玩家狀態
    const initPlayers = useCallback((): SicBoPlayer[] => {
        return seats.map(seat => ({
            ...seat,
            bets: [],
            totalBetAmount: 0,
            roundWinnings: 0,
            roundStartChips: seat.chips,
        }));
    }, [seats]);

    const [gameState, setGameState] = useState<SicBoGameState>(() => ({
        players: initPlayers(),
        dice: [1, 1, 1],
        phase: 'BETTING',
        message: '請下注',
        minBet,
    }));

    const [history, setHistory] = useState<DiceResult[]>([]);
    const rollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * 下注
     */
    const placeBet = useCallback((
        playerId: string,
        betType: SicBoBetType,
        amount: number
    ) => {
        if (gameState.phase !== 'BETTING') return;

        setGameState(prev => {
            const players = prev.players.map(player => {
                if (player.id !== playerId) return player;

                // 檢查籌碼是否足夠
                if (player.chips - player.totalBetAmount < amount) {
                    return player;
                }

                // 查找是否已有相同類型的下注
                const existingBetIndex = player.bets.findIndex(b => b.type === betType);
                let newBets: SicBoBet[];

                if (existingBetIndex >= 0) {
                    // 累加下注
                    newBets = player.bets.map((b, i) =>
                        i === existingBetIndex
                            ? { ...b, amount: b.amount + amount }
                            : b
                    );
                } else {
                    // 新增下注
                    newBets = [...player.bets, { type: betType, amount }];
                }

                const totalBetAmount = newBets.reduce((sum, b) => sum + b.amount, 0);

                return {
                    ...player,
                    bets: newBets,
                    totalBetAmount,
                };
            });

            return { ...prev, players };
        });

        playSound('chip-place');
    }, [gameState.phase, playSound]);

    /**
     * 移除特定下注
     */
    const removeBet = useCallback((playerId: string, betType: SicBoBetType) => {
        if (gameState.phase !== 'BETTING') return;

        setGameState(prev => {
            const players = prev.players.map(player => {
                if (player.id !== playerId) return player;

                const newBets = player.bets.filter(b => b.type !== betType);
                const totalBetAmount = newBets.reduce((sum, b) => sum + b.amount, 0);

                return {
                    ...player,
                    bets: newBets,
                    totalBetAmount,
                };
            });

            return { ...prev, players };
        });
    }, [gameState.phase]);

    /**
     * 清除所有下注
     */
    const clearBets = useCallback((playerId: string) => {
        if (gameState.phase !== 'BETTING') return;

        setGameState(prev => {
            const players = prev.players.map(player => {
                if (player.id !== playerId) return player;
                return {
                    ...player,
                    bets: [],
                    totalBetAmount: 0,
                };
            });

            return { ...prev, players };
        });
    }, [gameState.phase]);

    /**
     * AI 下注
     */
    const processAIBets = useCallback(() => {
        setGameState(prev => {
            const players = prev.players.map(player => {
                if (!player.isAI) return player;

                const aiBets = calculateAIBet(player.chips, minBet);
                const totalBetAmount = aiBets.reduce((sum, b) => sum + b.amount, 0);

                // 確保 AI 有足夠籌碼
                if (totalBetAmount > player.chips) {
                    return player;
                }

                return {
                    ...player,
                    bets: aiBets,
                    totalBetAmount,
                };
            });

            return { ...prev, players };
        });
    }, [minBet]);

    /**
     * 開始搖骰
     */
    const roll = useCallback(() => {
        if (gameState.phase !== 'BETTING') return;

        // 檢查玩家是否有下注
        const humanPlayer = gameState.players.find(p => !p.isAI);
        if (!humanPlayer || humanPlayer.bets.length === 0) {
            setGameState(prev => ({
                ...prev,
                message: '請先下注！',
            }));
            return;
        }

        // AI 下注
        processAIBets();

        // 進入搖骰階段
        setGameState(prev => ({
            ...prev,
            phase: 'ROLLING',
            message: '搖骰中...',
        }));

        playSound('dice-shake');

        // 模擬搖骰動畫時間
        rollingTimeoutRef.current = setTimeout(() => {
            const newDice = rollDice();
            const total = newDice[0] + newDice[1] + newDice[2];
            const triple = newDice[0] === newDice[1] && newDice[1] === newDice[2];

            // 計算每位玩家的賠付
            setGameState(prev => {
                const updates: Array<{ name: string; chips: number; result: 'WIN' | 'LOSE' | 'PUSH' }> = [];

                const players = prev.players.map(player => {
                    if (player.bets.length === 0) return player;

                    const payout = calculateTotalPayout(player.bets, newDice);
                    const newChips = player.chips + payout;
                    const won = payout > 0;

                    // 記錄更新
                    updates.push({
                        name: player.name,
                        chips: newChips,
                        result: payout > 0 ? 'WIN' : payout < 0 ? 'LOSE' : 'PUSH',
                    });

                    // AI 語音
                    const quote = player.isAI
                        ? getAIQuote(won, payout)
                        : undefined;

                    return {
                        ...player,
                        chips: newChips,
                        roundWinnings: payout,
                        quote,
                    };
                });

                // 更新歷史
                const newResult: DiceResult = {
                    dice: newDice,
                    total,
                    isTriple: triple,
                    timestamp: Date.now(),
                };
                setHistory(h => [...h.slice(-49), newResult]);

                // 回調更新 profile
                if (updates.length > 0) {
                    onProfilesUpdate(updates);
                }

                const resultMessage = triple
                    ? `圍骰！${newDice[0]}+${newDice[1]}+${newDice[2]} = ${total}`
                    : `${newDice[0]}+${newDice[1]}+${newDice[2]} = ${total}`;

                return {
                    ...prev,
                    players,
                    dice: newDice,
                    phase: 'RESULT',
                    message: resultMessage,
                };
            });

            playSound('dice-throw');
            if (triple || (total >= 11 && total <= 17)) {
                // 大贏或圍骰可以加強音效，目前簡單一點
            }
        }, 2000);
    }, [gameState.phase, gameState.players, processAIBets, onProfilesUpdate, playSound]);

    /**
     * 新回合
     */
    const newRound = useCallback(() => {
        if (gameState.phase !== 'RESULT') return;

        setGameState(prev => ({
            ...prev,
            players: prev.players.map(p => ({
                ...p,
                bets: [],
                totalBetAmount: 0,
                roundWinnings: 0,
                quote: undefined,
                roundStartChips: p.chips,
            })),
            phase: 'BETTING',
            message: '請下注',
        }));
    }, [gameState.phase]);

    /**
     * 清理
     */
    const cleanup = useCallback(() => {
        if (rollingTimeoutRef.current) {
            clearTimeout(rollingTimeoutRef.current);
        }
    }, []);

    return {
        gameState,
        placeBet,
        removeBet,
        clearBets,
        roll,
        newRound,
        history,
        cleanup,
    };
};
