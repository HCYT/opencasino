import { ActionType, Card, GamePhase, IPokerRules, Player, GameState } from '../../types';
import { evaluateHand } from '../pokerLogic';
import { MIN_BET, RANK_VALUE, RANKS, SUITS } from '../../constants';

export class ShowdownRules implements IPokerRules {
    initialHandSize = 2;
    private tendencies: Record<string, { actions: number; folds: number; calls: number; checks: number; raises: number; allIns: number }> = {};
    private lastActionSeen: Record<string, string | undefined> = {};



    canCheck(player: Player, currentMaxBet: number): boolean {
        return player.currentBet >= currentMaxBet;
    }

    getNextPhase(currentPhase: GamePhase, players: Player[]): GamePhase {
        const nextPhaseMap: Record<string, GamePhase> = {
            [GamePhase.BETTING_2]: GamePhase.BETTING_3,
            [GamePhase.BETTING_3]: GamePhase.BETTING_4,
            [GamePhase.BETTING_4]: GamePhase.BETTING_5,
            [GamePhase.BETTING_5]: GamePhase.SHOWDOWN,
        };
        return nextPhaseMap[currentPhase] || GamePhase.RESULT;
    }

    dealCards(deck: Card[], players: Player[], phase: GamePhase): { updatedDeck: Card[], updatedPlayers: Player[] } {
        const updatedDeck = [...deck];
        const updatedPlayers = players.map(p => {
            if (p.isFolded) return p;

            // In Showdown mode (Five Card Stud style), we deal 1 card each round
            // DEALING_2 is initial deal (handled separately usually or here?), 
            // This is for distinct dealing phases if we had them, OR the engine calls this 
            // when transitioning TO a betting phase if there was a dealing phase before it.
            // But in the original code, `dealOneCardEach` was called.

            const newCard = updatedDeck.pop();
            if (!newCard) return p; // Should handle deck empty

            newCard.isFaceUp = true;
            return { ...p, cards: [...p.cards, newCard], lastAction: '' };
        });
        return { updatedDeck, updatedPlayers };
    }

    evaluateWinner(players: Player[]): string[] {
        let bestScore = -1;
        let currentWinners: string[] = [];

        players.forEach(p => {
            if (!p.isFolded) {
                const evalResult = evaluateHand(p.cards);
                if (evalResult.score > bestScore) {
                    bestScore = evalResult.score;
                    currentWinners = [p.id];
                } else if (evalResult.score === bestScore) {
                    currentWinners.push(p.id);
                }
            }
        });

        return currentWinners;
    }

    private updateTendencies(players: Player[]) {
        players.forEach(p => {
            const lastAction = p.lastAction?.trim();
            if (!lastAction) return;
            if (this.lastActionSeen[p.id] === lastAction) return;
            this.lastActionSeen[p.id] = lastAction;

            if (!this.tendencies[p.id]) {
                this.tendencies[p.id] = { actions: 0, folds: 0, calls: 0, checks: 0, raises: 0, allIns: 0 };
            }

            const stats = this.tendencies[p.id];
            if (lastAction === '帶入') return;
            stats.actions += 1;
            if (lastAction.startsWith('加注')) stats.raises += 1;
            else if (lastAction === '梭哈!') stats.allIns += 1;
            else if (lastAction === '跟注') stats.calls += 1;
            else if (lastAction === '過牌') stats.checks += 1;
            else if (lastAction === '棄牌') stats.folds += 1;
        });
    }

    private getOpponentProfile(players: Player[]) {
        const profiles = players.map(p => this.tendencies[p.id]).filter(Boolean) as Array<{ actions: number; folds: number; calls: number; checks: number; raises: number; allIns: number }>;
        if (profiles.length === 0) {
            return { aggression: 0.5, tightness: 0.35 };
        }
        const totals = profiles.reduce((acc, s) => {
            acc.actions += s.actions;
            acc.folds += s.folds;
            acc.raises += s.raises;
            acc.allIns += s.allIns;
            return acc;
        }, { actions: 0, folds: 0, raises: 0, allIns: 0 });

        const aggression = totals.actions > 0 ? Math.min(1, (totals.raises + totals.allIns * 1.2) / totals.actions) : 0.5;
        const tightness = totals.actions > 0 ? Math.min(1, totals.folds / totals.actions) : 0.35;
        return { aggression, tightness };
    }

