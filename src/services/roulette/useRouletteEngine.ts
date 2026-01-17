
import { useState, useCallback } from 'react';
// Simple ID generator without external dependency
const generateId = () => Math.random().toString(36).substr(2, 9);
import {
    BetType,
    RouletteBet,
    RouletteHistoryItem,
    RouletteResult
} from './types';
import {
    PAYOUTS,
    getNumberColor
} from './constants';

const checkWin = (bet: RouletteBet, winner: string): boolean => {
    // Special handling for side bets if needed, but mostly "numbers.includes(winner)" works
    if (bet.numbers.includes(winner)) return true;
    return false;
};

type GameState = 'IDLE' | 'BETTING' | 'SPINNING' | 'RESULT';

interface UseRouletteEngineProps {
    onSoundEffect?: (type: string) => void;
}

export const useRouletteEngine = ({ onSoundEffect }: UseRouletteEngineProps = {}) => {
    const [gameState, setGameState] = useState<GameState>('IDLE');
    const [bets, setBets] = useState<RouletteBet[]>([]);
    const [history, setHistory] = useState<RouletteHistoryItem[]>([]);
    const [winningNumber, setWinningNumber] = useState<string | null>(null);
    const [lastWinAmount, setLastWinAmount] = useState<number>(0);

    // --- Betting Logic ---

    const placeBet = useCallback((
        type: BetType,
        amount: number,
        numbers: string[],
        playerId: string = 'player'
    ) => {
        if (gameState !== 'IDLE' && gameState !== 'BETTING') return;

        // Start betting phase if it's the first bet
        if (gameState === 'IDLE') setGameState('BETTING');

        const newBet: RouletteBet = {
            id: generateId(),
            type,
            amount,
            numbers,
            playerId,
        };

        setBets((prev) => [...prev, newBet]);
        onSoundEffect?.('chip');
    }, [gameState, onSoundEffect]);

    const clearBets = useCallback(() => {
        if (gameState !== 'IDLE' && gameState !== 'BETTING') return;
        setBets([]);
        setGameState('IDLE');
    }, [gameState]);

    // --- Resolution Logic ---

    const resolveRound = useCallback((winner: string) => {
        setWinningNumber(winner);

        let totalWin = 0;

        bets.forEach(bet => {
            const isWin = checkWin(bet, winner);
            if (isWin) {
                // Payout = Bet Amount * Multiplier + Original Bet (usually returned)
                // Standard Casino Payout often quotes "35 to 1", meaning you get 35 + keep 1.
                totalWin += bet.amount * PAYOUTS[bet.type] + bet.amount;
            }
        });

        setLastWinAmount(totalWin);

        const result: RouletteResult = {
            winningNumber: winner,
            color: getNumberColor(winner),
        };

        setHistory(prev => [{ result, timestamp: Date.now() }, ...prev].slice(0, 50));
        setGameState('RESULT');

        if (totalWin > 0) {
            onSoundEffect?.('win');
        } else {
            onSoundEffect?.('lose'); // Optional
        }

        // Auto-reset or wait for user? usually wait.
    }, [bets, onSoundEffect]);

    // --- Spin Logic ---

    const spinWheel = useCallback(() => {
        if (gameState !== 'BETTING' || bets.length === 0) return;

        setGameState('SPINNING');
        onSoundEffect?.('spin');

        // The winner is now determined by the 3D component's ball landing
        // No more setTimeout here - the 3D component will call resolveRound
    }, [gameState, bets, onSoundEffect]);

    const resetGame = useCallback(() => {
        setGameState('IDLE');
        setWinningNumber(null);
        setLastWinAmount(0);
        setBets([]); // Optional: keep bets for "Rebet"? implementing clear for now.
    }, []);

    // --- Helper: Check Win ---


    // --- Validation Helper ---
    // Ensuring the UI acts as the source of truth for "What numbers are in this bet?"
    // is the most flexible way. The engine just trusts "If winner in bet.numbers -> Win".

    return {
        gameState,
        bets,
        history,
        winningNumber,
        lastWinAmount,
        placeBet,
        clearBets,
        spinWheel,
        resetGame,
        resolveRound, // Exposed for 3D component to call when ball lands
    };
};
