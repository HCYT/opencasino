export type StoredProfile = {
  name: string;
  chips: number;
  wins: number;
  losses: number;
  games: number;
  debt: number;
  avatar?: string;
};

const STORAGE_KEY = 'cosglint_profiles';

export const loadProfiles = (): Record<string, StoredProfile> => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredProfile>;
  } catch {
    return {};
  }
};

export const saveProfiles = (profiles: Record<string, StoredProfile>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
};

const JACKPOT_KEY = 'opencasino_jackpot';
const DEFAULT_JACKPOT = 10000;

export const loadJackpot = (): number => {
  try {
    const raw = localStorage.getItem(JACKPOT_KEY);
    return raw ? parseInt(raw, 10) : DEFAULT_JACKPOT;
  } catch {
    return DEFAULT_JACKPOT;
  }
};

export const saveJackpot = (amount: number) => {
  localStorage.setItem(JACKPOT_KEY, amount.toString());
};