    private buildRemainingDeck(known: Card[]) {
        const knownKeys = new Set(known.map(c => `${c.rank}-${c.suit}`));
        const deck: Card[] = [];
        for (const suit of SUITS) {
            for (const rank of RANKS) {
                const key = `${rank}-${suit}`;
                if (knownKeys.has(key)) continue;
                deck.push({ suit, rank, value: RANK_VALUE[rank], isFaceUp: false });
            }
        }
        return deck;
    }

    private drawRandomCards(deck: Card[], count: number) {
        const drawn: Card[] = [];
        for (let i = 0; i < count && deck.length > 0; i++) {
            const idx = Math.floor(Math.random() * deck.length);
            drawn.push(deck.splice(idx, 1)[0]);
        }
        return drawn;
    }

    private mergeKnownCards(base: Card[], extra: Card[] = []) {
        if (extra.length === 0) return [...base];
        const seen = new Set<string>();
        const merged: Card[] = [];
        const add = (card: Card) => {
            const key = `${card.rank}-${card.suit}`;
            if (seen.has(key)) return;
            seen.add(key);
            merged.push(card);
        };
        base.forEach(add);
        extra.forEach(add);
        return merged;
    }

    private combinationCount(n: number, k: number, cap: number = Number.POSITIVE_INFINITY) {
        if (k < 0 || k > n) return 0;
        k = Math.min(k, n - k);
        let result = 1;
        for (let i = 1; i <= k; i++) {
            result = (result * (n - k + i)) / i;
            if (result > cap) return cap + 1;
        }
        return result;
    }

    private estimateEnumerationCount(deckSize: number, unknownCounts: number[], maxOutcomes: number) {
        let remaining = deckSize;
        let total = 1;
        for (const need of unknownCounts) {
            if (need <= 0) continue;
            const cap = Math.max(1, Math.floor(maxOutcomes / total));
            const combos = this.combinationCount(remaining, need, cap);
            total *= combos;
            remaining -= need;
            if (total > maxOutcomes) return total;
        }
        return total;
    }

    private enumerateCombinations(deck: Card[], need: number, start: number, picked: Card[], cb: (combo: Card[]) => void) {
        if (need === 0) {
            cb([...picked]);
            return;
        }
        for (let i = start; i <= deck.length - need; i++) {
            picked.push(deck[i]);
            this.enumerateCombinations(deck, need - 1, i + 1, picked, cb);
            picked.pop();
        }
    }

    private estimateWinRateExact(knownHands: Card[][], unknownCounts: number[], baseDeck: Card[], heroIndex: number) {
        const missingPlayers = unknownCounts
            .map((count, idx) => ({ count, idx }))
            .filter(entry => entry.count > 0);

        if (missingPlayers.length === 0) {
            const scores = knownHands.map(hand => evaluateHand(hand).score);
            const bestScore = Math.max(...scores);
            const winners = scores.filter(score => score === bestScore).length;
            return scores[heroIndex] === bestScore ? 1 / winners : 0;
        }

        const hands = knownHands.map(hand => [...hand]);
        let winShares = 0;
        let total = 0;

        const assign = (playerIdx: number, deck: Card[]) => {
            if (playerIdx >= missingPlayers.length) {
                const scores = hands.map(hand => evaluateHand(hand).score);
                const bestScore = Math.max(...scores);
                const winners = scores.filter(score => score === bestScore).length;
                if (scores[heroIndex] === bestScore) winShares += 1 / winners;
                total += 1;
                return;
            }

            const { idx, count } = missingPlayers[playerIdx];
            this.enumerateCombinations(deck, count, 0, [], combo => {
                const chosen = new Set(combo);
                combo.forEach(card => hands[idx].push(card));
                const nextDeck = deck.filter(card => !chosen.has(card));
                assign(playerIdx + 1, nextDeck);
                hands[idx].splice(hands[idx].length - count, count);
            });
        };

        assign(0, baseDeck);
        return total > 0 ? winShares / total : 0;
    }

    private estimateWinRateMonteCarlo(knownHands: Card[][], unknownCounts: number[], baseDeck: Card[], heroIndex: number, iterations: number) {
        let winShares = 0;
        for (let i = 0; i < iterations; i++) {
            const deck = [...baseDeck];
            const hands = knownHands.map(hand => [...hand]);

            for (let p = 0; p < hands.length; p++) {
                const need = unknownCounts[p];
                if (need > 0) hands[p].push(...this.drawRandomCards(deck, need));
            }

            const scores = hands.map(hand => evaluateHand(hand).score);
            const bestScore = Math.max(...scores);
            const winners = scores.filter(score => score === bestScore).length;
            if (scores[heroIndex] === bestScore) winShares += 1 / winners;
        }

        return winShares / iterations;
    }

