import React from 'react';
import { GameButton } from '@/components/ui/GameButton';

interface ProfileListProps {
  leaderboard: Array<{
    name: string;
    chips: number;
    wins: number;
    losses: number;
    games: number;
    debt: number;
  }>;
  playerName: string;
  setPlayerName: (name: string) => void;
  npcNames: Set<string>;
  handleDeleteProfile: (name: string) => void;
  handleCreateProfile: () => void;
  handleResetNpcProfiles: () => void;
  handleResetAllProfiles: () => void;
}

const ProfileList: React.FC<ProfileListProps> = ({
  leaderboard,
  playerName,
  setPlayerName,
  npcNames,
  handleDeleteProfile,
  handleCreateProfile,
  handleResetNpcProfiles,
  handleResetAllProfiles
}) => {
  const playerProfiles = leaderboard.filter(p => !npcNames.has(p.name));
  const npcProfiles = leaderboard.filter(p => npcNames.has(p.name));

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
      <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-5 tracking-widest">
        角色列表
      </label>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 mb-5 custom-scrollbar">
        {playerProfiles.length === 0 && npcProfiles.length === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm font-medium">
            尚無角色，請建立新角色
          </div>
        )}
        
        {playerProfiles.length > 0 && (
          <div className="mb-4">
            <div className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">
              我的角色
            </div>
            {playerProfiles.map(profile => (
              <div
                key={profile.name}
                className="flex items-center justify-between bg-emerald-900/20 border border-emerald-700/30 rounded-2xl px-4 py-3 hover:bg-emerald-900/30 transition-all mb-2"
              >
                <GameButton
                  onClick={() => setPlayerName(profile.name)}
                  variant="ghost"
                  size="pillSm"
                  className={`text-base font-black ${
                    playerName === profile.name 
                      ? 'text-emerald-300 bg-emerald-500/10 border-2 border-emerald-400/50' 
                      : 'text-slate-300 hover:text-white hover:bg-emerald-900/20'
                  }`}
                >
                  {profile.name}
                </GameButton>
                
                <div className="flex items-center gap-3">
                  <div className="text-base font-black text-emerald-300">
                    ${profile.chips.toLocaleString()}
                  </div>
                  {playerName === profile.name ? (
                    <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 rounded-lg px-3 py-1.5 uppercase tracking-wider">
                      使用中
                    </span>
                  ) : (
                    <GameButton
                      onClick={() => handleDeleteProfile(profile.name)}
                      variant="danger"
                      size="pillSm"
                      className="text-[10px] font-black border-2 border-red-500/50"
                    >
                      刪除
                    </GameButton>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {npcProfiles.length > 0 && (
          <div>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
              NPC 對手
            </div>
            {npcProfiles.map(profile => (
              <div
                key={profile.name}
                className="flex items-center justify-between bg-slate-900/30 border border-slate-700/30 rounded-2xl px-4 py-3 mb-2"
              >
                <span className="text-base font-black text-slate-500">
                  {profile.name}
                </span>
                <div className="flex items-center gap-3">
                  <div className="text-sm font-black text-slate-600">
                    ${profile.chips.toLocaleString()}
                  </div>
                  <span className="text-[10px] font-black bg-slate-700/30 text-slate-500 rounded-lg px-2 py-1 uppercase tracking-wider">
                    NPC
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-slate-700/30 pt-5">
        <GameButton
          onClick={handleCreateProfile}
          variant="muted"
          size="pill"
          className="w-full text-sm font-black text-slate-300 border-2 border-slate-700/50 hover:border-slate-600/50 hover:text-slate-200"
        >
          建立角色
        </GameButton>
        <GameButton
          onClick={handleResetNpcProfiles}
          variant="danger"
          size="pillSm"
          className="w-full text-[11px] font-black border-2 border-red-500/50"
        >
          重設 NPC 資產
        </GameButton>
        <GameButton
          onClick={handleResetAllProfiles}
          variant="warning"
          size="pillSm"
          className="w-full text-[11px] font-black border-2 border-amber-500/50"
        >
          全部重設
        </GameButton>
      </div>
    </div>
  );
};

export default ProfileList;
