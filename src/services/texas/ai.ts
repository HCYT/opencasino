import { Player, GameState, ActionType } from '../../types';
import { getBestHand } from './ranking';

// Nightmare Mode: "Dominic" clones gang up on the player.
const isNightmare = (player: Player): boolean => {
    return player.name.startsWith('Dominic');
};

const getWinProbability = (player: Player, gameState: GameState): number => {
    // Simple Monte Carlo or Heuristic?
    // For speed, we'll use a heuristic based on Hand Strength vs Random Range
    const communityCards = gameState.communityCards || [];
    const hand = getBestHand(player.cards, communityCards);

    // Base strength (0-1)
    // Royal Flush ~ 10B score. High Card ~ 0.
    // We can just use the 'Rank' to estimate.
    const rankValue: Record<string, number> = {
        'High Card': 0.1,
        'One Pair': 0.3,
        'Two Pair': 0.5,
        'Three of a Kind': 0.6,
        'Straight': 0.7,
        'Flush': 0.75,
        'Full House': 0.85,
        'Four of a Kind': 0.95,
        'Straight Flush': 0.99,
        'Royal Flush': 1.0
    };

    let strength = rankValue[hand.rank] || 0.1;

    // Pre-flop heuristics if community cards are empty
    if (communityCards.length === 0) {
        const c1 = player.cards[0];
        const c2 = player.cards[1];
        const isPair = c1.value === c2.value;
        const isSuited = c1.suit === c2.suit;
        const highVal = Math.max(c1.value, c2.value);

        if (isPair) strength = 0.5 + (highVal / 14) * 0.3; // AA = 0.8
        else strength = (highVal / 14) * 0.4 + (isSuited ? 0.1 : 0);
    }

    return strength;
};

export const getTexasAIAction = async (player: Player, gameState: GameState): Promise<{ action: ActionType; amount?: number; taunt?: string }> => {
    const { currentMaxBet, players, pot } = gameState;
    const isNightmareMode = players.some(p => isNightmare(p)) && isNightmare(player);
    const human = players.find(p => !p.isAI && !p.isFolded);

    const callAmount = currentMaxBet - player.currentBet;
    const winProb = getWinProbability(player, gameState);
    // const potOdds = callAmount / (pot + callAmount); // Unused for now

    // --- NIGHTMARE MODE LOGIC ---
    if (isNightmareMode && human) {
        // If Human is in the pot, WE COLLUDE.
        // Logic: 
        // 1. If I have a good hand, I Bet/Raise to pressure.
        // 2. If I have a bad hand but Human is in, I might Raise anyway to bluff/pressure (Team Bluff).
        // 3. If Human is All-In, we just Call to ensure we can beat him with numbers.

        const random = Math.random();

        // Aggression: Re-raise specifically to drain human
        if (winProb > 0.4 || random > 0.7) {
            if (player.chips > callAmount * 2) {
                // Check-Raise or 3-Bet logic
                return { action: 'RAISE', amount: currentMaxBet * 2 + 100, taunt: random > 0.8 ? "你逃不掉的..." : undefined };
            } else {
                return { action: 'ALL_IN', taunt: "全部送你！" };
            }
        }

        // If hand is terrible but we want to keep checking down to see if ally wins?
        // Or just Call?
        return { action: 'CALL' };
    }

    // --- STANDARD LOGIC ---
    const random = Math.random();

    // 1. Super Strong Hand
    if (winProb > 0.8) {
        if (currentMaxBet === 0) return { action: 'CHECK', taunt: "慢慢來..." }; // Slow play
        if (random > 0.3) return { action: 'RAISE', amount: pot * 0.5 };
        return { action: 'CALL' };
    }

    // 2. Strong Hand
    if (winProb > 0.6) {
        if (callAmount === 0) return { action: 'CHECK' };
        if (random > 0.5) return { action: 'RAISE', amount: Math.max(100, callAmount * 2) };
        return { action: 'CALL' };
    }

    // 3. Weak/Draw
    if (winProb > 0.3) {
        if (callAmount === 0) return { action: 'CHECK' };
        if (callAmount < player.chips * 0.1) return { action: 'CALL' }; // Cheap call
        if (random > 0.8) return { action: 'RAISE', amount: pot, taunt: "嚇唬誰呢？" }; // Bluff
        return { action: 'FOLD' };
    }

    // 4. Trash
    if (callAmount === 0) return { action: 'CHECK' };
    if (random > 0.9) return { action: 'RAISE', amount: pot * 2, taunt: "這把穩贏！" }; // Rare Bluff
    return { action: 'FOLD' };
};
