import { AITactic, Card } from '../../types';
import { createDeck } from '../pokerLogic';
import {
  COMBO_TYPE_ORDER,
  THREE_CLUBS_KEY,
  canBeat,
  canSplitDragon,
  cardKey,
  evaluateCombo,
  getFourKindCombos,
  getFullHouseCombos,
  getPlayablePairs,
  getPlayableSingles,
  getPlayableTriples,
  getStraightCombos,
  getStraightFlushCombos,
  sortCards
} from './rules';
import { ComboEval, TrickState } from './types';

export interface BigTwoAiPlayer {
  hand: Card[];
  tactic?: AITactic;
}

type TeamRole = 'FINISHER' | 'CONTROLLER' | 'BREAKER';

interface TeamContext {
  roles: Record<number, TeamRole>;
  teammates: number[];
  humanIdx: number;
  probHumanHasTwo: number;
  unknownCardsCount: number;
}

const getCandidatePower = (combo: ComboEval) => combo.cutRank * 1000 + combo.strength;

const buildCandidates = (hand: Card[]) => {
  const candidates: Array<{ cards: Card[]; eval: ComboEval }> = [];
  const seen = new Set<string>();
  const pushUnique = (cards: Card[]) => {
    const key = sortCards(cards).map(cardKey).join('|');
    if (seen.has(key)) return;
    const evalResult = evaluateCombo(cards);
    if (!evalResult) return;
    seen.add(key);
    candidates.push({ cards, eval: evalResult });
  };

  sortCards(hand).forEach(card => pushUnique([card]));
  getPlayablePairs(hand, -1).forEach(pushUnique);
  getPlayableTriples(hand, -1).forEach(pushUnique);
  getStraightCombos(hand).forEach(pushUnique);
  getFullHouseCombos(hand, -1).forEach(pushUnique);
  getFourKindCombos(hand, -1).forEach(pushUnique);
  getStraightFlushCombos(hand).forEach(pushUnique);
  if (canSplitDragon(hand)) pushUnique(hand);

  return candidates;
};

const pickLeadCombo = (candidates: Array<{ cards: Card[]; eval: ComboEval }>) => {
  if (candidates.length === 0) return null;
  return [...candidates].sort((a, b) => {
    const lenDiff = b.cards.length - a.cards.length;
    if (lenDiff !== 0) return lenDiff;
    const typeDiff = COMBO_TYPE_ORDER[a.eval.type] - COMBO_TYPE_ORDER[b.eval.type];
    if (typeDiff !== 0) return typeDiff;
    return a.eval.strength - b.eval.strength;
  })[0];
};

const findCutPlay = (hand: Card[], current: TrickState | null) => {
  const dragon = canSplitDragon(hand);
  if (dragon && (!current || current.cutRank < 3)) return hand;

  const straightFlushes = getStraightFlushCombos(hand)
    .map(cards => ({ cards, eval: evaluateCombo(cards) }))
    .filter(item => item.eval && item.eval.type === 'STRAIGHT_FLUSH');
  if (straightFlushes.length > 0) {
    const sorted = straightFlushes.sort((a, b) => (a.eval!.strength - b.eval!.strength));
    const candidate = sorted[0];
    if (!current || current.cutRank < 2 || candidate.eval!.strength > current.strength) {
      return candidate.cards;
    }
  }

  const fourKinds = getFourKindCombos(hand, -1)
    .map(cards => ({ cards, eval: evaluateCombo(cards) }))
    .filter(item => item.eval && item.eval.type === 'FOUR_KIND');
  if (fourKinds.length > 0) {
    const sorted = fourKinds.sort((a, b) => (a.eval!.strength - b.eval!.strength));
    const candidate = sorted[0];
    if (!current || current.cutRank < 1 || candidate.eval!.strength > current.strength) {
      return candidate.cards;
    }
  }

  return null;
};

