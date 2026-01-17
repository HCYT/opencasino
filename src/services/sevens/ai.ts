import { Card } from '../../types';
import { SevensBoard, SevensPlayer, SEVENS_RANK_VALUE } from './types';
import { getPlayableCards, getRankValue } from './rules';

export type AIStrategy = 'GREEDY' | 'CONSERVATIVE' | 'AGGRESSIVE';

interface CardScore {
    card: Card;
    score: number;
}

interface GameContext {
    allPlayers: SevensPlayer[];
    humanPlayerIndex: number;
    nightmareMode: boolean; // 🔥 Only target when nightmare mode is on
}

// Calculate blocking power of a card (how much it blocks opponents)
const getBlockingPower = (card: Card, board: SevensBoard): number => {
    const pile = board[card.suit];
    const rankVal = getRankValue(card.rank);

    if (pile.low === -1) {
        if (rankVal === 7) return 0;
        return 0;
    }

    if (rankVal === pile.low - 1) {
        return pile.low - 1;
    }
    if (rankVal === pile.high + 1) {
        return 13 - pile.high;
    }

    return 0;
};

// Check if playing a card would help the human player
const wouldHelpHuman = (
    card: Card,
    board: SevensBoard,
    humanHand: Card[]
): number => {
    const pile = board[card.suit];
    const rankVal = getRankValue(card.rank);

    if (pile.low === -1 && rankVal !== 7) return 0;

    let newLow = pile.low;
    let newHigh = pile.high;

    if (rankVal === 7) {
        newLow = 7;
        newHigh = 7;
    } else if (rankVal === pile.low - 1) {
        newLow = rankVal;
    } else if (rankVal === pile.high + 1) {
        newHigh = rankVal;
    }

    let helpScore = 0;
    for (const hCard of humanHand) {
        if (hCard.suit !== card.suit) continue;
        const hRank = getRankValue(hCard.rank);

        if (hRank === newLow - 1 || hRank === newHigh + 1) {
            helpScore += 10;
        }
    }

    return helpScore;
};

// Score a card for strategic passing (higher = better to pass)
const getPassScore = (card: Card, hand: Card[]): number => {
    const rankVal = getRankValue(card.rank);
    let score = SEVENS_RANK_VALUE[card.rank];

    if (rankVal === 7) {
        score -= 50;
    }

    if (rankVal === 6 || rankVal === 8) {
        score -= 20;
    }

    const samesuit = hand.filter(c => c.suit === card.suit);
    const hasLower = samesuit.some(c => getRankValue(c.rank) === rankVal - 1);
    const hasHigher = samesuit.some(c => getRankValue(c.rank) === rankVal + 1);

    if (hasLower || hasHigher) {
        score -= 10;
    }

    return score;
};

// Main AI decision function with optional targeting
export const aiChooseAction = (
    player: SevensPlayer,
    board: SevensBoard,
    isFirstMove: boolean,
    context?: GameContext
): { action: 'PLAY' | 'PASS'; card: Card } | null => {
    const playableCards = getPlayableCards(player.hand, board);

    // 🎯 Only target when nightmare mode is enabled
    const nightmareMode = context?.nightmareMode ?? false;
    const humanPlayer = nightmareMode ? context?.allPlayers[context.humanPlayerIndex] : undefined;
    const humanHand = humanPlayer?.hand || [];
    const humanCardCount = humanHand.length;

    // Targeting intensity: more aggressive when human is close to winning
    const targetingIntensity = nightmareMode
        ? (humanCardCount <= 3 ? 3 : humanCardCount <= 6 ? 2 : 1)
        : 0;

    if (playableCards.length > 0) {
        const scored: CardScore[] = playableCards.map(card => {
            let score = 0;
            const rankVal = getRankValue(card.rank);
            const strategy = player.tactic === 'AGGRESSIVE' ? 'AGGRESSIVE'
                : player.tactic === 'CONSERVATIVE' ? 'CONSERVATIVE'
                    : 'GREEDY';

            switch (strategy) {
                case 'AGGRESSIVE': {
                    score += Math.abs(rankVal - 7) * 2;
                    const suitCount = player.hand.filter(c => c.suit === card.suit).length;
                    score += suitCount * 3;
                    break;
                }

                case 'CONSERVATIVE':
                    score -= getBlockingPower(card, board) * 5;
                    score -= Math.abs(rankVal - 7);
                    break;

                case 'GREEDY':
                default:
                    score += Math.abs(rankVal - 7);
                    score -= getBlockingPower(card, board) * 2;
                    break;
            }

            // 🎯 NIGHTMARE MODE TARGETING: Penalize cards that help the human player
            if (nightmareMode && humanHand.length > 0) {
                const helpScore = wouldHelpHuman(card, board, humanHand);
                score -= helpScore * targetingIntensity;

                // Extra penalty for opening suits where human has many cards
                if (rankVal === 7) {
                    const humanSuitCards = humanHand.filter(c => c.suit === card.suit).length;
                    score -= humanSuitCards * 5 * targetingIntensity;
                }
            }

            // Always prioritize 7s in early game
            if (rankVal === 7) {
                if (nightmareMode) {
                    const humanSuitCards = humanHand.filter(c => c.suit === card.suit).length;
                    if (humanSuitCards === 0) {
                        score += 100;
                    } else {
                        score += 30;
                    }
                } else {
                    score += 100;
                }
            }

            // If first move, must play Spade 7
            if (isFirstMove && card.suit === 'Spades' && card.rank === '7') {
                score += 1000;
            }

            return { card, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return { action: 'PLAY', card: scored[0].card };
    }

    if (player.hand.length === 0) {
        return null;
    }

    const passScores: CardScore[] = player.hand.map(card => ({
        card,
        score: getPassScore(card, player.hand)
    }));

    passScores.sort((a, b) => b.score - a.score);
    return { action: 'PASS', card: passScores[0].card };
};

// Quick check if AI needs to pass
export const mustPass = (hand: Card[], board: SevensBoard): boolean => {
    return getPlayableCards(hand, board).length === 0;
};
