import { RoundStat } from './types';

const BIG_TWO_STATS_KEY = 'opencasino_big_two_stats';

export const loadRoundStats = (): RoundStat[] => {
  try {
    const raw = localStorage.getItem(BIG_TWO_STATS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as RoundStat[];
  } catch {
    return [];
  }
};

export const saveRoundStats = (stats: RoundStat[]) => {
  localStorage.setItem(BIG_TWO_STATS_KEY, JSON.stringify(stats));
};
