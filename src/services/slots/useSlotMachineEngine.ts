import { useState, useCallback, useEffect, useMemo } from 'react';
import { loadProfiles, saveProfiles, loadJackpot, saveJackpot } from '../profileStore';
import { SlotRules, SpinResult } from './SlotRules';
import { playSound } from '../sound';

const JACKPOT_CONTRIBUTION_RATE = 0.3; // 30% of bet goes to jackpot (Super High!)

export const useSlotMachineEngine = (playerName: string) => {
    const [credits, setCredits] = useState(0);
    const [jackpot, setJackpot] = useState(10000);
    const [betAmount, setBetAmount] = useState(10);
    const [isSpinning, setIsSpinning] = useState(false);
    const [lastResult, setLastResult] = useState<SpinResult | null>(null);
    const [message, setMessage] = useState('準備開始');

    const rules = useMemo(() => new SlotRules(), []);

    // Load initial state
    useEffect(() => {
        const profiles = loadProfiles();
        let user = profiles[playerName];

        // Create guest profile if missing (similar to validateLobbyEntry logic logic, but simple here)
        if (!user) {
            // Should handle via main App, but for safety:
            user = { name: playerName, chips: 1000, wins: 0, losses: 0, games: 0, debt: 0 };
        }

        setCredits(user.chips);
        setJackpot(loadJackpot());
    }, [playerName]);

    const [isAutoSpin, setIsAutoSpin] = useState(false);

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
        if (credits < betAmount) {
            setMessage('籌碼不足！');
            setIsAutoSpin(false);
            return;
        }

        // ... rest of function ... same until setLastResult

        setIsSpinning(true);
        setMessage(isAutoSpin ? '自動轉動中...' : '轉動中...');

        playSound('chip-place');

        // Deduct bet
        const currentCredits = credits - betAmount;
        updateCredits(currentCredits);

        // Increase Jackpot
        const contribution = Math.floor(betAmount * JACKPOT_CONTRIBUTION_RATE);
        const newJackpot = jackpot + contribution;
        setJackpot(newJackpot);
        saveJackpot(newJackpot);

        // Artificial delay for "spinning"
        setTimeout(() => {
            playSound('chip-stack');
            const result = rules.spin(betAmount);
            setLastResult(result);
            setIsSpinning(false);

            let win = result.winAmount;
            let finalJackpot = newJackpot;

            if (result.isJackpot) {
                win += newJackpot;
                finalJackpot = 10000; // Reset Jackpot
                setMessage(`恭喜中大獎！贏得 $${win.toLocaleString()}！`);
                saveJackpot(finalJackpot);
                setJackpot(finalJackpot);
                setIsAutoSpin(false); // Stop auto on Jackpot
            } else if (win > 0) {
                setMessage(`贏得 $${win.toLocaleString()}！`);
            } else {
                setMessage('再接再厲');
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

        }, 2000); // 2 seconds spin
    }, [credits, betAmount, isSpinning, jackpot, playerName, rules, updateCredits, isAutoSpin]);

    // Auto Spin Effect
    useEffect(() => {
        let timer: number;
        if (isAutoSpin && !isSpinning && credits >= betAmount) {
            timer = window.setTimeout(() => {
                spin();
            }, 1500); // 1.5s delay between spins
        } else if (isAutoSpin && credits < betAmount) {
            setIsAutoSpin(false); // Stop if out of money
            setMessage('籌碼不足，自動停止');
        }
        return () => clearTimeout(timer);
    }, [isAutoSpin, isSpinning, credits, betAmount, spin]);

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
        toggleAutoSpin
    };
};