    private estimateWinRate(player: Player, players: Player[], iterations: number = 250, knownCardsByPlayerId: Record<string, Card[]> = {}) {
        const activePlayers = players.filter(p => !p.isFolded);
        if (activePlayers.length <= 1) return 1;
        const heroIndex = activePlayers.findIndex(p => p.id === player.id);
        if (heroIndex < 0) return 0;

        const knownHands = activePlayers.map(p => {
            const base = p.id === player.id ? p.cards : p.cards.filter(c => c.isFaceUp);
            const extra = knownCardsByPlayerId[p.id] || [];
            return this.mergeKnownCards(base, extra);
        });
        const unknownCounts = knownHands.map(hand => Math.max(0, 5 - hand.length));
        const totalUnknown = unknownCounts.reduce((sum, count) => sum + count, 0);
        const knownCards = knownHands.flat();
        const baseDeck = this.buildRemainingDeck(knownCards);
        if (baseDeck.length < totalUnknown) return 0;

        if (totalUnknown === 0) {
            const scores = knownHands.map(hand => evaluateHand(hand).score);
            const bestScore = Math.max(...scores);
            const winners = scores.filter(score => score === bestScore).length;
            return scores[heroIndex] === bestScore ? 1 / winners : 0;
        }

        const MAX_ENUM_OUTCOMES = 45000;
        const estimatedOutcomes = this.estimateEnumerationCount(baseDeck.length, unknownCounts, MAX_ENUM_OUTCOMES);
        if (estimatedOutcomes <= MAX_ENUM_OUTCOMES) {
            return this.estimateWinRateExact(knownHands, unknownCounts, baseDeck, heroIndex);
        }

        const dynamicIterations = totalUnknown >= 10 ? Math.max(iterations, 360) : totalUnknown >= 6 ? Math.max(iterations, 280) : iterations;
        return this.estimateWinRateMonteCarlo(knownHands, unknownCounts, baseDeck, heroIndex, dynamicIterations);
    }

