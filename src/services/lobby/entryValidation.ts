import { NPCProfile } from '../../types';
import { StoredProfile } from '../profileStore';

interface LobbyEntryParams {
  playerName: string;
  profiles: Record<string, StoredProfile>;
  initialChips: number;
  minBet: number;
  bigTwoBaseBet: number;
  gameType: 'SHOWDOWN' | 'BLACKJACK' | 'BIG_TWO';
  npcProfiles: NPCProfile[];
}

interface LobbyEntryResult {
  playerChips: number;
  minEntry: number;
  error?: string;
}

export const validateLobbyEntry = ({
  playerName,
  profiles,
  initialChips,
  minBet,
  bigTwoBaseBet,
  gameType,
  npcProfiles
}: LobbyEntryParams): LobbyEntryResult => {
  const playerChips = profiles[playerName]?.chips ?? initialChips;
  const minEntry = gameType === 'BIG_TWO' ? bigTwoBaseBet : minBet;
  if (playerChips < minEntry) {
    return { playerChips, minEntry, error: '餘額不足，請先貸款或重設資料' };
  }

  const eligibleNPCs = npcProfiles.filter(profile => {
    const chips = profiles[profile.name]?.chips ?? initialChips;
    return chips >= minEntry;
  });
  if (eligibleNPCs.length < 3) {
    return { playerChips, minEntry, error: '可用 NPC 不足，請重設資料' };
  }

  return { playerChips, minEntry };
};
