import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { GamePhase, Player } from '../../types';
import { loadProfiles, saveProfiles, StoredProfile } from '../profileStore';

interface UseShowdownProfileSyncParams {
  phase: GamePhase;
  winners: string[];
  players: Player[];
  setProfiles: Dispatch<SetStateAction<Record<string, StoredProfile>>>;
}

export const useShowdownProfileSync = ({
  phase,
  winners,
  players,
  setProfiles
}: UseShowdownProfileSyncParams) => {
  const lastResultKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (phase !== GamePhase.RESULT || winners.length === 0) return;

    const signature = `${winners.join(',')}|${players.map(p => `${p.id}:${p.chips}:${p.debt ?? 0}`).join(',')}`;
    if (lastResultKeyRef.current === signature) return;
    lastResultKeyRef.current = signature;

    const profiles = loadProfiles();
    const updated: Record<string, StoredProfile> = { ...profiles };

    players.forEach(p => {
      const prev = profiles[p.name];
      const won = winners.includes(p.id);
      updated[p.name] = {
        name: p.name,
        chips: p.chips,
        wins: (prev?.wins ?? 0) + (won ? 1 : 0),
        losses: (prev?.losses ?? 0) + (won ? 0 : 1),
        games: (prev?.games ?? 0) + 1,
        debt: p.debt ?? prev?.debt ?? 0
      };
    });

    saveProfiles(updated);
    setProfiles(updated);
  }, [phase, winners, players, setProfiles]);
};
