import { IPokerRules, Player, GamePhase, Card, ActionType, GameState } from '../../types';
import { getTexasAIAction } from './ai';
import { getBestHand } from './ranking';

export class TexasHoldemRules implements IPokerRules {
    initialHandSize = 2;

    canCheck(player: Player, currentMaxBet: number): boolean {
        return player.currentBet === currentMaxBet;
    }

    getNextPhase(currentPhase: GamePhase, players: Player[]): GamePhase {
        const activePlayers = players.filter(p => !p.isFolded);
        if (activePlayers.length <= 1) return GamePhase.RESULT;

        switch (currentPhase) {
            case GamePhase.SETTING: return GamePhase.PRE_FLOP;
            case GamePhase.PRE_FLOP: return GamePhase.FLOP;
            case GamePhase.FLOP: return GamePhase.TURN;
            case GamePhase.TURN: return GamePhase.RIVER;
            case GamePhase.RIVER: return GamePhase.SHOWDOWN;
            case GamePhase.SHOWDOWN: return GamePhase.RESULT;
            default: return GamePhase.RESULT;
        }
    }

    dealCards(deck: Card[], players: Player[], phase: GamePhase): { updatedDeck: Card[], updatedPlayers: Player[], updatedCommunityCards?: Card[] } {
        const newDeck = [...deck];
        const newPlayers = [...players];
        const newCommunityCards: Card[] = [];

        // Deal Hole Cards
        if (phase === GamePhase.PRE_FLOP) {
            newPlayers.forEach(p => {
                if (!p.cards) p.cards = [];
                // Deal 2 cards face down
                p.cards.push({ ...newDeck.pop()!, isFaceUp: false });
                p.cards.push({ ...newDeck.pop()!, isFaceUp: false }); // In Texas, hole cards are usually private (Face Down for others, Up for Self)
                // Note: The UI handles "FaceUp for self". The data 'isFaceUp' usually means "Publicly Visible".
                // In Hold'em, Hole cards are private.
            });
            return { updatedDeck: newDeck, updatedPlayers: newPlayers, updatedCommunityCards: [] };
        }

        // Flop: Burn 1, Deal 3
        if (phase === GamePhase.FLOP) {
            if (newDeck.length > 0) newDeck.pop(); // Burn
            for (let i = 0; i < 3; i++) {
                if (newDeck.length > 0) newCommunityCards.push({ ...newDeck.pop()!, isFaceUp: true });
            }
            return { updatedDeck: newDeck, updatedPlayers: newPlayers, updatedCommunityCards: newCommunityCards };
        }

        // Turn: Burn 1, Deal 1
        if (phase === GamePhase.TURN) {
            if (newDeck.length > 0) newDeck.pop(); // Burn
            if (newDeck.length > 0) newCommunityCards.push({ ...newDeck.pop()!, isFaceUp: true });
            return { updatedDeck: newDeck, updatedPlayers: newPlayers, updatedCommunityCards: newCommunityCards };
        }

        // River: Burn 1, Deal 1
        if (phase === GamePhase.RIVER) {
            if (newDeck.length > 0) newDeck.pop(); // Burn
            if (newDeck.length > 0) newCommunityCards.push({ ...newDeck.pop()!, isFaceUp: true });
            return { updatedDeck: newDeck, updatedPlayers: newPlayers, updatedCommunityCards: newCommunityCards };
        }

        return { updatedDeck: newDeck, updatedPlayers: newPlayers };
    }

    evaluateWinner(players: Player[], communityCards: Card[] = []): string[] {
        const activePlayers = players.filter(p => !p.isFolded);
        if (activePlayers.length === 0) return [];
        if (activePlayers.length === 1) return [activePlayers[0].id];

        let bestScore = -1;
        let winners: string[] = [];

        activePlayers.forEach(p => {
            const evalResult = getBestHand(p.cards, communityCards);

            // Console log for debugging
            console.log(`Player ${p.name} Best Hand: ${evalResult.label} (${evalResult.score})`);

            if (evalResult.score > bestScore) {
                bestScore = evalResult.score;
                winners = [p.id];
            } else if (evalResult.score === bestScore) {
                winners.push(p.id);
            }
        });

        return winners;
    }

    async getAIAction(player: Player, gameState: GameState): Promise<{ action: ActionType; amount?: number; taunt?: string }> {
        return getTexasAIAction(player, gameState);
    }
}
