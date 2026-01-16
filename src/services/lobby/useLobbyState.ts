import { useEffect, useMemo, useState } from 'react';
import { INITIAL_CHIPS_OPTIONS, LOAN_AMOUNT } from '../../constants';
import { loadProfiles, saveProfiles, StoredProfile } from '../profileStore';
import { NPCProfile } from '../../types';

interface UseLobbyStateOptions {
  npcProfiles: NPCProfile[];
}

export const useLobbyState = ({ npcProfiles }: UseLobbyStateOptions) => {
  const [initialChips, setInitialChips] = useState(INITIAL_CHIPS_OPTIONS[0]);
  const [profiles, setProfiles] = useState<Record<string, StoredProfile>>(() => loadProfiles());

  // Auto-select first available non-NPC profile
  const [playerName, setPlayerName] = useState(() => {
    const npcNames = new Set(npcProfiles.map(p => p.name));
    const loaded = loadProfiles();
    const existing = Object.keys(loaded).filter(n => !npcNames.has(n));
    return existing.length > 0 ? existing[0] : '我 (玩家)';
  });

  const [repayAmount, setRepayAmount] = useState(0);

  const activeProfile = profiles[playerName];
  const isExistingProfile = Boolean(activeProfile);
  const displayedChips = activeProfile?.chips ?? initialChips;
  const displayedDebt = activeProfile?.debt ?? 0;

  const npcNames = useMemo(() => new Set(npcProfiles.map(profile => profile.name)), [npcProfiles]);
  const isNpcSelected = npcNames.has(playerName);

  const leaderboard = useMemo(() => Object.keys(profiles)
    .map(key => profiles[key])
    .filter((profile): profile is StoredProfile => Boolean(profile))
    .sort((a, b) => {
      if (b.chips !== a.chips) return b.chips - a.chips;
      return b.wins - a.wins;
    }), [profiles]);

  useEffect(() => {
    if (activeProfile?.chips !== undefined) {
      setInitialChips(activeProfile.chips);
    }
  }, [activeProfile?.chips]);

  const getProfile = (name: string) => profiles[name];

  const resolveChips = (name: string) => {
    const stored = profiles[name];
    return stored?.chips ?? initialChips;
  };

  const handleLoan = () => {
    const current = profiles[playerName] || {
      name: playerName,
      chips: initialChips,
      wins: 0,
      losses: 0,
      games: 0,
      debt: 0
    };
    const updated = {
      ...profiles,
      [playerName]: {
        ...current,
        chips: current.chips + LOAN_AMOUNT,
        debt: current.debt + LOAN_AMOUNT
      }
    };
    saveProfiles(updated);
    setProfiles(updated);
  };

  const handleRepay = () => {
    const current = profiles[playerName];
    if (!current || current.debt <= 0 || repayAmount <= 0) return;
    const repay = Math.min(repayAmount, current.debt, current.chips);
    if (repay <= 0) return;

    const updated = {
      ...profiles,
      [playerName]: {
        ...current,
        chips: current.chips - repay,
        debt: current.debt - repay
      }
    };
    saveProfiles(updated);
    setProfiles(updated);
    setRepayAmount(0);
  };

  const handleCreateProfile = (nameOverride?: string) => {
    const targetName = nameOverride ?? playerName;
    if (!targetName.trim()) return;
    if (profiles[targetName]) return;
    const updated = {
      ...profiles,
      [targetName]: {
        name: targetName,
        chips: nameOverride ? INITIAL_CHIPS_OPTIONS[0] : initialChips, // Reset chips for new profile
        wins: 0,
        losses: 0,
        games: 0,
        debt: 0
      }
    };
    saveProfiles(updated);
    setProfiles(updated);
    if (nameOverride) {
      setPlayerName(targetName);
      setInitialChips(INITIAL_CHIPS_OPTIONS[0]);
    }
  };

  const handleDeleteProfile = (name: string) => {
    if (!profiles[name]) return;
    const { [name]: removed, ...rest } = profiles;
    void removed;
    saveProfiles(rest);
    setProfiles(rest);
    if (playerName === name) {
      setPlayerName('');
      setInitialChips(INITIAL_CHIPS_OPTIONS[0]);
    }
  };

  const handleResetNpcProfiles = () => {
    if (!window.confirm('確定要重設所有 NPC 資產嗎？')) return;
    const updated = { ...profiles };
    npcNames.forEach(name => {
      updated[name] = {
        name,
        chips: INITIAL_CHIPS_OPTIONS[0],
        wins: 0,
        losses: 0,
        games: 0,
        debt: 0
      };
    });
    saveProfiles(updated);
    setProfiles(updated);
  };

  const handleResetAllProfiles = () => {
    if (!window.confirm('確定要重設所有角色資料（含玩家與 NPC）嗎？')) return;
    saveProfiles({});
    setProfiles({});
    setPlayerName('');
    setInitialChips(INITIAL_CHIPS_OPTIONS[0]);
  };

  return {
    initialChips,
    setInitialChips,
    playerName,
    setPlayerName,
    profiles,
    setProfiles,
    repayAmount,
    setRepayAmount,
    activeProfile,
    isExistingProfile,
    displayedChips,
    displayedDebt,
    npcNames,
    isNpcSelected,
    leaderboard,
    getProfile,
    resolveChips,
    handleLoan,
    handleRepay,
    handleCreateProfile,
    handleDeleteProfile,
    handleResetNpcProfiles,
    handleResetAllProfiles,
    handleRenameProfile: (oldName: string, newName: string) => {
      const trimmedNew = newName.trim();
      if (!trimmedNew || trimmedNew === oldName) return;
      if (profiles[trimmedNew] || npcNames.has(trimmedNew)) {
        alert('名稱已存在或為 NPC 名稱');
        return;
      }

      const { [oldName]: oldProfile, ...rest } = profiles;
      if (!oldProfile) return;

      const updated = {
        ...rest,
        [trimmedNew]: { ...oldProfile, name: trimmedNew }
      };

      saveProfiles(updated);
      setProfiles(updated);

      if (playerName === oldName) {
        setPlayerName(trimmedNew);
      }
    },
    handleUpdateAvatar: (name: string, avatarBase64: string) => {
      const current = profiles[name];
      if (!current) return;

      const updated = {
        ...profiles,
        [name]: { ...current, avatar: avatarBase64 }
      };
      saveProfiles(updated);
      setProfiles(updated);
    }
  };
};
