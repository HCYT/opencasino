import { NPCProfile, Player } from '../../types';
import { StoredProfile } from '../profileStore';
import { BlackjackSeat } from '../blackjack/types';
import { BigTwoSeat } from '../bigTwo/types';
import { GateSeat } from '../showdownGate/types';
import { BaccaratSeat } from '../baccarat/types';
import { SicBoSeat } from '../sicBo/types';

interface SeatBuilderParams {
  playerName: string;
  playerChips: number;
  playerAvatar: string;
  initialChips: number;
  profiles: Record<string, StoredProfile>;
  aiProfiles: NPCProfile[];
}

const upsertProfilesFromSeats = <T extends { name: string; chips: number }>(
  profiles: Record<string, StoredProfile>,
  seats: T[]
) => {
  const updated = { ...profiles };
  seats.forEach(seat => {
    if (!updated[seat.name]) {
      updated[seat.name] = {
        name: seat.name,
        chips: seat.chips,
        wins: 0,
        losses: 0,
        games: 0,
        debt: 0
      };
    } else {
      updated[seat.name] = {
        ...updated[seat.name],
        chips: seat.chips
      };
    }
  });
  return updated;
};

export const buildBlackjackSeats = ({
  playerName,
  playerChips,
  playerAvatar,
  initialChips,
  profiles,
  aiProfiles
}: SeatBuilderParams) => {
  const [ai1, ai2, ai3] = aiProfiles;
  const seats: BlackjackSeat[] = [
    { id: 'player', name: playerName, chips: playerChips, avatar: playerAvatar, isAI: false },
    { id: 'ai1', name: ai1.name, chips: profiles[ai1.name]?.chips ?? initialChips, avatar: ai1.avatar, isAI: true },
    { id: 'ai2', name: ai2.name, chips: profiles[ai2.name]?.chips ?? initialChips, avatar: ai2.avatar, isAI: true },
    { id: 'ai3', name: ai3.name, chips: profiles[ai3.name]?.chips ?? initialChips, avatar: ai3.avatar, isAI: true }
  ];
  return {
    seats,
    updatedProfiles: upsertProfilesFromSeats(profiles, seats)
  };
};

export const buildBigTwoSeats = ({
  playerName,
  playerChips,
  playerAvatar,
  initialChips,
  profiles,
  aiProfiles
}: SeatBuilderParams) => {
  const [ai1, ai2, ai3] = aiProfiles;
  const seats: BigTwoSeat[] = [
    { id: 'player', name: playerName, chips: playerChips, avatar: playerAvatar, isAI: false },
    { id: 'ai1', name: ai1.name, chips: profiles[ai1.name]?.chips ?? initialChips, avatar: ai1.avatar, isAI: true },
    { id: 'ai2', name: ai2.name, chips: profiles[ai2.name]?.chips ?? initialChips, avatar: ai2.avatar, isAI: true },
    { id: 'ai3', name: ai3.name, chips: profiles[ai3.name]?.chips ?? initialChips, avatar: ai3.avatar, isAI: true }
  ];
  return {
    seats,
    updatedProfiles: upsertProfilesFromSeats(profiles, seats)
  };
};

interface ShowdownBuilderParams {
  playerName: string;
  playerAvatar: string;
  initialChips: number;
  profiles: Record<string, StoredProfile>;
  aiProfiles: NPCProfile[];
}

