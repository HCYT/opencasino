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
  simHands: Card[][], // Use REAL TIME simulation hands
  activePlayers: number[],
  ctx: TeamContext
) => {
  const legalMoves = getLegalPlays(hand, current, mustIncludeThree);

  if (legalMoves.length === 0) return null;
  if (mustIncludeThree) return pickLeadCombo(legalMoves)?.cards;

  const myRole = ctx.roles[myIdx] || 'CONTROLLER';

  const myActivePos = activePlayers.indexOf(myIdx);
  const nextActiveIndex = activePlayers[(myActivePos + 1) % activePlayers.length];

  const isTeammateLead = current && ctx.teammates.includes(current.playerIndex);
  const isHumanNext = nextActiveIndex === ctx.humanIdx;

  // Use simHands for accurate state
  const humanHandSize = simHands[ctx.humanIdx]?.length ?? 99;
  const isHumanDangerous = humanHandSize <= 3;

  // Finisher Ready Check (Use simHands!)
  // And EXCLUDE if Finished (size == 0)
  let finisherReady = false;
  const finisherIdxStr = Object.entries(ctx.roles).find(([, r]) => r === 'FINISHER')?.[0];
  if (finisherIdxStr) {
    const fIdx = parseInt(finisherIdxStr, 10);
    const fHandSize = simHands[fIdx]?.length ?? 99;
    if (fHandSize > 0 && fHandSize <= 4) finisherReady = true;
  }

  // --- 1. Teammate Lead Logic (Strict) ---
  if (isTeammateLead) {
    // A. Win Immediately
    const winMove = legalMoves.find(m => m.cards.length === hand.length);
    if (winMove) {
      return winMove.cards;
    }

    // B. Critical Intercept (Check for Cuts too if Human very low)
    if (isHumanNext && isHumanDangerous && current && current.strength <= 9) {
      // Filter: Strength >= 10 (K, A, 2)
      // Initial Check: No cuts (CutRank == 0)
      let candidates = legalMoves.filter(m => m.eval.strength >= 10 && m.eval.cutRank === 0);

      // Exception: If Human <= 2 cards, allow Cuts
      if (candidates.length === 0 && humanHandSize <= 2) {
        candidates = legalMoves.filter(m => m.eval.cutRank > 0);
      }

      if (candidates.length > 0) {
        // Pick smallest sufficient intercept
        return candidates.sort((a, b) => a.eval.strength - b.eval.strength)[0].cards;
      }
      return null;
    }

    // Default Pass
    return null;
  }

  // --- 2. Scoring System ---

  let bestMove = legalMoves[0];
  let maxScore = -999999;

  legalMoves.forEach(move => {
    let score = 0;

    const isHighCard = move.eval.strength > 11; // A(11) or 2(12)
    const isTwo = move.cards.some(c => c.rank === '2');
    const isCut = move.eval.cutRank > 0;

    // Pattern Preference (Lock patterns > Singles)
    const isPattern = move.eval.type !== 'SINGLE';
    const isFiveCard = ['STRAIGHT', 'FLUSH', 'FULL_HOUSE', 'FOUR_KIND', 'STRAIGHT_FLUSH'].includes(move.eval.type);

    // -- Roles Base --
    if (myRole === 'FINISHER') {
      score += 50 * move.cards.length;
      if (move.cards.length === hand.length) score += 10000;
    }

    if (myRole === 'CONTROLLER') {
      if (current) {
        // Following
        if (isHighCard) score += 30; // Control!
        score += move.eval.strength;
      } else {
        // Leading: Prioritize Patterns & Clearing Hand
        score += 20 * move.cards.length; // Efficiency

        if (isPattern) score += 40; // Prefer pattern leads
        if (isFiveCard) score += 20;

        // Pressure Curve
        if (humanHandSize <= 5) {
          score += 50; // Urgent control
        }

        // Single High Card Lead Penalty if Human unlikely to have 2
        // (If Human has no 2s, Single K/A leads are good. If Human HAS 2s, don't feed.)
        // Wait, rule is: If probHumanHasTwo is LOW (<0.3), Bully with High Singles.
        if (move.eval.type === 'SINGLE' && isHighCard) {
          if (ctx.probHumanHasTwo > 0.7) score -= 50; // Don't feed 2s
          else if (ctx.probHumanHasTwo < 0.3) score += 50; // Bully
        }
      }
    }

    if (myRole === 'BREAKER') {
      if (isTwo || isCut) score -= 60; // Hold resources!
      if (current && current.playerIndex === ctx.humanIdx) {
        if (isTwo || isCut) score += 100; // USE resources!
      }
    }

    // -- Scenario: Human Lead (Must Beat) --
    if (current && current.playerIndex === ctx.humanIdx) {
      // a) Base: Prefer smallest capture (Conserve)
      // Overkill Penalty using Strength diff
      score -= (move.eval.strength - current.strength) * 2;
      score -= (move.eval.cutRank - current.cutRank) * 50;

      // b) Human Dangerous: Bonus for High Cards (Crush)
      if (isHumanDangerous) {
        if (isHighCard) score += 50;
        score += move.eval.strength * 2;
      }

      // c) Relay: Next is Teammate
      if (activePlayers.includes(nextActiveIndex) && ctx.teammates.includes(nextActiveIndex)) {
        const tmHand = simHands[nextActiveIndex];
        if (tmHand && tmHand.length > 0) {
          // Check Singles
          if (move.eval.type === 'SINGLE' && getPlayableSingles(tmHand, move.eval.strength).length > 0) score += 30;
          // Check Pairs
          else if (move.eval.type === 'PAIR' && getPlayablePairs(tmHand, move.eval.strength).length > 0) score += 40;
          // Check Triples - NEW
          else if (move.eval.type === 'TRIPLE' && getPlayableTriples(tmHand, move.eval.strength).length > 0) score += 45;
          // Check 5-Card (Simplified: If I play 5-card, does teammate have ANY 5-card?) - NEW
          else if (isFiveCard) {
            // Simplified check: Just checking if they have valid combos
            if (getStraightCombos(tmHand).length > 0 || getFullHouseCombos(tmHand, -1).length > 0) {
              score += 50;
            }
          }
        }
      }

      // d) Resource Penalty (with Exceptions)
      if (isTwo || isCut) {
        if (isHumanDangerous || finisherReady) {
          score += 20;
        } else {
          score -= 100;
        }
      }
    }

    // -- Scenario: Leading (current == null) --
    if (!current) {
      if (finisherReady) {
        // Pass to Finisher
        if (move.eval.strength <= 8) score += 40;
        if (move.cards.length === 1) score -= 10;
      } else             // Lock Logic (Teammate Sustain) - NEW
        if (activePlayers.includes(nextActiveIndex) && ctx.teammates.includes(nextActiveIndex)) {
          const tmHand = simHands[nextActiveIndex];
          let canTmFollow = false;

          if (move.eval.type === 'PAIR') {
            canTmFollow = getPlayablePairs(tmHand, move.eval.strength).length > 0;
          } else if (move.eval.type === 'TRIPLE') {
            // requires getPlayableTriples
            canTmFollow = getPlayableTriples(tmHand, move.eval.strength).length > 0;
          } else if (isFiveCard) {
            // conservative: only claim "can follow" if teammate can CUT (strong guarantee)
            // You can expand this later with same-type beating checks if you implement them.
            const tmCandidates = buildCandidates(tmHand);
            canTmFollow = tmCandidates.some(x => x.eval.cutRank > 0);
          }

          if (canTmFollow) score += 30;
          else score -= 30; // Don't block teammate
        }      // Probability Logic
      if (ctx.probHumanHasTwo < 0.3) {
        // Bully with High Singles
        if (move.eval.type === 'SINGLE' && move.eval.strength >= 10) score += 60;
      } else if (ctx.probHumanHasTwo > 0.7) {
        // Avoid forcing 2s (High Singles)
        if (move.eval.type === 'SINGLE' && move.eval.strength >= 10) score -= 40;
        // Force structure break
        if (move.eval.type === 'FULL_HOUSE' || move.eval.type === 'STRAIGHT') score += 40;
      }
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
  humanIdx = -1
): number => { // RETURN NUMBER UTILITY
  const aiHand = sortCards(snapshotPlayers[aiIdx].hand);
  const aiRemaining = aiHand.filter(card => !candidate.cards.some(c => cardKey(c) === cardKey(card)));

  const excludedKeys = new Set<string>();
  aiHand.forEach(card => excludedKeys.add(cardKey(card)));
  playedCards.forEach(card => excludedKeys.add(cardKey(card)));

  if (nightmareMode) {
    snapshotPlayers.forEach((p, idx) => {
      if (idx !== aiIdx && idx !== humanIdx) {
        p.hand.forEach(card => excludedKeys.add(cardKey(card)));
      }
    });
  }

  const deck = createDeck().filter(card => !excludedKeys.has(cardKey(card)));

  // Determine whether we can deduce human exact hand in Nightmare mode
  let probHumanHasTwo = 0.5;
  const humanCount = (nightmareMode && humanIdx >= 0) ? snapshotPlayers[humanIdx].hand.length : 0;

  const canDeduceHumanExact =
    nightmareMode &&
    humanIdx >= 0 &&
    deck.length === humanCount; // sanity check: unknown pool size equals human hand size

  if (nightmareMode && humanIdx >= 0) {
    if (canDeduceHumanExact) {
      // exact
      probHumanHasTwo = deck.some(c => c.rank === '2') ? 1 : 0;
    } else {
      // fallback approximate
      const twos = deck.filter(c => c.rank === '2').length;
      if (twos === 0) probHumanHasTwo = 0;
      else {
        const nonTwos = deck.length - twos;
        const probNone = Math.pow(nonTwos / deck.length, humanCount);
        probHumanHasTwo = 1 - probNone;
      }
    }
  }

  // Shuffle only when we cannot deduce exact human hand
  if (!canDeduceHumanExact) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }

  // Build simHands
  const simHands: Card[][] = snapshotPlayers.map((p, idx) => {
    if (idx === aiIdx) return sortCards(aiRemaining);
    if (p.hand.length === 0) return [];
    if (nightmareMode && idx !== humanIdx) return sortCards(p.hand); // NPC hands are known
    return [];
  });

  if (nightmareMode && humanIdx >= 0 && canDeduceHumanExact) {
    // Exact human hand
    simHands[humanIdx] = sortCards(deck);
  } else {
    // Fallback distribution from deck (human + any unknown NPCs)
    let cursor = 0;
    snapshotPlayers.forEach((p, idx) => {
      if (idx === aiIdx) return;
      if (p.hand.length === 0) return;
      if (nightmareMode && idx !== humanIdx) return; // already set
      simHands[idx] = sortCards(deck.slice(cursor, cursor + p.hand.length));
      cursor += p.hand.length;
    });
  }

  let teamContext: TeamContext | undefined;
  if (nightmareMode && humanIdx >= 0) {
    const teammateIndices = snapshotPlayers
      .map((_, i) => i)
      .filter(i => i !== humanIdx);

    // Pass FULL players (with simHands) to identify roles
    const simPlayersForRoles: BigTwoAiPlayer[] = simHands.map(h => ({ hand: h }));
    const roles = identifyRoles(simPlayersForRoles, teammateIndices);

    teamContext = {
      roles,
      teammates: teammateIndices,
      humanIdx,
      probHumanHasTwo
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
    return from;
  };

  let currentTurn = getNextSimIndex(aiIdx);
  const passed = new Array(simHands.length).fill(false);
  let safety = 0;
  let firstWinner = -1;

  const applyPass = () => {
    passed[currentTurn] = true;
    const activeIndices = simHands.map((h, i) => h.length > 0 ? i : -1).filter(i => i !== -1);

    if (!current) {
      currentTurn = getNextSimIndex(currentTurn);
      return;
    }

    const leaderIdx = current.playerIndex;
    const others = activeIndices.filter(idx => idx !== leaderIdx);
    const allOthersPassed = others.every(idx => passed[idx]);

    if (allOthersPassed) {
      current = null;
      passed.fill(false);
      if (simHands[leaderIdx].length === 0) {
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
    if (simHands[aiIdx].length === 0) {
      firstWinner = aiIdx;
      break;
    }
    const activeIndices = simHands.map((h, i) => h.length > 0 ? i : -1).filter(i => i !== -1);
    if (activeIndices.length === 1) {
      if (firstWinner === -1) firstWinner = activeIndices[0];
      break;
    }
    if (simHands[currentTurn].length === 0) {
      currentTurn = getNextSimIndex(currentTurn);
      continue;
    }

    // --- DECISION ---
    let play: Card[] | null | undefined = null;

    if (nightmareMode && currentTurn !== humanIdx && teamContext) {
      play = chooseTeamPlay(simHands[currentTurn], current, false, currentTurn, simHands, activeIndices, teamContext);
    } else {
      const rand = Math.random();
      if (rand < 0.7) {
        play = chooseGreedyPlay(simHands[currentTurn], current, false);
      } else if (rand < 0.9) {
        play = null;
      } else {
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
      applyPass();
      continue;
    }

    simHands[currentTurn] = sortCards(simHands[currentTurn].filter(card => !play!.some(c => cardKey(c) === cardKey(card))));
    if (simHands[currentTurn].length === 0 && firstWinner === -1) {
      firstWinner = currentTurn;
      break;
    }

    current = {
      ...evalResult,
      cards: sortCards(play),
      playerIndex: currentTurn
    };
    passed.fill(false);
    currentTurn = getNextSimIndex(currentTurn);
  }

  if (firstWinner !== -1) {
    if (nightmareMode) {
      if (firstWinner === humanIdx) return 0;
      const finisherIdxStr = Object.entries(teamContext?.roles || {}).find(([, r]) => r === 'FINISHER')?.[0];
      const finisherIdx = finisherIdxStr ? parseInt(finisherIdxStr, 10) : -1;
      if (firstWinner === finisherIdx) return 1.0;
      return 0.7;
    } else {
      return firstWinner === aiIdx ? 1 : 0;
    }
  }

  return 0;
};

// Calculate heuristic score for filtering
const getTacticScore = (
  candidate: { cards: Card[], eval: ComboEval },
  handSize: number,
  minPower: number,
  maxPower: number,
  tactic?: AITactic
) => {
  const normalizedPower = maxPower === minPower ? 0 : (getCandidatePower(candidate.eval) - minPower) / (maxPower - minPower);
  const isMonster = candidate.eval.cutRank > 0;
  const usesTwo = candidate.cards.some(card => card.rank === '2');
  const lengthNorm = (length: number) => (length - 1) / 12;

  let tacticScore = 0;
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
  return tacticScore;
};

export const aiChoosePlay = (
  hand: Card[],
  current: TrickState | null,
  mustIncludeThree: boolean,
  aiIdx: number,
  players: BigTwoAiPlayer[],
  playedCards: Card[],
  nightmareMode = false,
  humanIdx = -1
) => {
  const legalCandidates = getLegalPlays(hand, current, mustIncludeThree);
  if (legalCandidates.length === 0) return null;

  const dynSims = Math.min(100 + hand.length * 20, 800);

  const powers = legalCandidates.map(candidate => getCandidatePower(candidate.eval));
  const minPower = Math.min(...powers);
  const maxPower = Math.max(...powers);
  const handSize = hand.length;

  // Pre-calculate tactic scores for heuristics
  const candidatesWithScore = legalCandidates.map(c => ({
    ...c,
    heuristicScore: getTacticScore(c, handSize, minPower, maxPower, players[aiIdx]?.tactic)
  }));

  // Top-K Filtering
  // If too many candidates, take top 12 based on heuristic
  let candidatesToSimulate = candidatesWithScore;
  if (candidatesWithScore.length > 12) {
    // Sort descending by heuristic
    candidatesToSimulate = candidatesWithScore.sort((a, b) => b.heuristicScore - a.heuristicScore).slice(0, 12);
  }

  let best = candidatesToSimulate[0];
  let bestScore = -999999;

  candidatesToSimulate.forEach(candidate => {
    let utilitySum = 0;
    for (let i = 0; i < dynSims; i++) {
      utilitySum += simulateRound(candidate, aiIdx, players, playedCards, nightmareMode, humanIdx);
    }
    const score = utilitySum / dynSims;

    const scoreWeight = nightmareMode ? 5.0 : 1.0;
    const totalScore = (score * scoreWeight) + candidate.heuristicScore;

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