const chooseGreedyPlay = (hand: Card[], current: TrickState | null, mustIncludeThree: boolean) => {
  if (mustIncludeThree) {
    const candidates = buildCandidates(hand).filter(item =>
      item.cards.some(card => cardKey(card) === THREE_CLUBS_KEY)
    );
    const best = pickLeadCombo(candidates);
    if (best) return best.cards;
    const threeClub = hand.find(card => cardKey(card) === THREE_CLUBS_KEY);
    if (threeClub) return [threeClub];
  }

  if (!current) {
    const best = pickLeadCombo(buildCandidates(hand));
    return best ? best.cards : [sortCards(hand)[0]];
  }

  if (current.cutRank === 0) {
    if (current.type === 'SINGLE') {
      const candidates = getPlayableSingles(hand, current.strength);
      if (candidates.length > 0) return candidates[0];
    }
    if (current.type === 'PAIR') {
      const candidates = getPlayablePairs(hand, current.strength);
      if (candidates.length > 0) return candidates[0];
    }
    if (current.type === 'TRIPLE') {
      const candidates = getPlayableTriples(hand, current.strength);
      if (candidates.length > 0) return candidates[0];
    }
    if (current.type === 'STRAIGHT') {
      const straights = getStraightCombos(hand)
        .map(cards => ({ cards, eval: evaluateCombo(cards) }))
        .filter(item => item.eval && item.eval.type === 'STRAIGHT')
        .sort((a, b) => (a.eval!.strength - b.eval!.strength));
      const candidate = straights.find(item => item.eval!.strength > current.strength);
      if (candidate) return candidate.cards;
    }
    if (current.type === 'FULL_HOUSE') {
      const fullHouses = getFullHouseCombos(hand, current.strength)
        .map(cards => ({ cards, eval: evaluateCombo(cards) }))
        .filter(item => item.eval && item.eval.type === 'FULL_HOUSE')
        .sort((a, b) => (a.eval!.strength - b.eval!.strength));
      if (fullHouses.length > 0) return fullHouses[0].cards;
    }
  }

  if (current.cutRank === 1) {
    const fourKinds = getFourKindCombos(hand, current.strength)
      .map(cards => ({ cards, eval: evaluateCombo(cards) }))
      .filter(item => item.eval && item.eval.type === 'FOUR_KIND')
      .sort((a, b) => (a.eval!.strength - b.eval!.strength));
    if (fourKinds.length > 0) return fourKinds[0].cards;
  }
  if (current.cutRank <= 1) {
    const straightFlushes = getStraightFlushCombos(hand)
      .map(cards => ({ cards, eval: evaluateCombo(cards) }))
      .filter(item => item.eval && item.eval.type === 'STRAIGHT_FLUSH')
      .sort((a, b) => (a.eval!.strength - b.eval!.strength));
    if (straightFlushes.length > 0) return straightFlushes[0].cards;
  }
  if (current.cutRank <= 2 && canSplitDragon(hand)) return hand;

  return findCutPlay(hand, current);
};

// --- ADVANCED TEAM PLAY STRATEGY ---

// Helper to get card rank strength in Big Two (3=0 ... 2=12)
const getRankStrength = (rank: string) => {
  const map: Record<string, number> = {
    '3': 0, '4': 1, '5': 2, '6': 3, '7': 4, '8': 5, '9': 6, '10': 7,
    'J': 8, 'Q': 9, 'K': 10, 'A': 11, '2': 12
  };
  return map[rank] ?? 0;
};

const identifyRoles = (players: BigTwoAiPlayer[], teamIndices: number[]): Record<number, TeamRole> => {
  const roles: Record<number, TeamRole> = {};

  // Score hands: +10 per card (bad), -Strength/2 (good)
  // Finisher: Low count, high strength
  const getHandScore = (hand: Card[]) => {
    const strengthSum = hand.reduce((sum, c) => sum + getRankStrength(c.rank), 0);
    const avgStrength = hand.length > 0 ? strengthSum / hand.length : 0;
    // Lower score is better for Finishing
    return (hand.length * 10) - avgStrength;
  };

  const sorted = [...teamIndices].sort((a, b) => getHandScore(players[a].hand) - getHandScore(players[b].hand));

  roles[sorted[0]] = 'FINISHER';
  if (sorted.length > 1) {
    roles[sorted[1]] = 'CONTROLLER';
  }
  if (sorted.length > 2) {
    roles[sorted[2]] = 'BREAKER';
  }

  return roles;
};

const getLegalPlays = (hand: Card[], current: TrickState | null, mustIncludeThree: boolean) =>
  buildCandidates(hand)
    .filter(item => canBeat(item.eval, current))
    .filter(item => !mustIncludeThree || item.cards.some(card => cardKey(card) === THREE_CLUBS_KEY));

