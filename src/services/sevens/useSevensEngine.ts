import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, NPCProfile } from '../../types';
import { createDeck } from '../pokerLogic';
import { playSound } from '../sound';
import { SevensBoard, SevensPhase, SevensPlayer, SevensSeat, SevensResult, SevensGameVariant } from './types';
import {
    initializeBoard,
    getPlayableCards,
    playCard as applyPlayCard,
    cardKey,
    sortCards,
    hasSpade7,
    getNextActiveIndex,
    isGameOver,
    calculateScore
} from './rules';
import { aiChooseAction, mustPass } from './ai';

export interface PayoutLine {
    name: string;
    passedCount: number;
    passedScore: number;
    amount: number;
}

export interface PayoutSummary {
    winnerName: string;
    baseBet: number;
    totalGain: number;
    lines: PayoutLine[];
}

export interface UseSevensEngineParams {
    seats: SevensSeat[];
    baseBet: number;
    npcProfiles: NPCProfile[];
    variant: SevensGameVariant;
    nightmareMode?: boolean; // 🔥 Enable AI targeting
    onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: SevensResult }>) => void;
}

export const useSevensEngine = ({
    seats,
    baseBet,
    npcProfiles: _npcProfiles, // eslint-disable-line @typescript-eslint/no-unused-vars
    variant: _variant, // eslint-disable-line @typescript-eslint/no-unused-vars
    nightmareMode = false,
    onProfilesUpdate
}: UseSevensEngineParams) => {
    const [players, setPlayers] = useState<SevensPlayer[]>([]);
    const [board, setBoard] = useState<SevensBoard>(initializeBoard());
    const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
    const [phase, setPhase] = useState<SevensPhase>('DEALING');
    const [finishedOrder, setFinishedOrder] = useState<number[]>([]);
    const [message, setMessage] = useState('');
    const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
    const [isFirstMove, setIsFirstMove] = useState(true);

    const aiTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const finishGameRef = useRef<((finalPlayers: SevensPlayer[]) => void) | null>(null);

    // Initialize game
    const initializeGame = useCallback(() => {
        // Create and shuffle deck
        const deck = createDeck();
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }

        // Deal cards to players
        const numPlayers = seats.length;
        const cardsPerPlayer = Math.floor(52 / numPlayers);
        const newPlayers: SevensPlayer[] = seats.map((seat, idx) => {
            const start = idx * cardsPerPlayer;
            const end = idx === numPlayers - 1 ? 52 : start + cardsPerPlayer;
            const hand = sortCards(deck.slice(start, end));

            // Assign tactic for AI players
            const tactics = ['BAIT', 'CONSERVATIVE', 'AGGRESSIVE', 'DECEPTIVE'] as const;
            const tactic = seat.isAI ? tactics[Math.floor(Math.random() * tactics.length)] : undefined;

            return {
                ...seat,
                hand,
                passedCards: [],
                finished: false,
                quote: undefined,
                tactic
            };
        });

        // Find player with Spade 7
        const firstPlayerIdx = newPlayers.findIndex(p => hasSpade7(p.hand));

        setPlayers(newPlayers);
        setBoard(initializeBoard());
        setCurrentTurnIndex(firstPlayerIdx >= 0 ? firstPlayerIdx : 0);
        setFinishedOrder([]);
        setPhase('PLAYING');
        setMessage('');
        setPayoutSummary(null);
        setIsFirstMove(true);

        playSound('shuffle');
    }, [seats]);

    // Player plays a card
    const handlePlayCard = useCallback((playerIndex: number, card: Card): boolean => {
        if (phase !== 'PLAYING') return false;
        if (playerIndex !== currentTurnIndex) return false;

        const player = players[playerIndex];
        if (!player || player.finished) return false;

        // Check if card is playable
        const playable = getPlayableCards(player.hand, board);
        if (!playable.some(c => cardKey(c) === cardKey(card))) {
            setMessage('這張牌無法出！');
            return false;
        }

        // First move must be Spade 7
        if (isFirstMove && !(card.suit === 'Spades' && card.rank === '7')) {
            setMessage('首家必須出黑桃七！');
            return false;
        }

        // Play the card
        const newBoard = applyPlayCard(card, board);
        const newHand = player.hand.filter(c => cardKey(c) !== cardKey(card));

        const newPlayers = [...players];
        newPlayers[playerIndex] = {
            ...player,
            hand: newHand,
            finished: newHand.length === 0
        };

        setBoard(newBoard);
        setPlayers(newPlayers);
        setMessage('');
        setIsFirstMove(false);

        playSound('chip');

        // Check if player finished
        if (newHand.length === 0) {
            setFinishedOrder(prev => [...prev, playerIndex]);
        }

        // Check game over
        if (isGameOver(newPlayers)) {
            finishGameRef.current?.(newPlayers);
        } else {
            // Move to next player
            setCurrentTurnIndex(getNextActiveIndex(newPlayers, playerIndex));
        }

        return true;
    }, [phase, currentTurnIndex, players, board, isFirstMove]);

    // Player passes a card
    const handlePassCard = useCallback((playerIndex: number, card: Card): boolean => {
        if (phase !== 'PLAYING') return false;
        if (playerIndex !== currentTurnIndex) return false;

        const player = players[playerIndex];
        if (!player || player.finished) return false;

        // Can only pass if no playable cards
        const playable = getPlayableCards(player.hand, board);
        if (playable.length > 0) {
            setMessage('還有可以出的牌！');
            return false;
        }

        // Remove card from hand and add to passed pile
        const newHand = player.hand.filter(c => cardKey(c) !== cardKey(card));
        const newPassedCards = [...player.passedCards, card];

        const newPlayers = [...players];
        newPlayers[playerIndex] = {
            ...player,
            hand: newHand,
            passedCards: newPassedCards,
            finished: newHand.length === 0
        };

        setPlayers(newPlayers);
        setMessage('');

        playSound('fold');

        // Check if player finished
        if (newHand.length === 0) {
            setFinishedOrder(prev => [...prev, playerIndex]);
        }

        // Check game over
        if (isGameOver(newPlayers)) {
            finishGameRef.current?.(newPlayers);
        } else {
            // Move to next player
            setCurrentTurnIndex(getNextActiveIndex(newPlayers, playerIndex));
        }

        return true;
    }, [phase, currentTurnIndex, players, board]);

    // Finish game and calculate payouts
    const finishGame = useCallback((finalPlayers: SevensPlayer[]) => {
        setPhase('RESULT');

        // Calculate scores
        const scores = finalPlayers.map((p, idx) => ({
            idx,
            name: p.name,
            passedScore: calculateScore([...p.passedCards, ...p.hand]),
            passedCount: p.passedCards.length + p.hand.length
        }));

        // Sort by: 1) finished order (earlier = better), 2) lower pass score
        scores.sort((a, b) => {
            const aFinishOrder = finishedOrder.indexOf(a.idx);
            const bFinishOrder = finishedOrder.indexOf(b.idx);
            const aFinished = aFinishOrder >= 0;
            const bFinished = bFinishOrder >= 0;

            if (aFinished && !bFinished) return -1;
            if (!aFinished && bFinished) return 1;
            if (aFinished && bFinished) return aFinishOrder - bFinishOrder;
            return a.passedScore - b.passedScore;
        });

        const winner = scores[0];
        const losers = scores.slice(1);

        // Calculate payouts
        let totalGain = 0;
        const lines: PayoutLine[] = losers.map(loser => {
            const amount = loser.passedScore * baseBet;
            totalGain += amount;
            return {
                name: loser.name,
                passedCount: loser.passedCount,
                passedScore: loser.passedScore,
                amount: -amount
            };
        });

        // Update player chips
        const updates: Array<{ name: string; chips: number; result: SevensResult }> = [];
        const newPlayers = [...finalPlayers];

        newPlayers.forEach((p, idx) => {
            const score = scores.find(s => s.idx === idx);
            if (!score) return;

            if (idx === winner.idx) {
                p.chips += totalGain;
                updates.push({ name: p.name, chips: p.chips, result: 'WIN' });
            } else {
                const loss = score.passedScore * baseBet;
                p.chips -= loss;
                updates.push({ name: p.name, chips: p.chips, result: 'LOSE' });
            }
        });

        setPlayers(newPlayers);
        setPayoutSummary({
            winnerName: winner.name,
            baseBet,
            totalGain,
            lines
        });

        onProfilesUpdate(updates);
        playSound('win');
    }, [baseBet, finishedOrder, onProfilesUpdate]);

    // Assign finishGame to ref for use in handlers defined before it
    useEffect(() => {
        finishGameRef.current = finishGame;
    }, [finishGame]);

    // AI turn handler
    useEffect(() => {
        if (phase !== 'PLAYING') return;

        const current = players[currentTurnIndex];
        if (!current || !current.isAI || current.finished) return;

        // Find human player index for targeting
        const humanPlayerIndex = players.findIndex(p => !p.isAI);

        aiTimerRef.current = setTimeout(() => {
            const decision = aiChooseAction(current, board, isFirstMove, {
                allPlayers: players,
                humanPlayerIndex,
                nightmareMode
            });
            if (decision) {
                if (decision.action === 'PLAY') {
                    handlePlayCard(currentTurnIndex, decision.card);
                } else {
                    handlePassCard(currentTurnIndex, decision.card);
                }
            }
        }, 800 + Math.random() * 600);

        return () => {
            if (aiTimerRef.current) clearTimeout(aiTimerRef.current);
        };
    }, [phase, currentTurnIndex, players, board, isFirstMove, handlePlayCard, handlePassCard, nightmareMode]);

    // Initialize on mount
    useEffect(() => {
        if (seats.length > 0 && players.length === 0) {
            initializeGame();
        }
    }, [seats, players.length, initializeGame]);

    return {
        players,
        board,
        currentTurnIndex,
        phase,
        finishedOrder,
        message,
        setMessage,
        payoutSummary,
        isFirstMove,
        initializeGame,
        handlePlayCard,
        handlePassCard,
        canPass: useCallback((playerIndex: number) => {
            const player = players[playerIndex];
            if (!player) return false;
            return mustPass(player.hand, board);
        }, [players, board])
    };
};
