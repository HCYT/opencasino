import { useState, useCallback, useEffect, useMemo } from 'react';
import { loadProfiles, saveProfiles, loadJackpot, saveJackpot } from '../profileStore';
import { SlotRules, SpinResult, NUM_PAYLINES } from './SlotRules';
import { playSound } from '../sound';

// Industry standard: 1-3% of bet goes to jackpot
const JACKPOT_CONTRIBUTION_RATE = 0.02;

export interface SlotEngineState {
    credits: number;
    jackpot: number;
    betAmount: number;
    isSpinning: boolean;
    result: SpinResult | null;
    message: string;
    isAutoSpin: boolean;
    freeSpinsRemaining: number;
    isFreeSpinMode: boolean;
}

export const useSlotMachineEngine = (playerName: string) => {
    const [credits, setCredits] = useState(0);
    const [jackpot, setJackpot] = useState(10000);
    const [betAmount, setBetAmount] = useState(10);
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastResult, setLastResult] = useState<SpinResult | null>(null);
    const [message, setMessage] = useState('準備開始');
    const [isAutoSpin, setIsAutoSpin] = useState(false);

    // Free Spins state
    const [freeSpinsRemaining, setFreeSpinsRemaining] = useState(0);
    const [isFreeSpinMode, setIsFreeSpinMode] = useState(false);

    const rules = useMemo(() => new SlotRules(), []);

    // Load initial state
    useEffect(() => {
        const profiles = loadProfiles();
        let user = profiles[playerName];

        if (!user) {
            user = { name: playerName, chips: 1000, wins: 0, losses: 0, games: 0, debt: 0 };
        }

        setCredits(user.chips);
        setJackpot(loadJackpot());
    }, [playerName]);

    // Sync credits to storage
    const updateCredits = useCallback((newCredits: number) => {
        setCredits(newCredits);
        const profiles = loadProfiles();
        if (profiles[playerName]) {
            profiles[playerName].chips = newCredits;
            saveProfiles(profiles);
        }
    }, [playerName]);

    const toggleAutoSpin = useCallback(() => {
        setIsAutoSpin(prev => !prev);
    }, []);

    const spin = useCallback(() => {
        if (isSpinning) return;

        // Free spin doesn't cost credits
        const isFree = freeSpinsRemaining > 0;

        if (!isFree && credits < betAmount) {
            setMessage('籌碼不足！');
            setIsAutoSpin(false);
            return;
        }

        setIsSpinning(true);

        if (isFree) {
            setMessage(`免費旋轉中... (剩餘 ${freeSpinsRemaining - 1})`);
            setFreeSpinsRemaining(prev => prev - 1);
        } else {
            setMessage(isAutoSpin ? '自動轉動中...' : '轉動中...');
        }

        // Play spin sound
        playSound('chip-place');

        // Deduct bet (not for free spins)
        let currentCredits = credits;
        if (!isFree) {
            currentCredits = credits - betAmount;
            updateCredits(currentCredits);

            // Contribute to Jackpot
            const contribution = Math.floor(betAmount * JACKPOT_CONTRIBUTION_RATE);
            const newJackpot = jackpot + contribution;
            setJackpot(newJackpot);
            saveJackpot(newJackpot);
        }

        // Spinning delay
        setTimeout(() => {
            playSound('chip-stack');
            const result = rules.spin(betAmount);
            setLastResult(result);
            setIsSpinning(false);

            let win = result.winAmount;
            let updatedJackpot = jackpot;

            // Handle Jackpot
            if (result.isJackpot) {
                win += jackpot;
                updatedJackpot = 10000; // Reset
                setMessage(`🎰 大獎！贏得 $${win.toLocaleString()}！`);
                saveJackpot(updatedJackpot);
                setJackpot(updatedJackpot);
                setIsAutoSpin(false);
                playSound('slot-win');
            } else if (win > 0) {
                setMessage(`贏得 $${win.toLocaleString()}！`);
                playSound('slot-win');
            } else {
                setMessage('再接再厲');
            }

            // Handle Free Spins Award
            if (result.freeSpinsAwarded > 0) {
                setFreeSpinsRemaining(prev => prev + result.freeSpinsAwarded);
                setIsFreeSpinMode(true);
                setMessage(prev => `${prev} +${result.freeSpinsAwarded} 免費旋轉！`);
                playSound('slot-win');
            }

            // Exit free spin mode when done
            if (freeSpinsRemaining <= 1 && result.freeSpinsAwarded === 0) {
                setIsFreeSpinMode(false);
            }

            updateCredits(currentCredits + win);

            // Update stats
            const profiles = loadProfiles();
            if (profiles[playerName]) {
                const p = profiles[playerName];
                p.games += 1;
                if (win > betAmount) p.wins += 1;
                else p.losses += 1;
                saveProfiles(profiles);
            }

        }, 2000);
    }, [credits, betAmount, isSpinning, jackpot, playerName, rules, updateCredits, isAutoSpin, freeSpinsRemaining]);

    // Auto Spin Effect
    useEffect(() => {
        let timer: number;
        const canAutoSpin = isAutoSpin && !isSpinning && (credits >= betAmount || freeSpinsRemaining > 0);

        if (canAutoSpin) {
            timer = window.setTimeout(() => {
                spin();
            }, 1500);
        } else if (isAutoSpin && credits < betAmount && freeSpinsRemaining === 0) {
            setIsAutoSpin(false);
            setMessage('籌碼不足，自動停止');
        }
        return () => clearTimeout(timer);
    }, [isAutoSpin, isSpinning, credits, betAmount, spin, freeSpinsRemaining]);

    // Auto-continue free spins
    useEffect(() => {
        let timer: number;
        if (isFreeSpinMode && freeSpinsRemaining > 0 && !isSpinning && !isAutoSpin) {
            timer = window.setTimeout(() => {
                spin();
            }, 2000);
        }
        return () => clearTimeout(timer);
    }, [isFreeSpinMode, freeSpinsRemaining, isSpinning, isAutoSpin, spin]);

    return {
        credits,
        jackpot,
        betAmount,
        setBetAmount,
        spin,
        isSpinning,
        result: lastResult,
        message,
        isAutoSpin,
        toggleAutoSpin,
        freeSpinsRemaining,
        isFreeSpinMode,
        betPerLine: betAmount / NUM_PAYLINES
    };
};