const chooseTeamPlay = (
  hand: Card[],
  current: TrickState | null,
  mustIncludeThree: boolean,
  myIdx: number,
  snapshotPlayers: BigTwoAiPlayer[], // Used only for teammate hand lookup (simulated truth)
  activePlayers: number[], // List of active player indices
  ctx: TeamContext
) => {
  const legalMoves = getLegalPlays(hand, current, mustIncludeThree);

  if (legalMoves.length === 0) return null;
  if (mustIncludeThree) return pickLeadCombo(legalMoves)?.cards;

  const myRole = ctx.roles[myIdx] || 'CONTROLLER';
  const _myHandSize = hand.length;
  // Use length of activePlayers to correctly determine next player
  // But activePlayers includes ME.
  // Next player is the first index in activePlayers that is "after" me in cyclic order.
  const myActivePos = activePlayers.indexOf(myIdx);
  const nextActiveIndex = activePlayers[(myActivePos + 1) % activePlayers.length];

  const isTeammateLead = current && ctx.teammates.includes(current.playerIndex);
  const isHumanNext = nextActiveIndex === ctx.humanIdx;

  // Estimate Human Weakness instead of peeking
  // We use ctx.probHumanHasTwo (0-1) and ctx.unknownCardsCount (human hand size)
  // Human is "dangerous" if they have few cards.
  const humanHandSize = ctx.unknownCardsCount; // From context (passed down snapshot length)
  const isHumanLow = humanHandSize <= 3;

  // -- HARD RULES (Overriding Filters) --

  // 1. Teammate Lead Rule: Default PASS
  if (isTeammateLead) {
    // Exceptions:
    // A. Win Immediately: Can finish right now
    const winMove = legalMoves.find(m => m.cards.length === hand.length);
    if (winMove) {
      // Only if it's a team win (human is not winner). 
      // In Nightmare mode, any NPC win is a team win. So YES.
      return winMove.cards;
    }

    // B. Critical Intercept: Human is next, Human is dangerous (<=3), and we can block high
    if (isHumanNext && isHumanLow && current) {
      // Allowed only if we play a strong card (Strength >= 10 -> K, A, 2) to force human resources
      // And only if we don't overkill too much if teammate's card was already decent? 
      // Simplified: If teammate's lead was weak (<=9) and we can boost to >=10
      if (current.strength <= 9) {
        const blocker = legalMoves.find(m => m.eval.strength >= 10);
        if (blocker) {
          // We allow it, but let scoring decide WHICH blocker
          // So we filter OUT non-blockers, but keep blockers.
          // Actually, we should essentially return the best blocker here or continue to scoring.
          // Let's just NOT return null here, and let scoring prioritize the block.
        } else {
          return null; // Can't block high, so pass
        }
      } else {
        return null; // Teammate already high, pass
      }
    } else {
      return null; // Default Pass
    }
  }

  // 2. Cut & Two Restrictions (Early Game)
  // "Early" defined as: Human has > 5 cards
  const isEarly = humanHandSize > 5;
  const filteredMoves = legalMoves.filter(move => {
    const isTwo = move.cards.some(c => c.rank === '2');
    const isCut = move.eval.cutRank > 0;

    if (isEarly && !current) {
      // Leading: Don't lead 2s
      if (isTwo) return false;
    }

    if (isEarly && (isTwo || isCut)) {
      // Only allowed if:
      // 1. Take back lead from Human
      if (current && current.playerIndex === ctx.humanIdx) return true;
      // 2. Can relay to Finisher (Complex to check here, let logic flow? No, hard filter)
      // Let's allow it in scoring phase to penalize, but hard filter "useless" drops.
      // Actually, preventing simple 2 drops is good.
      if (!current) return false; // Don't lead 2 early
    }
    return true;
  });

  const candidates = filteredMoves.length > 0 ? filteredMoves : legalMoves; // Fallback if all filtered

  // -- SCORING SYSTEM --

  let bestMove = candidates[0];
  let maxScore = -999999;

  candidates.forEach(move => {
    let score = 0;

    const power = getCandidatePower(move.eval);
    const isHighCard = move.eval.strength > 11; // A(11) or 2(12)
    const isTwo = move.cards.some(c => c.rank === '2');
    const isCut = move.eval.cutRank > 0;

    // 1. Role Base Scores
    if (myRole === 'FINISHER') {
      score += 50 * move.cards.length;
      if (move.cards.length === hand.length) score += 10000;
    }

    if (myRole === 'CONTROLLER') {
      if (isHighCard) score += 40; // Control!
      score += power / 50;

      // If leading, prefer patterns that are hard for human (probabilistic)
      if (!current) {
        // If Human has 2s (probable), maybe bait?
        // If Human likely no 2s, spam high singles
        if (ctx.probHumanHasTwo < 0.3 && move.cards.length === 1 && move.eval.strength >= 10) {
          score += 100; // BULLY MODE
        }
      }
    }

    if (myRole === 'BREAKER') {
      if (isTwo || isCut) score -= 60; // Hold resources!
      // But if blocking human...
      if (current && current.playerIndex === ctx.humanIdx) {
        if (isTwo || isCut) score += 120; // USE resources!
      }
    }

    // 2. Pressure & Reaction
    if (current && current.playerIndex === ctx.humanIdx) {
      score += 100; // Base: Beat human
      // Block Human Exception:
      // If Human played low, and I play SUPER high, that's good?
      // Or play "Just enough"?
      // Rule: "Just enough" to save strength, unless human is Low Hand.
      if (isHumanLow && isHighCard) score += 50; // Crush hopes
    }

    // 3. Relay Score (Teammate is Next)
    // If Next is Teammate, play something they can likely beat?
    // We can peek teammate hand for this specific collaborative score (simulated communication)
    if (!current && activePlayers.includes(nextActiveIndex) && ctx.teammates.includes(nextActiveIndex)) {
      const teammateHand = snapshotPlayers[nextActiveIndex].hand;
      if (move.eval.type === 'SINGLE') {
        // If teammate has high singles, good
        if (getPlayableSingles(teammateHand, move.eval.strength).length > 0) score += 30;
      } else if (move.eval.type === 'PAIR') {
        if (getPlayablePairs(teammateHand, move.eval.strength).length > 0) score += 40;
      }
      // ... etc for other types
    }

    // 4. Endgame Bonus
    // If Finisher can go out in <= 2 turns after this?
    // Hard to calc without full search. Simplified:
    // If this move gives lead to Finisher (Next is Finisher)
    if (nextActiveIndex && ctx.roles[nextActiveIndex] === 'FINISHER' && move.cards.length === 1 && move.eval.strength < 8) {
      // Passing low card to finisher
      score += 50;
    }

    if (score > maxScore) {
      maxScore = score;
      bestMove = move;
    }
  });

  return bestMove.cards;
};

