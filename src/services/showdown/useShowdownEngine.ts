import { useState, useRef, useEffect, type Dispatch, type SetStateAction } from 'react';
import { Player, GameState, GamePhase, Card, ActionType, IPokerRules, NPCProfile } from '../../types';
import { createDeck, evaluateHand } from '../pokerLogic';
import { MIN_BET, SUIT_VALUE } from '../../constants';
import { playSound as defaultPlaySound } from '../sound';

export interface ShowdownEngineOptions {
    npcProfiles?: NPCProfile[];
    playSound?: (name: string) => void;
}

// Helper to get random quote
const getQuote = (profiles: NPCProfile[], name: string, type: keyof NPCProfile['quotes']): string | undefined => {
    const profile = profiles.find(p => p.name === name);
    if (!profile) return undefined;
    const quotes = profile.quotes[type];
    if (!quotes || quotes.length === 0) return undefined;
    // 30% chance to speak on normal actions, 100% on All-In / Win
    const chance = (type === 'ALL_IN' || type === 'WIN') ? 1.0 : 0.4;
    if (Math.random() > chance) return undefined;

    return quotes[Math.floor(Math.random() * quotes.length)];
};

export const useGameEngine = (initialRules: IPokerRules, options: ShowdownEngineOptions = {}) => {
    const npcProfiles = options.npcProfiles ?? [];
    const playSound = options.playSound ?? defaultPlaySound;
    const [gameState, setGameState] = useState<GameState>({
        players: [],
        pot: 0,
        deck: [],
        phase: GamePhase.SETTING,
        activePlayerIndex: 0,
        currentMaxBet: 0,
        winners: [],
        log: [],
        betMode: 'FIXED_LIMIT',
        buyInChips: undefined
    });

    const rulesRef = useRef<IPokerRules>(initialRules);
    const gameLoopTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isProcessingTurn = useRef(false);
    const latestStateRef = useRef<GameState>(gameState);

    // Track who started the current betting round (first talker) to ensure full circle check
    // Actually, simpler is to track 'lastAggressorIndex'. 
    // If we go back to lastAggressor without new raises, round ends.
    // If Check-Check, we need to track if we circled back to StartIndex.
    const roundStartIndex = useRef(0);
    const lastAggressorIndex = useRef<number | null>(null);
    const raiseCount = useRef(0);
    const maxRaisesPerRound = 3;
    const quoteTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

    const bringInAmount = Math.max(1, Math.floor(MIN_BET / 2));

    const getBetSizeForPhase = (phase: GamePhase) => {
        if (phase === GamePhase.BETTING_4 || phase === GamePhase.BETTING_5) return MIN_BET * 2;
        return MIN_BET;
    };

    const getHighSuitValue = (cards: Card[]) => {
        let attachedSuit = 0;
        let highValue = -1;
        cards.forEach(c => {
            const suitValue = SUIT_VALUE[c.suit];
            if (c.value > highValue || (c.value === highValue && suitValue > attachedSuit)) {
                highValue = c.value;
                attachedSuit = suitValue;
            }
        });
        return attachedSuit;
    };

    const getBringInIndex = (players: Player[]) => {
        let idx = -1;
        let lowValue = Number.POSITIVE_INFINITY;
        let lowSuit = Number.POSITIVE_INFINITY;
        players.forEach((p, i) => {
            if (p.isFolded) return;
            const upCard = p.cards.find(c => c.isFaceUp);
            if (!upCard) return;
            const suitValue = SUIT_VALUE[upCard.suit];
            if (upCard.value < lowValue || (upCard.value === lowValue && suitValue < lowSuit)) {
                lowValue = upCard.value;
                lowSuit = suitValue;
                idx = i;
            }
        });
        if (idx === -1) idx = players.findIndex(p => !p.isFolded);
        return idx === -1 ? 0 : idx;
    };

    const getHighestVisibleIndex = (players: Player[]) => {
        let bestIdx = -1;
        let bestScore = -1;
        let bestSuit = -1;
        players.forEach((p, i) => {
            if (p.isFolded || p.chips === 0) return;
            const faceUp = p.cards.filter(c => c.isFaceUp);
            if (faceUp.length === 0) return;
            const score = evaluateHand(faceUp).score;
            const suitTie = getHighSuitValue(faceUp);
            if (score > bestScore || (score === bestScore && suitTie > bestSuit)) {
                bestScore = score;
                bestSuit = suitTie;
                bestIdx = i;
            }
        });
        if (bestIdx === -1) bestIdx = players.findIndex(p => !p.isFolded && p.chips > 0);
        if (bestIdx === -1) bestIdx = players.findIndex(p => !p.isFolded);
        return bestIdx === -1 ? 0 : bestIdx;
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

    useEffect(() => {
        latestStateRef.current = gameState;
    }, [gameState]);

    // Helper to set quote with auto-clear
    const setQuote = (playerId: string, quote: string, setGame: Dispatch<SetStateAction<GameState>>) => {
        if (!quote) return;

        // Clear existing timeout for this player
        if (quoteTimeoutRef.current[playerId]) {
            clearTimeout(quoteTimeoutRef.current[playerId]);
        }

        setGame(prev => ({
            ...prev,
            players: prev.players.map(p => p.id === playerId ? { ...p, currentQuote: quote } : p)
        }));

        // Auto clear after 4 seconds
        quoteTimeoutRef.current[playerId] = setTimeout(() => {
            setGame(prev => ({
                ...prev,
                players: prev.players.map(p => p.id === playerId ? { ...p, currentQuote: undefined } : p)
            }));
            delete quoteTimeoutRef.current[playerId];
        }, 4000);
    };

    const calculatePayouts = (players: Player[]) => {
        const payouts: Record<string, number> = {};
        const contestWinners = new Set<string>();
        const contributions = players.map(p => ({
            id: p.id,
            bet: Math.max(0, p.totalBet ?? p.currentBet),
            isFolded: p.isFolded,
            score: p.isFolded ? -1 : evaluateHand(p.cards).score
        }));

        const levels = Array.from(new Set(contributions.map(c => c.bet).filter(b => b > 0))).sort((a, b) => a - b);
        let prev = 0;

        levels.forEach(level => {
            const layerPlayers = contributions.filter(c => c.bet >= level);
            const layerSize = level - prev;
            const layerPot = layerSize * layerPlayers.length;
            const eligible = layerPlayers.filter(c => !c.isFolded);

            if (layerSize > 0 && layerPlayers.length === 1) {
                const solo = layerPlayers[0];
                payouts[solo.id] = (payouts[solo.id] || 0) + layerSize;
                prev = level;
                return;
            }

            if (eligible.length > 0 && layerPot > 0) {
                const bestScore = Math.max(...eligible.map(e => e.score));
                const winners = eligible.filter(e => e.score === bestScore).map(e => e.id);
                const share = Math.floor(layerPot / winners.length);
                let remainder = layerPot - share * winners.length;

                winners.forEach(id => {
                    const extra = remainder > 0 ? 1 : 0;
                    if (remainder > 0) remainder--;
                    payouts[id] = (payouts[id] || 0) + share + extra;
                    contestWinners.add(id);
                });
            }
            prev = level;
        });

        return { payouts, winners: Array.from(contestWinners) };
    };

    const initGame = (
        initialPlayers: Player[],
        teaming: boolean = false,
        betMode: 'FIXED_LIMIT' | 'NO_LIMIT' = 'FIXED_LIMIT'
    ) => {
        const buyInChips = initialPlayers.find(p => !p.isAI)?.chips ?? initialPlayers[0]?.chips ?? MIN_BET * 10;
        setGameState({
            players: initialPlayers,
            pot: 0,
            deck: [],
            phase: GamePhase.SETTING,
            activePlayerIndex: 0,
            currentMaxBet: 0,
            winners: [],
            log: ['歡迎來到慈善撲克王大賽！'],
            teamingEnabled: teaming,
            betMode,
            buyInChips
        });
        startNewHand(initialPlayers);
    };

    const startNewHand = async (players: Player[]) => {
        const buyInChips = latestStateRef.current.buyInChips ?? players.find(p => !p.isAI)?.chips ?? players[0]?.chips ?? MIN_BET * 10;
        const usedNames = new Set(players.filter(p => !p.isAI || p.chips >= MIN_BET).map(p => p.name));
        const availableNPCs = npcProfiles.filter(npc => !usedNames.has(npc.name));

        let npcIndex = 0;
        const refreshedPlayers = players.map(p => {
            if (!p.isAI || p.chips >= MIN_BET) return p;
            const nextNpc = availableNPCs[npcIndex++];
            if (!nextNpc) return p;
            return {
                ...p,
                name: nextNpc.name,
                avatar: nextNpc.avatar,
                chips: buyInChips,
                currentBet: 0,
                totalBet: 0,
                cards: [],
                isFolded: false,
                lastAction: '',
                currentQuote: undefined
            };
        });

        const activePlayers = refreshedPlayers.filter(p => p.chips >= MIN_BET);

        if (activePlayers.length < 2) {
            const winner = activePlayers[0];
            // If only 1 player remains, the Tournament is Over. 
            // Return to Lobby (SETTING) so they can restart.
            setGameState(prev => ({
                ...prev,
                players: activePlayers, // Keep them to show specific winner if needed, or reset?
                // Actually reset to SETTING defaults usually happens in initGame, but here we just switch phase
                // so the UI shows the Lobby.
                phase: GamePhase.SETTING,
                winners: winner ? [winner.id] : [],
                log: [`🏆 最終大贏家：${winner ? winner.name : '平局'}`, ...prev.log]
            }));
            playSound('slot-win');
            return;
        }

        const deck = createDeck();
        const deck1 = [...deck];

        const resetPlayers = activePlayers.map(p => ({
            ...p,
            cards: [],
            currentBet: 0,
            totalBet: MIN_BET,
            chips: p.chips - MIN_BET,
            isFolded: false,
            lastAction: '', // Reset action text
            currentQuote: undefined // Clear quotes for new hand
        }));

        resetPlayers.forEach(p => {
            p.cards.push({ ...deck1.pop()!, isFaceUp: false });
            p.cards.push({ ...deck1.pop()!, isFaceUp: true });
        });

        const bringInIndex = getBringInIndex(resetPlayers);
        const bringInPlayer = resetPlayers[bringInIndex];
        const bringIn = Math.min(bringInAmount, bringInPlayer.chips);
        resetPlayers[bringInIndex] = {
            ...bringInPlayer,
            chips: bringInPlayer.chips - bringIn,
            currentBet: bringInPlayer.currentBet + bringIn,
            totalBet: (bringInPlayer.totalBet ?? 0) + bringIn,
            lastAction: '帶入'
        };
        const firstToAct = getNextActiveIndex(resetPlayers, bringInIndex);

        playSound('card-deal');

        // Reset turn tracking
        roundStartIndex.current = firstToAct;
        lastAggressorIndex.current = null; // No raiser yet
        raiseCount.current = 0;

        setGameState(prev => ({
            ...prev,
            players: resetPlayers,
            deck: deck1,
            pot: (MIN_BET * resetPlayers.length) + bringIn,
            currentMaxBet: bringIn,
            phase: GamePhase.BETTING_2,
            activePlayerIndex: firstToAct,
            winners: [],
            log: [`新局開始，底注 ${MIN_BET}`, ...prev.log]
        }));
    };

    const nextPhase = (currentState: GameState) => {
        const { phase, players, deck, pot } = currentState;
        const nextP = rulesRef.current.getNextPhase(phase, players);

        if (nextP === GamePhase.SHOWDOWN) {
            let { payouts, winners } = calculatePayouts(players);

            if (winners.length === 0) {
                winners = rulesRef.current.evaluateWinner(players);
                const winAmt = winners.length > 0 ? Math.floor(pot / winners.length) : 0;
                let remainder = pot - winAmt * winners.length;
                payouts = {};
                winners.forEach(id => {
                    const extra = remainder > 0 ? 1 : 0;
                    if (remainder > 0) remainder--;
                    payouts[id] = winAmt + extra;
                });
            }

            const updatedPlayers = players.map(p => {
                const gain = payouts[p.id] || 0;
                return gain > 0 ? { ...p, chips: p.chips + gain } : p;
            });
            playSound('slot-win');

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
                log: [`${winners.length}位贏家贏得底池！`, ...currentState.log]
            };
        }

        playSound('card-deal');
        const { updatedDeck, updatedPlayers, updatedCommunityCards } = rulesRef.current.dealCards(deck, players, nextP);

        // Reset Bets for new round
        const bettingPlayers = updatedPlayers.map(p => ({ ...p, currentBet: 0, lastAction: '' }));

        // Determine first talker again (Highest visible)
        // Note: For Texas Hold'em, this might need adjustment (usually Small Blind or Dealer Left), 
        // but existing games (Stud) use Highest Visible. 
        // We will assume 'getHighestVisibleIndex' honors the game type via card visibility or we override in the Engine Wrapper? 
        // Actually, 'getHighestVisibleIndex' is generic. Texas Hold'em usually acts fixed order (SB/BB).
        // BUT: this engine is shared. 'getHighestVisibleIndex' might not be suitable for Hold'em post-flop.
        // However, I will keep it for now and maybe override 'activePlayerIndex' in the Rules or Wrapper if needed?
        // Wait, 'getHighestVisibleIndex' is defined inside the hook. Rules don't control it.
        // I might need to make 'getStartingPlayerIndex' part of IPokerRules?
        // FOR NOW: I will leave it, but be aware Hold'em usually starts left of Dealer. 
        // "Showdown (Five Card Stud)" starts with High Card.
        // I'll stick to 'getHighestVisibleIndex' for now and see if I need to refactor for Hold'em later.
        // Actually, for Hold'em, 'getHighestVisibleIndex' looking at 'faceUp' cards is weird because Hold'em has NO faceUp cards (only hole cards) or ALL faceUp (community).
        // If players have NO faceUp cards, it falls back to "first active player".

        const bestIdx = getHighestVisibleIndex(bettingPlayers);

        // Reset turn tracking for new phase
        roundStartIndex.current = bestIdx;
        lastAggressorIndex.current = null;
        raiseCount.current = 0;

        const newState = {
            ...currentState,
            deck: updatedDeck,
            players: bettingPlayers,
            communityCards: updatedCommunityCards || currentState.communityCards, // Update or keep existing
            phase: nextP,
            currentMaxBet: 0,
            activePlayerIndex: bestIdx,
            log: [`進入階段: ${nextP}`, ...currentState.log]
        };

        return newState;
    };

    // Auto-Advance Effect for All-In Situations
    // "Showdown Process": If < 2 players have chips (everyone All-In or matched), we assume betting is done.
    // But we rely on 'handleAction' > 'nextPhase' to normally trigger phase changes.
    // If 'nextPhase' set us to a betting round (e.g. Turn), but everyone is All-In, we can't bet.
    // So we must detect this deadlock and advance.

    useEffect(() => {
        // Condition: Game is in progress (not SETTING, not RESULT)
        if (gameState.phase === GamePhase.SETTING || gameState.phase === GamePhase.RESULT || gameState.phase === GamePhase.SHOWDOWN) return;

        const active = gameState.players.filter(p => !p.isFolded);
        const capable = active.filter(p => p.chips > 0);
        const allMatched = active.every(p => p.chips === 0 || p.currentBet === gameState.currentMaxBet);

        // If fewer than 2 players can bet (e.g. 1 Active vs 1 All-In, or 2 All-Ins),
        // AND all bets are matched (current round is effectively done),
        // Then we should auto-advance.

        // However, 'handleAction' does the 'phaseDone' check when a player Acts.
        // If we just arrived at a new Phase (e.g. TURN) via nextPhase, chips/bets are reset.
        // We need to check if we can even start betting.

        if (capable.length < 2 && allMatched) {
            // Everyone is All-In (or only 1 left).
            // We want to advance automatically. 
            // We add a delay to create the "Dramatic Process" user requested.
            if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
            gameLoopTimeout.current = setTimeout(() => {
                // If we are already in SHOWDOWN or RESULT, do nothing (handled elsewhere).
                // Use functional update to ensure fresh state
                setGameState(current => {
                    if (current.phase === GamePhase.RESULT || current.phase === GamePhase.SHOWDOWN) return current;

                    // We call 'nextPhase' again to move to the next step (e.g. Turn -> River).
                    // This creates the "Deal -> Wait -> Deal" loop.

                    // Note: 'nextPhase' logic currently resets bets. 
                    // If we are in 'BETTING', nextPhase moves us to 'DEALING' (conceptually, essentially next street).
                    // ShowdownRules.getNextPhase moves BETTING_2 -> BETTING_3 etc.

                    return nextPhase(current);
                });
            }, 2000); // 2 Second Delay for drama
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.phase, gameState.players, gameState.currentMaxBet]); // Re-run when phase changes or players update (e.g. someone went all-in)

    const handleAction = async (action: ActionType, amount: number = 0, taunt?: string, actorId?: string) => {
        let queuedQuote: { playerId: string; quote: string } | null = null;
        setGameState(current => {
            const { players, activePlayerIndex, pot, currentMaxBet } = current;
            let p = players[activePlayerIndex]; // Use 'let' to allow re-assignment
            if (!p) return current;
            if (actorId && p.id !== actorId) return current;

            const callNeeded = currentMaxBet - p.currentBet;
            const betMode = current.betMode ?? 'FIXED_LIMIT';
            const isNoLimit = betMode === 'NO_LIMIT';
            const betSize = getBetSizeForPhase(current.phase);
            const minRaise = isNoLimit ? MIN_BET : betSize;
            const requiredRaise = isNoLimit
                ? minRaise
                : (currentMaxBet > 0 && currentMaxBet < betSize ? (betSize - currentMaxBet) : betSize);
            const requestedRaise = isNoLimit ? amount : requiredRaise;
            const canRaise = action === 'RAISE'
                && raiseCount.current < maxRaisesPerRound
                && requestedRaise >= minRaise
                && p.chips >= callNeeded + requiredRaise;
            const resolvedAction: ActionType = action === 'RAISE'
                ? (canRaise ? 'RAISE' : (callNeeded > 0 ? 'CALL' : 'CHECK'))
                : action;

            const activeNotFolded = players.filter(pl => !pl.isFolded).length;
            if (action === 'FOLD' && activeNotFolded <= 1) {
                return nextPhase(current);
            }

            // Determine Quote Type
            let quoteType: keyof NPCProfile['quotes'] | undefined;
            if (resolvedAction === 'FOLD') quoteType = 'FOLD';
            else if (resolvedAction === 'CHECK') quoteType = 'CHECK';
            else if (resolvedAction === 'CALL') quoteType = 'CALL';
            else if (resolvedAction === 'RAISE') quoteType = 'RAISE';
            else if (resolvedAction === 'ALL_IN') quoteType = 'ALL_IN';

            let quote = taunt;
            if (!quote && p.isAI && quoteType) {
                quote = getQuote(npcProfiles, p.name, quoteType);
            }

            if (quote) {
                queuedQuote = { playerId: p.id, quote };
                p = { ...p, currentQuote: quote }; // Update 'p' to include the quote
            }

            const newPlayers = [...players];
            let newPot = pot;
            let newMaxBet = currentMaxBet;

            // Log Interaction
            if (resolvedAction === 'FOLD') {
                newPlayers[activePlayerIndex] = { ...p, isFolded: true, lastAction: '棄牌', currentQuote: quote || p.currentQuote };
                playSound('chip-fold');

                if (lastAggressorIndex.current === activePlayerIndex) {
                    lastAggressorIndex.current = null;
                }

                // CRITICAL FIX: If the round starter folds, the 'stop marker' for checking (Circle Complete) is gone.
                // We must move the marker to the next active player to ensure the round can end.
                if (activePlayerIndex === roundStartIndex.current) {
                    // We can't find next active *yet* because we haven't updated state fully, 
                    // but we can find who would be next.
                    // Simple heuristic: Next valid index in the array order.
                    let next = (activePlayerIndex + 1) % newPlayers.length;
                    let safety = 0;
                    while (safety < newPlayers.length) {
                        const scanP = newPlayers[next];
                        if (!scanP.isFolded && scanP.chips > 0) break; // Found new starter
                        next = (next + 1) % newPlayers.length;
                        safety++;
                    }
                    // If everyone else folded/out? handled by 'active.length === 1' check later.
                    roundStartIndex.current = next;
                }
            } else if (resolvedAction === 'ALL_IN') {
                const amt = p.chips;
                const allInTotal = p.currentBet + amt;
                const fullRaiseTarget = currentMaxBet > 0 ? currentMaxBet + requiredRaise : 0;
                const isOpeningBet = currentMaxBet === 0 && allInTotal > 0;
                const isFullRaise = currentMaxBet > 0 && allInTotal >= fullRaiseTarget;
                newPlayers[activePlayerIndex] = {
                    ...p,
                    chips: 0,
                    currentBet: allInTotal,
                    totalBet: (p.totalBet ?? 0) + amt,
                    lastAction: '梭哈!',
                    currentQuote: quote || p.currentQuote
                };
                newPot += amt;
                if (allInTotal > currentMaxBet) newMaxBet = allInTotal;
                if (isOpeningBet) {
                    lastAggressorIndex.current = activePlayerIndex;
                } else if (isFullRaise) {
                    lastAggressorIndex.current = activePlayerIndex;
                    raiseCount.current += 1;
                }
                playSound('chip-allin');
            } else if (resolvedAction === 'CALL' || resolvedAction === 'CHECK') {
                const needed = newMaxBet - p.currentBet;
                const amt = Math.min(p.chips, needed);
                const wentAllIn = amt > 0 && p.chips - amt === 0;
                newPlayers[activePlayerIndex] = {
                    ...p,
                    chips: p.chips - amt,
                    currentBet: p.currentBet + amt,
                    totalBet: (p.totalBet ?? 0) + amt,
                    lastAction: needed ? (wentAllIn ? '梭哈!' : '跟注') : '過牌',
                    currentQuote: quote || p.currentQuote
                };
                newPot += amt;
                playSound(wentAllIn ? 'chip-allin' : 'chip-place');
            } else if (resolvedAction === 'RAISE') {
                // Raise Cap Logic: Eliminate infinite raise wars
                // Check how many raises happened? complex to track. 
                // Simpler: Cap the total pot size relative to initial? No.
                // Best: Cap number of raises per betting round (e.g. 4 raises max).
                // Implementation: Use a counter in ref? Or just check currentMaxBet vs initial.

                // For now, let's just apply the change.
                const needed = newMaxBet - p.currentBet;
                const intendedRaise = isNoLimit
                    ? Math.max(minRaise, requestedRaise)
                    : (newMaxBet > 0 && newMaxBet < betSize ? (betSize - newMaxBet) : betSize);
                const total = Math.min(p.chips, needed + intendedRaise);
                const actualRaise = Math.max(0, total - needed);
                const wentAllIn = total > 0 && p.chips - total === 0;
                newPlayers[activePlayerIndex] = {
                    ...p,
                    chips: p.chips - total,
                    currentBet: p.currentBet + total,
                    totalBet: (p.totalBet ?? 0) + total,
                    lastAction: actualRaise > 0 ? `加注 ${actualRaise}` : (needed ? (wentAllIn ? '梭哈!' : '跟注') : '過牌'),
                    currentQuote: quote || p.currentQuote
                };
                newPot += total;
                if (actualRaise > 0) {
                    newMaxBet += actualRaise;
                    lastAggressorIndex.current = activePlayerIndex;
                    if (currentMaxBet > 0) raiseCount.current += 1;
                }
                playSound(actualRaise > 0 ? 'chip-place' : (wentAllIn ? 'chip-allin' : 'chip-place'));
            }

            // --- DEADLOCK RECOVERY ---

            // Helper: who is next valid player?
            const nextIdx = getNextActiveIndex(newPlayers, activePlayerIndex);

            const active = newPlayers.filter(pl => !pl.isFolded);
            const activeAndCapable = active.filter(pl => pl.chips > 0);

            // 1. If only 1 player has chips left (others All-In), we must proceed.
            // Even if bets aren't matched yet? No, they must match high bet.

            // Re-verify phase done logic:

            const allMatched = active.every(pl => pl.chips === 0 || pl.currentBet === newMaxBet);
            let phaseDone = false;

            if (allMatched) {
                if (activeAndCapable.length <= 1) {
                    phaseDone = true;
                } else {
                    if (lastAggressorIndex.current !== null) {
                        phaseDone = (nextIdx === lastAggressorIndex.current);
                    } else {
                        phaseDone = (nextIdx === roundStartIndex.current);
                    }
                }
            } else {
                // Force Phase End if we are stuck in a loop of 0-chip players?
                // If activeAndCapable is 0, we should be done once unmatched bets are returned? 
                // In this simple engine, we don't return bets. We just force them to match (Call All-in).
                // If they are All-In, they matched as much as they could.
                // The `allMatched` check handles `pl.chips === 0`.
                // Wait: `pl.chips === 0 || pl.currentBet === newMaxBet`
                // If I have 0 chips, I return TRUE. Even if I bet 50 and Max is 100.
                // This is correct for Side Pots.
            }

            const nextState = { ...current, players: newPlayers, pot: newPot, currentMaxBet: newMaxBet };

            if (phaseDone) {
                return nextPhase(nextState);
            } else {
                playSound('card-deal');
                return { ...nextState, activePlayerIndex: nextIdx };
            }
        });
        if (queuedQuote) {
            const { playerId, quote } = queuedQuote;
            setGameState(g => ({
                ...g,
                players: g.players.map(pl => pl.id === playerId ? { ...pl, currentQuote: quote } : pl),
                log: [`${g.players.find(pl => pl.id === playerId)?.name || 'NPC'}：${quote}`, ...g.log]
            }));
            if (quoteTimeoutRef.current[playerId]) {
                clearTimeout(quoteTimeoutRef.current[playerId]);
            }
            quoteTimeoutRef.current[playerId] = setTimeout(() => {
                setGameState(g => ({
                    ...g,
                    players: g.players.map(pl => pl.id === playerId ? { ...pl, currentQuote: undefined } : pl)
                }));
                delete quoteTimeoutRef.current[playerId];
            }, 4000);
        }
    };

    // External `speak` function for Player
    const playerSpeak = (quote: string) => {
        setQuote('player', quote, setGameState);
        setGameState(prev => ({
            ...prev,
            players: prev.players.map(p => p.id === 'player' ? { ...p, currentQuote: quote } : p),
            log: [`玩家：${quote}`, ...prev.log]
        }));
    };


    useEffect(() => {
        if (!gameState.phase.startsWith('BETTING')) return;
        const current = gameState.players[gameState.activePlayerIndex];
        if (!current || current.isFolded) return;

        if (current.chips === 0) {
            if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
            gameLoopTimeout.current = setTimeout(() => {
                console.warn(`Safety Net: Skipping turn for All-In player ${current.name}`);
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
                const move = await rulesRef.current.getAIAction(latestPlayer, latest);
                await handleAction(move.action, move.amount || 0, move.taunt, latestPlayer.id);
                if (move.taunt) {
                    setQuote(latestPlayer.id, move.taunt, setGameState);
                }
            } catch (error) {
                console.error('AI Error', error);
                await handleAction('FOLD', 0);
            } finally {
                isProcessingTurn.current = false;
            }
        }, 1000);

        return () => {
            if (gameLoopTimeout.current) clearTimeout(gameLoopTimeout.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [gameState.activePlayerIndex, gameState.phase, gameState.players]);

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
            betMode: gameState.betMode,
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
