import React, { useState, useRef } from 'react';
import { GameButton } from '@/components/ui/GameButton';
import { compressImage } from '@/utils/imageUtils';

interface ProfileListProps {
  leaderboard: Array<{
    name: string;
    chips: number;
    wins: number;
    losses: number;
    games: number;
    debt: number;
    avatar?: string;
  }>;
  playerName: string;
  setPlayerName: (name: string) => void;
  npcNames: Set<string>;
  handleDeleteProfile: (name: string) => void;
  handleCreateProfile: () => void;
  handleResetNpcProfiles: () => void;
  handleResetAllProfiles: () => void;
  handleRenameProfile: (oldName: string, newName: string) => void;
  handleUpdateAvatar: (name: string, avatar: string) => void;
  onOpenCreateModal: () => void;
}

const ProfileList: React.FC<ProfileListProps> = ({
  leaderboard,
  playerName,
  setPlayerName,
  npcNames,
  handleDeleteProfile,
  handleCreateProfile, // Keeping it for now but we will use modal trigger
  handleResetNpcProfiles,
  handleResetAllProfiles,
  handleRenameProfile,
  handleUpdateAvatar,
  onOpenCreateModal
}) => {
  const [editingName, setEditingName] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const playerProfiles = leaderboard.filter(p => !npcNames.has(p.name));

  const startEditing = (name: string) => {
    setEditingName(name);
    setTempName(name);
  };

  const cancelEditing = () => {
    setEditingName(null);
    setTempName('');
  };

  const confirmEditing = () => {
    if (editingName && tempName.trim()) {
      handleRenameProfile(editingName, tempName.trim());
      setEditingName(null);
    }
  };

  const handleAvatarClick = (name: string) => {
    if (uploadingFor) return; // Prevent double clicks
    setUploadingFor(name);
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingFor) {
      try {
        const base64 = await compressImage(file);
        handleUpdateAvatar(uploadingFor, base64);
      } catch (err) {
        console.error('Image upload failed', err);
        alert('圖片處理失敗，請試著用小一點的圖片');
      }
    }
    setUploadingFor(null);
  };

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
      <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-5 tracking-widest">
        角色列表
      </label>

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 mb-5 custom-scrollbar">
        {playerProfiles.length === 0 && (
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
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Avatar Circle */}
                  <button
                    onClick={() => handleAvatarClick(profile.name)}
                    className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500/30 hover:border-emerald-400 hover:shadow-[0_0_10px_rgba(52,211,153,0.3)] transition-all flex-shrink-0 group"
                    title="更換頭貼"
                  >
                    {profile.avatar ? (
                      <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-emerald-800 flex items-center justify-center text-emerald-200 font-bold text-sm">
                        {profile.name.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[8px] text-white font-bold uppercase">Upload</span>
                    </div>
                  </button>

                  {editingName === profile.name ? (
                    <div className="flex items-center gap-2 flex-1 mr-2">
                      <input
                        type="text"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmEditing();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="w-full bg-black/40 border border-emerald-500/50 rounded-lg px-2 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"
                        autoFocus
                      />
                      <button onClick={confirmEditing} className="text-emerald-400 hover:text-emerald-300 text-xs">✔️</button>
                      <button onClick={cancelEditing} className="text-slate-500 hover:text-slate-300 text-xs">❌</button>
                    </div>
                  ) : (
                    <GameButton
                      onClick={() => setPlayerName(profile.name)}
                      variant="ghost"
                      size="pillSm"
                      className={`text-base font-black truncate text-left max-w-[120px] ${playerName === profile.name
                        ? 'text-emerald-300'
                        : 'text-slate-300 hover:text-white'
                        }`}
                    >
                      {profile.name}
                    </GameButton>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-base font-black text-emerald-300 min-w-[60px] text-right">
                    ${profile.chips.toLocaleString()}
                  </div>

                  {editingName !== profile.name && (
                    <>
                      <button
                        onClick={() => startEditing(profile.name)}
                        className="p-1.5 text-slate-500 hover:text-amber-400 transition-colors"
                        title="改名"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                      </button>

                      {playerName === profile.name ? (
                        <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-200 border border-emerald-400/50 rounded-lg px-2 py-1 uppercase tracking-wider">
                          使用中
                        </span>
                      ) : (
                        <GameButton
                          onClick={() => handleDeleteProfile(profile.name)}
                          variant="danger"
                          size="pillSm"
                          className="text-[10px] py-1 px-2 font-black border border-red-500/30"
                        >
                          刪除
                        </GameButton>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-slate-700/30 pt-5">
        <GameButton
          onClick={onOpenCreateModal}
          variant="muted"
          size="pill"
          className="w-full text-sm font-black text-slate-300 border-2 border-slate-700/50 hover:border-slate-600/50 hover:text-slate-200"
        >
          建立角色
        </GameButton>
        <div className="flex gap-2">
          <GameButton
            onClick={handleResetNpcProfiles}
            variant="danger"
            size="pillSm"
            className="flex-1 text-[10px] font-black border border-red-500/30"
          >
            重設 NPC
          </GameButton>
          <GameButton
            onClick={handleResetAllProfiles}
            variant="warning"
            size="pillSm"
            className="flex-1 text-[10px] font-black border border-amber-500/30"
          >
            全部重設
          </GameButton>
        </div>
      </div>
    </div>
  );
};

export default ProfileList;
