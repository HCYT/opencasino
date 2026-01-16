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

const getLegalPlays = (hand: Card[], current: TrickState | null, mustIncludeThree: boolean) =>
  buildCandidates(hand)
    .filter(item => canBeat(item.eval, current))
    .filter(item => !mustIncludeThree || item.cards.some(card => cardKey(card) === THREE_CLUBS_KEY));

const simulateRound = (
  candidate: { cards: Card[]; eval: ComboEval },
  aiIdx: number,
  snapshotPlayers: BigTwoAiPlayer[],
  playedCards: Card[]
) => {
  const aiHand = sortCards(snapshotPlayers[aiIdx].hand);
  const aiRemaining = aiHand.filter(card => !candidate.cards.some(c => cardKey(c) === cardKey(card)));
  const excludedKeys = new Set<string>();
  aiHand.forEach(card => excludedKeys.add(cardKey(card)));
  playedCards.forEach(card => excludedKeys.add(cardKey(card)));

  const deck = createDeck().filter(card => !excludedKeys.has(cardKey(card)));
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }

  const simHands: Card[][] = snapshotPlayers.map((p, idx) => {
    if (idx === aiIdx) return sortCards(aiRemaining);
    if (p.hand.length === 0) return [];
    return [];
  });

  let cursor = 0;
  snapshotPlayers.forEach((p, idx) => {
    if (idx === aiIdx || p.hand.length === 0) return;
    simHands[idx] = sortCards(deck.slice(cursor, cursor + p.hand.length));
    cursor += p.hand.length;
  });

  let current: TrickState | null = {
    ...candidate.eval,
    cards: sortCards(candidate.cards),
    playerIndex: aiIdx
  };
  const getNextSimIndex = (from: number) => {
    if (simHands.length === 0) return from;
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
  const passed = snapshotPlayers.map(() => false);
  let safety = 0;

  while (safety < 400) {
    safety += 1;
    if (simHands[aiIdx].length === 0) return true;
    const activePlayers = simHands.map((hand, idx) => ({ idx, count: hand.length })).filter(p => p.count > 0);
    if (activePlayers.length === 1) {
      return activePlayers[0].idx === aiIdx;
    }

    if (simHands[currentTurn].length === 0) {
      currentTurn = getNextSimIndex(currentTurn);
      continue;
    }

    const play = chooseGreedyPlay(simHands[currentTurn], current, false);
    if (!play || play.length === 0) {
      passed[currentTurn] = true;
      if (current) {
        const leaderIdx = current.playerIndex;
        const othersPassed = activePlayers
          .filter(p => p.idx !== leaderIdx)
          .every(p => passed[p.idx]);
        if (othersPassed) {
          current = null;
          passed.fill(false);
          currentTurn = simHands[leaderIdx].length === 0 ? getNextSimIndex(leaderIdx) : leaderIdx;
          continue;
        }
      }
      currentTurn = getNextSimIndex(currentTurn);
      continue;
    }

    const evalResult = evaluateCombo(play);
    if (!evalResult || !canBeat(evalResult, current)) {
      passed[currentTurn] = true;
      currentTurn = getNextSimIndex(currentTurn);
      continue;
    }

    simHands[currentTurn] = sortCards(simHands[currentTurn].filter(card => !play.some(c => cardKey(c) === cardKey(card))));
    if (simHands[currentTurn].length === 0) {
      return currentTurn === aiIdx;
    }
    current = {
      ...evalResult,
      cards: sortCards(play),
      playerIndex: currentTurn
    };
    passed.fill(false);
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
  totalSims = 300
) => {
  const legalCandidates = getLegalPlays(hand, current, mustIncludeThree);
  if (legalCandidates.length === 0) return null;

  const powers = legalCandidates.map(candidate => getCandidatePower(candidate.eval));
  const minPower = Math.min(...powers);
  const maxPower = Math.max(...powers);
  const handSize = hand.length;
  const lengthNorm = (length: number) => (length - 1) / 12;

  let best = legalCandidates[0];
  let bestScore = -1;

  legalCandidates.forEach(candidate => {
    let wins = 0;
    for (let i = 0; i < totalSims; i++) {
      if (simulateRound(candidate, aiIdx, players, playedCards)) wins += 1;
    }
    const score = wins / totalSims;
    const normalizedPower = maxPower === minPower ? 0 : (getCandidatePower(candidate.eval) - minPower) / (maxPower - minPower);
    const isMonster = candidate.eval.cutRank > 0;
    const usesTwo = candidate.cards.some(card => card.rank === '2');
    const tactic = players[aiIdx]?.tactic;
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
    const totalScore = score + tacticScore;
    if (totalScore > bestScore) {
      bestScore = totalScore;
      best = candidate;
    } else if (totalScore === bestScore) {
      if (candidate.cards.length > best.cards.length) {
        best = candidate;
      } else if (candidate.cards.length === best.cards.length && candidate.eval.strength < best.eval.strength) {
        best = candidate;
      }
    }
  });

  return best.cards;
};