    async getAIAction(player: Player, gameState: GameState): Promise<{ action: ActionType; amount?: number; taunt?: string }> {
        // --- HEURISTIC MODE (MONTE CARLO) ---
        this.updateTendencies(gameState.players);
        const { currentMaxBet, pot, players, phase } = gameState;
        const toCall = Math.max(0, currentMaxBet - player.currentBet);
        const effectiveCall = Math.min(toCall, player.chips);
        const potOdds = effectiveCall > 0 ? effectiveCall / Math.max(1, pot + effectiveCall) : 0;
        const betMode = gameState.betMode ?? 'FIXED_LIMIT';
        const betSize = (phase === GamePhase.BETTING_4 || phase === GamePhase.BETTING_5) ? MIN_BET * 2 : MIN_BET;
        const minRaise = betMode === 'NO_LIMIT' ? MIN_BET : betSize;
        const maxPossibleRaise = Math.max(0, player.chips - toCall);

        const myHand = evaluateHand(player.cards);

        const personalities: Record<string, { aggression: number; bluff: number; allIn: number; caution: number }> = {
            '高進': { aggression: 0.45, bluff: 0.1, allIn: 0.85, caution: 0.7 },
            '陳小刀': { aggression: 0.65, bluff: 0.25, allIn: 0.7, caution: 0.45 },
            '周星祖': { aggression: 0.55, bluff: 0.35, allIn: 0.75, caution: 0.5 },
            '龍五': { aggression: 0.35, bluff: 0.05, allIn: 0.9, caution: 0.8 },
            '海珊': { aggression: 0.75, bluff: 0.2, allIn: 0.65, caution: 0.4 },
            '大軍': { aggression: 0.7, bluff: 0.3, allIn: 0.7, caution: 0.35 }
        };

        const personality = personalities[player.name] || { aggression: 0.5, bluff: 0.15, allIn: 0.8, caution: 0.55 };
        const random = Math.random();
        const isLatePhase = phase === GamePhase.BETTING_4 || phase === GamePhase.BETTING_5;

        // --- 1. Identify Context ---
        const teaming = !!gameState.teamingEnabled;
        const myTeam = teaming ? player.teamId : undefined;
        const activeOpponents = players.filter(p => !p.isFolded && p.id !== player.id && (!myTeam || p.teamId !== myTeam));
        const activeTeammates = teaming && myTeam
            ? players.filter(p => !p.isFolded && p.id !== player.id && p.teamId === myTeam)
            : [];

        const knownCardsByPlayerId: Record<string, Card[]> = {};
        if (teaming && myTeam) {
            activeTeammates.forEach(tm => {
                const hidden = tm.cards.filter(c => !c.isFaceUp);
                if (hidden.length > 0) knownCardsByPlayerId[tm.id] = hidden;
            });
        }
        const winRate = this.estimateWinRate(player, players, 220, knownCardsByPlayerId);

        const opponentMaxBet = Math.max(...activeOpponents.map(p => p.currentBet), 0);
        const teammateMaxBet = Math.max(...activeTeammates.map(p => p.currentBet), 0);

        const isOpponentAggressor = opponentMaxBet > teammateMaxBet;
        const isTeammateAggressor = teaming && teammateMaxBet >= opponentMaxBet && teammateMaxBet > 0;
        const opponentProfile = this.getOpponentProfile(activeOpponents);

        // --- 2. Team Strength ---
        const monsterRanks = new Set(['Flush', 'Full House', 'Four of a Kind', 'Straight Flush', 'Royal Flush']);
        let teamBestScore = myHand.score;
        let teamHasMonster = monsterRanks.has(myHand.rank);
        activeTeammates.forEach(tm => {
            const tmEval = evaluateHand(tm.cards);
            teamBestScore = Math.max(teamBestScore, tmEval.score);
            if (monsterRanks.has(tmEval.rank)) teamHasMonster = true;
        });

        const iHaveBestInTeam = myHand.score === teamBestScore;

        // --- 3. Decision Logic ---
        let adjustedWinRate = Math.min(1, winRate + (personality.aggression - 0.5) * 0.08);
        if (teamHasMonster && !iHaveBestInTeam) {
            adjustedWinRate = Math.min(1, adjustedWinRate + 0.12);
        }
        const avoidInFighting = isTeammateAggressor && !iHaveBestInTeam;
        if (isOpponentAggressor) adjustedWinRate = Math.min(1, adjustedWinRate + 0.04);

        const stackPressure = effectiveCall / Math.max(1, player.chips);
        const tablePressure = (opponentProfile.aggression - 0.5) * 0.08 + (opponentProfile.tightness - 0.5) * 0.05;
        const phasePressure = isLatePhase ? 0.05 : 0;
        const callThreshold = Math.min(0.95, potOdds + 0.06 + stackPressure * 0.18 + phasePressure + tablePressure - (personality.aggression - 0.5) * 0.05);
        const raiseThreshold = Math.min(0.95, 0.62 + stackPressure * 0.1 + phasePressure + tablePressure - personality.aggression * 0.08);

        const chooseRaiseAmount = () => {
            if (betMode === 'FIXED_LIMIT') return betSize;
            if (maxPossibleRaise <= 0) return minRaise;
            const potFactor = isLatePhase ? 0.55 : 0.35;
            const base = Math.max(minRaise, Math.floor(pot * (potFactor + personality.aggression * 0.25)));
            const boosted = adjustedWinRate > 0.75 ? Math.max(base, Math.floor(pot * 0.7)) : base;
            return Math.min(maxPossibleRaise, boosted);
        };

        if (toCall === 0) {
            if (adjustedWinRate > raiseThreshold && !avoidInFighting && player.chips >= minRaise) {
                return { action: 'RAISE', amount: chooseRaiseAmount() };
            }
            if (random < personality.bluff * (isLatePhase ? 0.08 : 0.18) && player.chips >= minRaise) {
                return { action: 'RAISE', amount: chooseRaiseAmount() };
            }
            return { action: 'CHECK' };
        }

        if (adjustedWinRate < callThreshold) {
            if (random < personality.bluff * 0.08 && effectiveCall <= player.chips * 0.15) {
                return { action: 'CALL' };
            }
            return { action: 'FOLD' };
        }

        if (adjustedWinRate > raiseThreshold && !avoidInFighting && player.chips >= toCall + minRaise) {
            return { action: 'RAISE', amount: chooseRaiseAmount() };
        }

        if (adjustedWinRate > potOdds || random < personality.bluff * 0.15) {
            return { action: 'CALL' };
        }
        return { action: 'FOLD' };
    }
}