export const buildShowdownPlayers = ({
  playerName,
  playerAvatar,
  initialChips,
  profiles,
  aiProfiles
}: ShowdownBuilderParams) => {
  const withStats = (base: Player, minChips: number = 0): Player => {
    const stored = profiles[base.name];
    const storedChips = stored?.chips ?? base.chips;
    const resolvedChips = minChips > 0 ? Math.max(storedChips, minChips) : storedChips;
    return {
      ...base,
      chips: resolvedChips,
      wins: stored?.wins ?? 0,
      losses: stored?.losses ?? 0,
      games: stored?.games ?? 0,
      debt: stored?.debt ?? 0
    };
  };

  const [ai1, ai2, ai3] = aiProfiles;
  return [
    withStats({ id: 'player', name: playerName, chips: initialChips, currentBet: 0, cards: [], isFolded: false, isAI: false, avatar: playerAvatar }, 0),
    withStats({ id: 'ai1', name: ai1.name, chips: initialChips, currentBet: 0, cards: [], isFolded: false, isAI: true, avatar: ai1.avatar, lastAction: '', teamId: 'AI_TEAM' }, 0),
    withStats({ id: 'ai2', name: ai2.name, chips: initialChips, currentBet: 0, cards: [], isFolded: false, isAI: true, avatar: ai2.avatar, lastAction: '', teamId: 'AI_TEAM' }, 0),
    withStats({ id: 'ai3', name: ai3.name, chips: initialChips, currentBet: 0, cards: [], isFolded: false, isAI: true, avatar: ai3.avatar, lastAction: '', teamId: 'AI_TEAM' }, 0)
  ];
};

export const buildGateSeats = ({
  playerName,
  playerChips,
  playerAvatar,
  initialChips,
  profiles,
  aiProfiles
}: SeatBuilderParams) => {
  // 過濾掉沒有籌碼的 NPC（至少需要底注金額）
  const minChipsRequired = 100; // MIN_BET for ante
  const validAiProfiles = aiProfiles.filter(ai => {
    const chips = profiles[ai.name]?.chips ?? initialChips;
    return chips >= minChipsRequired;
  });

  const seats: GateSeat[] = [
    { id: 'player', name: playerName, chips: playerChips, avatar: playerAvatar, isAI: false },
    ...validAiProfiles.slice(0, 3).map((ai, index) => ({
      id: `ai${index + 1}` as const,
      name: ai.name,
      chips: profiles[ai.name]?.chips ?? initialChips,
      avatar: ai.avatar,
      isAI: true as const
    }))
  ];
  return {
    seats,
    updatedProfiles: upsertProfilesFromSeats(profiles, seats)
  };
};

export const buildBaccaratSeats = ({
  playerName,
  playerChips,
  playerAvatar,
  initialChips,
  profiles,
  aiProfiles
}: SeatBuilderParams) => {
  // 百家樂只需要玩家自己，AI 作為旁觀者
  const [ai1, ai2, ai3] = aiProfiles;
  const seats: BaccaratSeat[] = [
    { id: 'player', name: playerName, chips: playerChips, avatar: playerAvatar, isAI: false },
    { id: 'ai1', name: ai1.name, chips: profiles[ai1.name]?.chips ?? initialChips, avatar: ai1.avatar, isAI: true },
    { id: 'ai2', name: ai2.name, chips: profiles[ai2.name]?.chips ?? initialChips, avatar: ai2.avatar, isAI: true },
    { id: 'ai3', name: ai3.name, chips: profiles[ai3.name]?.chips ?? initialChips, avatar: ai3.avatar, isAI: true }
  ];
  return {
    seats,
    updatedProfiles: upsertProfilesFromSeats(profiles, seats)
  };
};

export const buildSicBoSeats = ({
  playerName,
  playerChips,
  playerAvatar,
  initialChips,
  profiles,
  aiProfiles
}: SeatBuilderParams) => {
  const [ai1, ai2, ai3] = aiProfiles;
  const seats: SicBoSeat[] = [
    { id: 'player', name: playerName, chips: playerChips, avatar: playerAvatar, isAI: false },
    { id: 'ai1', name: ai1.name, chips: profiles[ai1.name]?.chips ?? initialChips, avatar: ai1.avatar, isAI: true },
    { id: 'ai2', name: ai2.name, chips: profiles[ai2.name]?.chips ?? initialChips, avatar: ai2.avatar, isAI: true },
    { id: 'ai3', name: ai3.name, chips: profiles[ai3.name]?.chips ?? initialChips, avatar: ai3.avatar, isAI: true }
  ];
  return {
    seats,
    updatedProfiles: upsertProfilesFromSeats(profiles, seats)
  };
};
