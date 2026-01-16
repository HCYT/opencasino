import { NPCProfile } from '../../types';
import { StoredProfile } from '../profileStore';

interface LobbyEntryParams {
  playerName: string;
  profiles: Record<string, StoredProfile>;
  initialChips: number;
  minBet: number;
  bigTwoBaseBet: number;
  gateAnteBet: number;
  gameType: 'SHOWDOWN' | 'BLACKJACK' | 'BIG_TWO' | 'GATE' | 'SLOTS';
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
  gateAnteBet,
  gameType,
  npcProfiles
}: LobbyEntryParams): LobbyEntryResult => {
  const playerChips = profiles[playerName]?.chips ?? initialChips;

  // Determine minimum entry requirement based on game type
  let minEntry = minBet;
  if (gameType === 'BIG_TWO') {
    minEntry = bigTwoBaseBet;
  } else if (gameType === 'GATE') {
    minEntry = gateAnteBet;
  } else if (gameType === 'SLOTS') {
    minEntry = 10; // Minimum slot bet
  }

  if (playerChips < minEntry) {
    return { playerChips, minEntry, error: '餘額不足，請先貸款或重設資料' };
  }

  // Slots don't need NPCs
  if (gameType === 'SLOTS') {
    return { playerChips, minEntry };
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
