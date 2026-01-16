import { NPCProfile } from '../../types';
import { BlackjackPlayer, BlackjackResult, TurnRef } from './types';

export const pickQuote = (profile: NPCProfile | undefined, result?: BlackjackResult) => {
  if (!profile || !result) return '';
  if (result === 'WIN' || result === 'BLACKJACK') {
    return profile.quotes.WIN[Math.floor(Math.random() * profile.quotes.WIN.length)] ?? '';
  }
  if (result === 'LOSE') {
    return profile.quotes.LOSE[Math.floor(Math.random() * profile.quotes.LOSE.length)] ?? '';
  }
  return '';
};

export const decideNpcBet = (chips: number, minBet: number) => {
  if (chips <= minBet) return minBet;
  const maxStep = Math.min(chips, minBet * 6);
  const steps = Math.max(1, Math.floor(maxStep / minBet));
  return Math.min(chips, minBet * (1 + Math.floor(Math.random() * steps)));
};

export const getHandOrder = (targetPlayers: BlackjackPlayer[]) => {
  const order: TurnRef[] = [];
  targetPlayers.forEach((p, pIdx) => {
    p.hands.forEach((_, hIdx) => {
      order.push({ playerIndex: pIdx, handIndex: hIdx });
    });
  });
  return order;
};

export const findNextPlayable = (targetPlayers: BlackjackPlayer[], from?: TurnRef | null) => {
  const order = getHandOrder(targetPlayers);
  if (order.length === 0) return null;
  const startIdx = from
    ? order.findIndex(o => o.playerIndex === from.playerIndex && o.handIndex === from.handIndex)
    : -1;
  for (let i = startIdx + 1; i < order.length; i += 1) {
    const { playerIndex: pIdx, handIndex: hIdx } = order[i];
    const hand = targetPlayers[pIdx]?.hands[hIdx];
    if (hand && hand.status === 'PLAYING') return order[i];
  }
  return null;
};

export const updateQuotes = (updatedPlayers: BlackjackPlayer[], npcProfiles: NPCProfile[]) =>
  updatedPlayers.map(p => {
    if (!p.isAI) return p;
    const profile = npcProfiles.find(npc => npc.name === p.name);
    const quote = pickQuote(profile, p.overallResult);
    return { ...p, quote };
  });
