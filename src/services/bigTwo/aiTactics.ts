import { AITactic } from '../../types';

export const AI_TACTICS: AITactic[] = ['BAIT', 'CONSERVATIVE', 'DECEPTIVE', 'AGGRESSIVE'];

export const pickAiTactic = (weights?: Partial<Record<AITactic, number>>): AITactic => {
  if (!weights) return AI_TACTICS[Math.floor(Math.random() * AI_TACTICS.length)];
  const entries = AI_TACTICS.map(tactic => ({ tactic, weight: Math.max(0, weights[tactic] ?? 0) }));
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) return AI_TACTICS[Math.floor(Math.random() * AI_TACTICS.length)];
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll <= 0) return entry.tactic;
  }
  return AI_TACTICS[0];
};
