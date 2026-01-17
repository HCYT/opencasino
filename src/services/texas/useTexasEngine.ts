import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Player, GameState, GamePhase, Card, ActionType, NPCProfile } from '../../types';
import { createDeck } from '../pokerLogic';
import { MIN_BET } from '../../constants';
import { playSound as defaultPlaySound } from '../sound';
import { TexasHoldemRules } from './rules';

export interface TexasEngineOptions {
    npcProfiles?: NPCProfile[];
    playSound?: (name: string) => void;
}

// Helper to get random quote
const getQuote = (profiles: NPCProfile[], name: string, type: keyof NPCProfile['quotes']): string | undefined => {
    const profile = profiles.find(p => p.name === name);
    if (!profile) return undefined;
    const quotes = profile.quotes[type];
    if (!quotes || quotes.length === 0) return undefined;
    const chance = (type === 'ALL_IN' || type === 'WIN') ? 1.0 : 0.4;
    if (Math.random() > chance) return undefined;
    return quotes[Math.floor(Math.random() * quotes.length)];
};

export const useTexasEngine = (options: TexasEngineOptions = {}) => {
    const npcProfiles = options.npcProfiles ?? [];
    const playSound = options.playSound ?? defaultPlaySound;
    const rules = new TexasHoldemRules();

    const [gameState, setGameState] = useState<GameState>({
        players: [],
        pot: 0,
        deck: [],
        phase: GamePhase.SETTING,
        activePlayerIndex: 0,
        currentMaxBet: 0,
        winners: [],
        log: [],
        betMode: 'NO_LIMIT',
        communityCards: [],
        buyInChips: undefined
    });

    const gameLoopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessingTurn = useRef(false);
    const latestStateRef = useRef<GameState>(gameState);
    const roundStartIndex = useRef(0);
    const lastAggressorIndex = useRef<number | null>(null);
    const raiseCount = useRef(0);
    const actedThisRound = useRef<Set<string>>(new Set()); // Track which players have acted this betting round
    const quoteTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

    const smallBlind = Math.max(1, Math.floor(MIN_BET / 2));
    const bigBlind = MIN_BET;

    useEffect(() => {
        latestStateRef.current = gameState;
    }, [gameState]);

    const setQuote = (playerId: string, quote: string, setGame: Dispatch<SetStateAction<GameState>>) => {
        if (!quote) return;
        if (quoteTimeoutRef.current[playerId]) {
            clearTimeout(quoteTimeoutRef.current[playerId]);
        }
        setGame(prev => ({
            ...prev,
            players: prev.players.map(p => p.id === playerId ? { ...p, currentQuote: quote } : p)
        }));
        quoteTimeoutRef.current[playerId] = setTimeout(() => {
            setGame(prev => ({
                ...prev,
                players: prev.players.map(p => p.id === playerId ? { ...p, currentQuote: undefined } : p)
            }));
            delete quoteTimeoutRef.current[playerId];
        }, 4000);
    };

    const getNextActiveIndex = (players: Player[], start: number) => {
        let next = (start + 1) % players.length;
        let loops = 0;
        while (loops < players.length) {
            const candidate = players[next];
            if (!candidate.isFolded && candidate.chips > 0) return next;
            next = (next + 1) % players.length;
            loops++;
        }
        return start;
    };

    const calculatePayouts = (players: Player[], pot: number) => {
        const active = players.filter(p => !p.isFolded);
        if (active.length === 0) return { payouts: {}, winners: [] };
        if (active.length === 1) {
            return { payouts: { [active[0].id]: pot }, winners: [active[0].id] };
        }

        const winners = rules.evaluateWinner(players, latestStateRef.current.communityCards || []);
        if (winners.length === 0) return { payouts: {}, winners: [] };

        const share = Math.floor(pot / winners.length);
        let remainder = pot - share * winners.length;
        const payouts: Record<string, number> = {};
        winners.forEach(id => {
            const extra = remainder > 0 ? 1 : 0;
            if (remainder > 0) remainder--;
            payouts[id] = share + extra;
        });

        return { payouts, winners };
    };

    const initGame = (
        initialPlayers: Player[],
        _teaming = false, // eslint-disable-line @typescript-eslint/no-unused-vars
        betMode: 'FIXED_LIMIT' | 'NO_LIMIT' = 'NO_LIMIT'
    ) => {
        const buyInChips = initialPlayers.find(p => !p.isAI)?.chips ?? initialPlayers[0]?.chips ?? MIN_BET * 100;
        setGameState({
            players: initialPlayers,
            pot: 0,
            deck: [],
            phase: GamePhase.SETTING,
            activePlayerIndex: 0,
            currentMaxBet: 0,
            winners: [],
            log: ['歡迎來到德州撲克！'],
            betMode,
            communityCards: [],
            buyInChips
        });
        startNewHand(initialPlayers);
    };

    const startNewHand = (players: Player[]) => {
        const buyInChips = latestStateRef.current.buyInChips ?? players[0]?.chips ?? MIN_BET * 100;
        const activePlayers = players.filter(p => p.chips >= bigBlind);

        if (activePlayers.length < 2) {
            const winner = activePlayers[0];
            setGameState(prev => ({
                ...prev,
                players: activePlayers,
                phase: GamePhase.SETTING,
                winners: winner ? [winner.id] : [],
                log: [`🏆 最終大贏家：${winner ? winner.name : '無'}`, ...prev.log]
            }));
            playSound('slot-win');
            return;
        }

        const deck = createDeck();
        const deckCopy = [...deck];

        // Reset players and deal 2 hole cards
        const resetPlayers = activePlayers.map(p => ({
            ...p,
            cards: [] as Card[],
            currentBet: 0,
            totalBet: 0,
            isFolded: false,
            lastAction: '',
            currentQuote: undefined
        }));

        // Deal 2 cards to each player (face down for data, UI shows if isMe)
        resetPlayers.forEach(p => {
            p.cards.push({ ...deckCopy.pop()!, isFaceUp: false });
            p.cards.push({ ...deckCopy.pop()!, isFaceUp: false });
        });

        // Post blinds (simplified: SB = index 1, BB = index 2 in a 4-player game, or adjust)
        // For simplicity, let's use: Player 0 = Dealer Button, Player 1 = SB, Player 2 = BB
        const sbIndex = resetPlayers.length > 2 ? 1 : 0;
        const bbIndex = resetPlayers.length > 2 ? 2 : (resetPlayers.length > 1 ? 1 : 0);

        const sbAmount = Math.min(smallBlind, resetPlayers[sbIndex].chips);
        const bbAmount = Math.min(bigBlind, resetPlayers[bbIndex].chips);

        resetPlayers[sbIndex] = {
            ...resetPlayers[sbIndex],
            chips: resetPlayers[sbIndex].chips - sbAmount,
            currentBet: sbAmount,
            totalBet: sbAmount,
            lastAction: '小盲'
        };
        resetPlayers[bbIndex] = {
            ...resetPlayers[bbIndex],
            chips: resetPlayers[bbIndex].chips - bbAmount,
            currentBet: bbAmount,
            totalBet: bbAmount,
            lastAction: '大盲'
        };

        // First to act is UTG (player after BB)
        const firstToAct = getNextActiveIndex(resetPlayers, bbIndex);
        const initialPot = sbAmount + bbAmount;

        playSound('card-deal');

        roundStartIndex.current = firstToAct;
        // BB posted a forced bet, but hasn't "acted" yet - they get an option
        // So we DON'T set lastAggressorIndex to BB, otherwise round might end prematurely
        lastAggressorIndex.current = null;
        raiseCount.current = 0;
        actedThisRound.current = new Set(); // Clear - SB and BB have NOT acted yet, only posted blinds

        setGameState(prev => ({
            ...prev,
            players: resetPlayers,
            deck: deckCopy,
            pot: initialPot,
            currentMaxBet: bbAmount,
            phase: GamePhase.PRE_FLOP,
            activePlayerIndex: firstToAct,
            winners: [],
            communityCards: [],
            log: [`新局開始，盲注 ${smallBlind}/${bigBlind}`, ...prev.log],
            buyInChips
        }));
    };

    const nextPhase = (currentState: GameState): GameState => {
        const { phase, players, deck, pot, communityCards } = currentState;
        const nextP = rules.getNextPhase(phase, players);

        // Handle Showdown -> Result transition
        if (nextP === GamePhase.SHOWDOWN || nextP === GamePhase.RESULT) {
            const { payouts, winners } = calculatePayouts(players, pot);

            const updatedPlayers = players.map(p => {
                const gain = payouts[p.id] || 0;
                return gain > 0 ? { ...p, chips: p.chips + gain } : p;
            });

            // Play sound based on whether PLAYER won
            const playerWon = winners.includes('player');
            playSound(playerWon ? 'slot-win' : 'chip-fold');

            // Trigger WIN/LOSE Quotes
            const updatedPlayersWithQuotes = updatedPlayers.map(p => {
                if (p.isAI) {
                    const type = winners.includes(p.id) ? 'WIN' : 'LOSE';
                    const quote = getQuote(npcProfiles, p.name, type);
                    if (quote) return { ...p, currentQuote: quote };
                }
                return p;
            });

            return {
                ...currentState,
                phase: GamePhase.RESULT,
                winners,
                players: updatedPlayersWithQuotes,
                log: [`${winners.length}位贏家贏得底池 $${pot}！`, ...currentState.log]
            };
        }

        playSound('card-deal');

        // Deal community cards based on phase
        const { updatedDeck, updatedCommunityCards } = rules.dealCards(deck, players, nextP);

        // APPEND new community cards to existing ones
        const newCommunityCards = [...(communityCards || []), ...(updatedCommunityCards || [])];

        // Reset bets for new round
        const bettingPlayers = players.map(p => ({ ...p, currentBet: 0, lastAction: '' }));

        // First to act post-flop is usually SB or first active player after dealer
        const firstActive = bettingPlayers.findIndex(p => !p.isFolded && p.chips > 0);
        const bestIdx = firstActive >= 0 ? firstActive : 0;

        roundStartIndex.current = bestIdx;
        lastAggressorIndex.current = null;
        raiseCount.current = 0;
        actedThisRound.current = new Set(); // Clear acted players for new betting round

        return {
            ...currentState,
            deck: updatedDeck,
            players: bettingPlayers,
            communityCards: newCommunityCards,
            phase: nextP,
            currentMaxBet: 0,
            activePlayerIndex: bestIdx,
            log: [`發牌：${nextP}`, ...currentState.log]
        };
    };

    // Auto-advance when all-in scenario or when in SHOWDOWN phase
    useEffect(() => {
        if (gameState.phase === GamePhase.SETTING || gameState.phase === GamePhase.RESULT) return;

        // Auto-advance from SHOWDOWN to RESULT
        if (gameState.phase === GamePhase.SHOWDOWN) {
            if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
            gameLoopTimeout.current = setTimeout(() => {
                setGameState(current => {
                    if (current.phase === GamePhase.RESULT) return current;
                    return nextPhase(current);
                });
            }, 1500);
            return;
        }

        const active = gameState.players.filter(p => !p.isFolded);
        const capable = active.filter(p => p.chips > 0);
        const allMatched = active.every(p => p.chips === 0 || p.currentBet === gameState.currentMaxBet);

        if (capable.length < 2 && allMatched && active.length >= 2) {
            if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
            gameLoopTimeout.current = setTimeout(() => {
                setGameState(current => {
                    if (current.phase === GamePhase.RESULT) return current;
                    return nextPhase(current);
                });
            }, 1500);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.phase, gameState.players, gameState.currentMaxBet]);

    const handleAction = async (action: ActionType, amount: number = 0, taunt?: string, actorId?: string) => {
        let queuedQuote: { playerId: string; quote: string } | null = null;

        setGameState(current => {
            const { players, activePlayerIndex, pot, currentMaxBet } = current;
            let p = players[activePlayerIndex];
            if (!p) return current;
            if (actorId && p.id !== actorId) return current;

            const callNeeded = currentMaxBet - p.currentBet;
            const minRaise = bigBlind;

            // Determine Quote Type
            let quoteType: keyof NPCProfile['quotes'] | undefined;
            if (action === 'FOLD') quoteType = 'FOLD';
            else if (action === 'CHECK') quoteType = 'CHECK';
            else if (action === 'CALL') quoteType = 'CALL';
            else if (action === 'RAISE') quoteType = 'RAISE';
            else if (action === 'ALL_IN') quoteType = 'ALL_IN';

            let quote = taunt;
            if (!quote && p.isAI && quoteType) {
                quote = getQuote(npcProfiles, p.name, quoteType);
            }

            if (quote) {
                queuedQuote = { playerId: p.id, quote };
                p = { ...p, currentQuote: quote };
            }

            const newPlayers = [...players];
            let newPot = pot;
            let newMaxBet = currentMaxBet;

            if (action === 'FOLD') {
                newPlayers[activePlayerIndex] = { ...p, isFolded: true, lastAction: '棄牌' };
                playSound('chip-fold');

                // Check if only one player left
                const remaining = newPlayers.filter(pl => !pl.isFolded);
                if (remaining.length === 1) {
                    return nextPhase({ ...current, players: newPlayers, pot: newPot, currentMaxBet: newMaxBet });
                }
            } else if (action === 'ALL_IN') {
                const amt = p.chips;
                const allInTotal = p.currentBet + amt;
                newPlayers[activePlayerIndex] = {
                    ...p,
                    chips: 0,
                    currentBet: allInTotal,
                    totalBet: (p.totalBet ?? 0) + amt,
                    lastAction: '全下!',
                    currentQuote: quote || p.currentQuote
                };
                newPot += amt;
                if (allInTotal > currentMaxBet) {
                    newMaxBet = allInTotal;
                    lastAggressorIndex.current = activePlayerIndex;
                    raiseCount.current += 1;
                }
                playSound('chip-allin');
            } else if (action === 'CALL' || action === 'CHECK') {
                const amt = Math.min(p.chips, callNeeded);
                newPlayers[activePlayerIndex] = {
                    ...p,
                    chips: p.chips - amt,
                    currentBet: p.currentBet + amt,
                    totalBet: (p.totalBet ?? 0) + amt,
                    lastAction: callNeeded > 0 ? '跟注' : '過牌',
                    currentQuote: quote || p.currentQuote
                };
                newPot += amt;
                playSound(callNeeded > 0 ? 'chip-place' : 'card-deal');
            } else if (action === 'RAISE') {
                const raiseAmt = Math.max(minRaise, amount);
                const total = Math.min(p.chips, callNeeded + raiseAmt);
                newPlayers[activePlayerIndex] = {
                    ...p,
                    chips: p.chips - total,
                    currentBet: p.currentBet + total,
                    totalBet: (p.totalBet ?? 0) + total,
                    lastAction: `加注 ${raiseAmt}`,
                    currentQuote: quote || p.currentQuote
                };
                newPot += total;
                newMaxBet = newPlayers[activePlayerIndex].currentBet;
                lastAggressorIndex.current = activePlayerIndex;
                raiseCount.current += 1;
                playSound('chip-place');
            }

            // Check if betting round is complete
            const nextIdx = getNextActiveIndex(newPlayers, activePlayerIndex);
            const activeNotFolded = newPlayers.filter(pl => !pl.isFolded);
            const activeCapable = activeNotFolded.filter(pl => pl.chips > 0);
            const allMatchedNow = activeNotFolded.every(pl => pl.chips === 0 || pl.currentBet === newMaxBet);

            // Track this player's action
            actedThisRound.current.add(p.id);

            let phaseDone = false;
            if (allMatchedNow) {
                // Round is done when:
                // 1. Only 0-1 players can still bet (all-in scenario)
                // 2. OR we've completed a full orbit after last raise
                // 3. OR everyone has acted at least once with no raises
                const allActiveHaveActed = activeNotFolded.every(pl => actedThisRound.current.has(pl.id));

                if (activeCapable.length <= 1) {
                    phaseDone = true;
                } else if (lastAggressorIndex.current !== null) {
                    // If there was a raise, check if we've gone back to raiser
                    phaseDone = nextIdx === lastAggressorIndex.current;
                } else {
                    // No raises: everyone must have acted at least once
                    phaseDone = allActiveHaveActed;
                }
            }

            const nextState = { ...current, players: newPlayers, pot: newPot, currentMaxBet: newMaxBet };

            if (phaseDone) {
                return nextPhase(nextState);
            } else {
                return { ...nextState, activePlayerIndex: nextIdx };
            }
        });

        if (queuedQuote) {
            const { playerId, quote } = queuedQuote;
            setQuote(playerId, quote, setGameState);
        }
    };

    const playerSpeak = (quote: string) => {
        setQuote('player', quote, setGameState);
        setGameState(prev => ({
            ...prev,
            log: [`玩家：${quote}`, ...prev.log]
        }));
    };

    // AI Turn Effect
    useEffect(() => {
        const isBettingPhase = [GamePhase.PRE_FLOP, GamePhase.FLOP, GamePhase.TURN, GamePhase.RIVER].includes(gameState.phase);
        if (!isBettingPhase) return;

        const current = gameState.players[gameState.activePlayerIndex];
        if (!current || current.isFolded) return;

        if (current.chips === 0) {
            if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
            gameLoopTimeout.current = setTimeout(() => {
                handleAction('CHECK', 0, undefined, current.id);
            }, 500);
            return () => {
                if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
            };
        }

        if (!current.isAI) return;
        if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);

        gameLoopTimeout.current = setTimeout(async () => {
            if (isProcessingTurn.current) return;
            isProcessingTurn.current = true;
            try {
                const latest = latestStateRef.current;
                const latestPlayer = latest.players[latest.activePlayerIndex];
                if (!latestPlayer || !latestPlayer.isAI || latestPlayer.isFolded || latestPlayer.chips <= 0) return;
                const move = await rules.getAIAction(latestPlayer, latest);
                await handleAction(move.action, move.amount || 0, move.taunt, latestPlayer.id);
            } catch (error) {
                console.error('AI Error', error);
                await handleAction('FOLD', 0);
            } finally {
                isProcessingTurn.current = false;
            }
        }, 1200);

        return () => {
            if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.activePlayerIndex, gameState.phase]);

    const returnToLobby = () => {
        setGameState({
            players: [],
            pot: 0,
            deck: [],
            phase: GamePhase.SETTING,
            activePlayerIndex: 0,
            currentMaxBet: 0,
            winners: [],
            log: [],
            betMode: 'NO_LIMIT',
            communityCards: [],
            buyInChips: gameState.buyInChips
        });
    };

    return {
        gameState,
        initGame,
        handleAction,
        startNewHand: () => startNewHand(gameState.players),
        playerSpeak,
        returnToLobby
    };
};