// --- SIMULATION ---

const simulateRound = (
  candidate: { cards: Card[]; eval: ComboEval },
  aiIdx: number,
  snapshotPlayers: BigTwoAiPlayer[],
  playedCards: Card[],
  nightmareMode = false,
  humanIdx = -1,
  _totalSims = 300
) => {
  const aiHand = sortCards(snapshotPlayers[aiIdx].hand);
  const aiRemaining = aiHand.filter(card => !candidate.cards.some(c => cardKey(c) === cardKey(card)));

  // 1. Build Deck & Probabilistic Estimation
  const excludedKeys = new Set<string>();
  aiHand.forEach(card => excludedKeys.add(cardKey(card)));
  playedCards.forEach(card => excludedKeys.add(cardKey(card)));

  // In Nightmare, we know teammate hands
  let teammateHandsKnown: Card[] = [];
  if (nightmareMode) {
    snapshotPlayers.forEach((p, idx) => {
      if (idx !== aiIdx && idx !== humanIdx) {
        teammateHandsKnown = [...teammateHandsKnown, ...p.hand];
        p.hand.forEach(card => excludedKeys.add(cardKey(card)));
      }
    });
  }

  // Cards unknown to me (The AI decision maker)
  // This includes Human's hand + (if not nightmare) other NPCs
  const deck = createDeck().filter(card => !excludedKeys.has(cardKey(card)));

  // Estimate Probabilities (Belief State)
  let probHumanHasTwo = 0.5;
  if (nightmareMode && humanIdx >= 0) {
    const remainingUnknown = deck.length;
    if (remainingUnknown > 0) {
      const twosInUnknown = deck.filter(c => c.rank === '2').length;
      const humanHandCount = snapshotPlayers[humanIdx].hand.length;
      // Simple Hypergeometric prob: P(X >= 1) = 1 - P(X=0)
      // P(X=0) = C(NonTwos, k) / C(Total, k)
      // Rough approx:
      if (twosInUnknown === 0) probHumanHasTwo = 0;
      else if (humanHandCount >= remainingUnknown) probHumanHasTwo = 1;
      else {
        // Approximation: 1 - ((Total-Twos)/Total)^Count
        const nonTwos = remainingUnknown - twosInUnknown;
        const probNone = Math.pow(nonTwos / remainingUnknown, humanHandCount);
        probHumanHasTwo = 1 - probNone;
      }
    } else {
      probHumanHasTwo = 0;
    }
  }

  // Shuffle Deck for simulation instance
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  // Distribute Hands
  const simHands: Card[][] = snapshotPlayers.map((p, idx) => {
    if (idx === aiIdx) return sortCards(aiRemaining);
    if (p.hand.length === 0) return [];
    if (nightmareMode && idx !== humanIdx) return sortCards(p.hand);
    return [];
  });

  let cursor = 0;
  snapshotPlayers.forEach((p, idx) => {
    if (idx === aiIdx) return;
    if (p.hand.length === 0) return;
    if (nightmareMode && idx !== humanIdx) return; // Teammates already set
    // Distribute to Unknowns (Human or Normal NPCs)
    simHands[idx] = sortCards(deck.slice(cursor, cursor + p.hand.length));
    cursor += p.hand.length;
  });

  // Setup Team Context
  let teamContext: TeamContext | undefined;
  if (nightmareMode && humanIdx >= 0) {
    const teammateIndices = snapshotPlayers
      .map((_, i) => i)
      .filter(i => i !== humanIdx);

    // Pass FULL players (with simHands) to identify roles correctly for this simulation instance
    // We construct temporary players with simHands
    const simPlayersForRoles: BigTwoAiPlayer[] = simHands.map(h => ({ hand: h }));
    const roles = identifyRoles(simPlayersForRoles, teammateIndices);

    teamContext = {
      roles,
      teammates: teammateIndices,
      humanIdx,
      probHumanHasTwo,
      unknownCardsCount: snapshotPlayers[humanIdx].hand.length
    };
  }

  let current: TrickState | null = {
    ...candidate.eval,
    cards: sortCards(candidate.cards),
    playerIndex: aiIdx
  };

  const getNextSimIndex = (from: number) => {
    let idx = (from + 1) % simHands.length;
    let safety = 0;
    while (safety < simHands.length) {
      if (simHands[idx].length > 0) return idx;
      idx = (idx + 1) % simHands.length;
      safety += 1;
    }
    return from; // Shoudn't happen if game not over
  };

  let currentTurn = getNextSimIndex(aiIdx);
  const passed = new Array(simHands.length).fill(false);
  let safety = 0;
  let firstWinner = -1;

  // Unified Pass Handler
  const applyPass = () => {
    passed[currentTurn] = true;

    // Get active players (indices)
    const activeIndices = simHands.map((h, i) => h.length > 0 ? i : -1).filter(i => i !== -1);

    if (!current) {
      // Should not happen: Pass on null current?
      // Means leader passed? Logic error, just move on.
      currentTurn = getNextSimIndex(currentTurn);
      return;
    }

    const leaderIdx = current.playerIndex;
    // Check if everyone ELSE has passed
    // NOTE: If leader is finished (empty hand), they are not "active" in terms of playing,
    // but they still hold the Trick.
    // So we check: Do all Active Players (excluding leader if he is active) have passed=true?

    const others = activeIndices.filter(idx => idx !== leaderIdx);
    const allOthersPassed = others.every(idx => passed[idx]);

    if (allOthersPassed) {
      // Trick Reset
      current = null;
      passed.fill(false);

      // Determine next leader
      if (simHands[leaderIdx].length === 0) {
        // Leader finished, next active player leads
        currentTurn = getNextSimIndex(leaderIdx);
      } else {
        currentTurn = leaderIdx;
      }
    } else {
      currentTurn = getNextSimIndex(currentTurn);
    }
  };

  while (safety < 400) {
    safety += 1;

    // Check Win
    if (simHands[aiIdx].length === 0) {
      return firstWinner === aiIdx || (nightmareMode && firstWinner !== humanIdx);
    }

    const activeIndices = simHands.map((h, i) => h.length > 0 ? i : -1).filter(i => i !== -1);

    // Last man standing?
    if (activeIndices.length === 1) {
      if (firstWinner === -1) firstWinner = activeIndices[0];
      return firstWinner === aiIdx || (nightmareMode && firstWinner !== humanIdx);
    }

    // Current player empty? (finished)
    if (simHands[currentTurn].length === 0) {
      currentTurn = getNextSimIndex(currentTurn);
      continue;
    }

    // DECISION
    let play: Card[] | null | undefined = null;

    if (nightmareMode && currentTurn !== humanIdx && teamContext) {
      // Use activeIndices to help chooseTeamPlay know who is next
      play = chooseTeamPlay(simHands[currentTurn], current, false, currentTurn, snapshotPlayers, activeIndices, teamContext);
    } else {
      // Human / Normal AI
      const rand = Math.random();
      if (rand < 0.7) {
        play = chooseGreedyPlay(simHands[currentTurn], current, false);
      } else if (rand < 0.9) {
        play = null;
      } else {
        // Weak play
        const legals = getLegalPlays(simHands[currentTurn], current, false);
        if (legals.length > 0) play = legals.sort((a, b) => a.eval.strength - b.eval.strength)[0].cards;
      }
    }

    if (!play || play.length === 0) {
      applyPass();
      continue;
    }

    const evalResult = evaluateCombo(play);
    if (!evalResult || !canBeat(evalResult, current)) {
      // Invalid play -> Pass
      applyPass();
      continue;
    }

    // Execute Play
    simHands[currentTurn] = sortCards(simHands[currentTurn].filter(card => !play!.some(c => cardKey(c) === cardKey(card))));

    if (simHands[currentTurn].length === 0 && firstWinner === -1) {
      firstWinner = currentTurn;
      if (nightmareMode ? currentTurn !== humanIdx : currentTurn === aiIdx) return true;
    }

    current = {
      ...evalResult,
      cards: sortCards(play),
      playerIndex: currentTurn
    };
    passed.fill(false); // Reset pass on valid play
    currentTurn = getNextSimIndex(currentTurn);
  }

  return false;
};

