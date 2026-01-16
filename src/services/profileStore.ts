export type StoredProfile = {
  name: string;
  chips: number;
  wins: number;
  losses: number;
  games: number;
  debt: number;
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
