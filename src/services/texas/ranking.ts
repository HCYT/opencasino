import { Card, HandEvaluation } from '../../types';
import { evaluateHand } from '../pokerLogic';

// Helper to get all combinations of k elements from an array
const getCombinations = <T>(arr: T[], k: number): T[][] => {
    if (k === 0) return [[]];
    if (arr.length === 0) return [];
    const [head, ...tail] = arr;
    const withHead = getCombinations(tail, k - 1).map(c => [head, ...c]);
    const withoutHead = getCombinations(tail, k);
    return [...withHead, ...withoutHead];
};

export const getBestHand = (holeCards: Card[], communityCards: Card[]): HandEvaluation => {
    const allCards = [...holeCards, ...communityCards];

    // If we have fewer than 5 cards (e.g. early rounds), just evaluate what we have
    // createDeck/evaluateHand in pokerLogic handles logic for Pairs etc even if < 5, 
    // but Straight/Flush requires 5. 
    // For 'ranking' display during game, we might want to show "Current Best".
    // If < 5 cards, just pass them all.
    if (allCards.length < 5) {
        return evaluateHand(allCards);
    }

    // Generate all 5-card combinations
    const combinations = getCombinations(allCards, 5);

    let bestEval: HandEvaluation | null = null;

    for (const combo of combinations) {
        const ev = evaluateHand(combo);
        if (!bestEval || ev.score > bestEval.score) {
            bestEval = ev;
        }
    }

    return bestEval || evaluateHand(allCards); // Fallback
};