export const aiChoosePlay = (
  hand: Card[],
  current: TrickState | null,
  mustIncludeThree: boolean,
  aiIdx: number,
  players: BigTwoAiPlayer[],
  playedCards: Card[],
  nightmareMode = false,
  humanIdx = -1,
  _totalSims = 300
) => {
  const legalCandidates = getLegalPlays(hand, current, mustIncludeThree);
  if (legalCandidates.length === 0) return null;

  const dynSims = Math.min(100 + hand.length * 20, 800);

  // Power normalization
  const powers = legalCandidates.map(candidate => getCandidatePower(candidate.eval));
  const minPower = Math.min(...powers);
  const maxPower = Math.max(...powers);
  const handSize = hand.length; // Used in tactic score
  const lengthNorm = (length: number) => (length - 1) / 12;

  let best = legalCandidates[0];
  let bestScore = -999999;

  legalCandidates.forEach(candidate => {
    let wins = 0;
    for (let i = 0; i < dynSims; i++) {
      if (simulateRound(candidate, aiIdx, players, playedCards, nightmareMode, humanIdx)) wins += 1;
    }
    const score = wins / dynSims; // 0..1

    // Heuristics
    const normalizedPower = maxPower === minPower ? 0 : (getCandidatePower(candidate.eval) - minPower) / (maxPower - minPower);
    const isMonster = candidate.eval.cutRank > 0;
    const usesTwo = candidate.cards.some(card => card.rank === '2');
    const tactic = players[aiIdx]?.tactic;

    let tacticScore = 0;
    // Standard heuristics (unchanged)
    if (tactic === 'BAIT') {
      tacticScore = -0.25 * normalizedPower - 0.15 * lengthNorm(candidate.cards.length) - (isMonster ? 0.2 : 0);
    } else if (tactic === 'CONSERVATIVE') {
      tacticScore = -0.2 * normalizedPower - 0.1 * lengthNorm(candidate.cards.length) - (usesTwo ? 0.2 : 0) - (isMonster ? 0.3 : 0);
    } else if (tactic === 'DECEPTIVE') {
      const early = handSize > 7;
      tacticScore = early
        ? -0.2 * normalizedPower - 0.1 * lengthNorm(candidate.cards.length)
        : 0.2 * normalizedPower + 0.1 * lengthNorm(candidate.cards.length) + (isMonster ? 0.2 : 0);
    } else if (tactic === 'AGGRESSIVE') {
      tacticScore = 0.25 * normalizedPower + 0.15 * lengthNorm(candidate.cards.length) + (isMonster ? 0.2 : 0);
    }

    const scoreWeight = nightmareMode ? 5.0 : 1.0;
    const totalScore = (score * scoreWeight) + tacticScore;

    if (totalScore > bestScore) {
      bestScore = totalScore;
      best = candidate;
    } else if (totalScore === bestScore) {
      if (candidate.cards.length > best.cards.length) best = candidate;
      else if (candidate.cards.length === best.cards.length && candidate.eval.strength < best.eval.strength) best = candidate;
    }
  });

  return best.cards;
};
