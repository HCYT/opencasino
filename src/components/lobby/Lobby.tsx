import React, { useState } from 'react';
import { MIN_BET } from '@/constants';
import { NPC_PROFILES } from '@/config/npcProfiles';
import { useLobbyState } from '@/services/lobby/useLobbyState';
import { validateLobbyEntry } from '@/services/lobby/entryValidation';
import {
  GameType,
  BetMode,
  BlackjackCutPresetKey,
  BIG_TWO_BASE_BETS
} from '@/config/gameConfig';

import CreateProfileModal from './CreateProfileModal';
import LobbyHeader from './LobbyHeader';
import GameSelector from './GameSelector';
import NPCProfiles from './NPCProfiles';
import LobbyRightPanel from './LobbyRightPanel';
import { GameButton } from '@/components/ui/GameButton';
import VolumeControl from '@/components/ui/VolumeControl';

interface LobbyProps {
  onGameStart: (
    gameType: GameType,
    playerName: string,
    playerChips: number,
    initialChips: number,
    profiles: Record<string, any>,
    betMode: BetMode,
    teamingEnabled: boolean
  ) => void;
}

const Lobby: React.FC<LobbyProps> = ({ onGameStart }) => {
  const {
    initialChips,
    setInitialChips,
    playerName,
    setPlayerName,
    profiles,
    repayAmount,
    setRepayAmount,
    isExistingProfile,
    displayedChips,
    displayedDebt,
    npcNames,
    isNpcSelected,
    leaderboard,
    resolveChips,
    handleLoan,
    handleRepay,
    handleCreateProfile,
    handleDeleteProfile,
    handleResetNpcProfiles,
    handleResetAllProfiles,
    handleRenameProfile,
    handleUpdateAvatar
  } = useLobbyState({ npcProfiles: NPC_PROFILES });

  const [gameType, setGameType] = useState<GameType>('SHOWDOWN');
  const [betMode, setBetMode] = useState<BetMode>('FIXED_LIMIT');
  const [teamingEnabled, setTeamingEnabled] = useState(false);
  const [blackjackDecks, setBlackjackDecks] = useState(6);
  const [blackjackCutPreset, setBlackjackCutPreset] = useState<BlackjackCutPresetKey>('STANDARD');
  const [bigTwoBaseBet, setBigTwoBaseBet] = useState(BIG_TWO_BASE_BETS[0]);
  const [startError, setStartError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleStartGame = () => {
    setStartError(null);
    if (!playerName) {
      setStartError('請先選擇或建立角色');
      return;
    }
    if (npcNames.has(playerName)) return;

    const { playerChips, error } = validateLobbyEntry({
      playerName,
      profiles,
      initialChips,
      minBet: MIN_BET,
      bigTwoBaseBet,
      gameType,
      npcProfiles: NPC_PROFILES
    });

    if (error) {
      setStartError(error);
      return;
    }

    onGameStart(
      gameType,
      playerName,
      playerChips,
      initialChips,
      profiles,
      betMode,
      teamingEnabled
    );
  };

  const onCreateProfile = (name: string) => {
    setPlayerName(name);
    // handleCreateProfile logic is slightly different in useLobbyState, 
    // it uses current "playerName" state. 
    // We should probably just set the name here and let handleCreateProfile work?
    // Actually handleCreateProfile checks if playerName is empty.
    // Let's manually trigger it with the new name.
    // Wait, handleCreateProfile in useLobbyState relies on `playerName` state.
    // We need to set state then call it? React batching might be an issue.
    // Ideally useLobbyState should accept a name arg for create.
    // For now, let's assume setting playerName is enough if we modify handleCreateProfile to wait or pass arg.
    // OR we can just manually create it here since we have setProfiles exposed.. 
    // BUT useLobbyState encapsulates logic.
    // Let's modify useLobbyState to accept name optional arg.

    // HACK: For now, I'll update the state and call create in a tailored way.
    // Actually, I should update useLobbyState first.
  };

  return (
    <>
      <div className="fixed inset-0 -z-10">
        <img
          src="/image/bg.png"
          alt="Casino Background"
          className="w-full h-full object-cover brightness-[0.6]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40" />
      </div>

      <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
        <VolumeControl />
      </div>

      {showCreateModal && (
        <CreateProfileModal
          onClose={() => setShowCreateModal(false)}
          existingNames={new Set([...Object.keys(profiles), ...npcNames])}
          onCreate={handleCreateProfile}
        />
      )}

      <div className="w-full min-h-screen flex flex-col items-center py-8 overflow-y-auto">
        <LobbyHeader />

        <div className="w-full max-w-7xl px-4 py-8 space-y-12">

          <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-8 items-start">
            {/* Left Panel: Game Selection */}
            <div className="space-y-8 bg-black/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/10 shadow-2xl">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-4">
                  <div className="w-1 h-8 bg-amber-500 rounded-full" />
                  <h2 className="text-2xl font-black text-white/90 tracking-widest uppercase">進入賭廳</h2>
                </div>
                {/* Current Player Display */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="p-2 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 hover:border-amber-400/50 transition-all text-slate-400 hover:text-amber-400"
                    title="建立新角色"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                  </button>
                  <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-4 py-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Current Player</span>
                    <span className="text-amber-400 font-black text-lg">
                      {playerName || '未選擇'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PlayerInput Removed */}

              <div className="h-px bg-white/10 my-6" />

              <GameSelector
                gameType={gameType}
                setGameType={setGameType}
                betMode={betMode}
                setBetMode={setBetMode}
                teamingEnabled={teamingEnabled}
                setTeamingEnabled={setTeamingEnabled}
                blackjackDecks={blackjackDecks}
                setBlackjackDecks={setBlackjackDecks}
                blackjackCutPreset={blackjackCutPreset}
                setBlackjackCutPreset={setBlackjackCutPreset}
                bigTwoBaseBet={bigTwoBaseBet}
                setBigTwoBaseBet={setBigTwoBaseBet}
                initialChips={initialChips}
                setInitialChips={setInitialChips}
                isExistingProfile={isExistingProfile}
                displayedChips={displayedChips}
              />

              {(isNpcSelected || startError) && (
                <div className="text-center py-4 px-6 bg-red-500/10 border border-red-500/30 rounded-xl animate-pulse">
                  <div className="text-red-300 font-bold text-base tracking-wide">
                    {isNpcSelected ? '⚠️ 不能使用 NPC 名稱進場' : startError}
                  </div>
                </div>
              )}

              <GameButton
                onClick={handleStartGame}
                disabled={isNpcSelected}
                variant="primary"
                size="pillLg"
                className={`w-full text-2xl py-6 shadow-[0_0_30px_rgba(234,179,8,0.4)] ${isNpcSelected ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {gameType === 'BLACKJACK' ? '開始 21 點' :
                  gameType === 'BIG_TWO' ? '開始大老二' :
                    gameType === 'SLOTS' ? '進入賭場' : '踏入牌局'}
              </GameButton>
            </div>

            {/* Right Panel: Player Status & Leaderboard */}
            <LobbyRightPanel
              displayedChips={displayedChips}
              displayedDebt={displayedDebt}
              repayAmount={repayAmount}
              leaderboard={leaderboard}
              playerName={playerName}
              npcNames={npcNames}
              setRepayAmount={setRepayAmount}
              setPlayerName={setPlayerName}
              handleLoan={handleLoan}
              handleRepay={handleRepay}
              resolveChips={resolveChips}
              handleDeleteProfile={handleDeleteProfile}
              handleCreateProfile={handleCreateProfile}
              handleResetNpcProfiles={handleResetNpcProfiles}
              handleResetAllProfiles={handleResetAllProfiles}
              handleRenameProfile={handleRenameProfile}
              handleUpdateAvatar={handleUpdateAvatar}
              onOpenCreateModal={() => setShowCreateModal(true)}
            />
          </div>

          <div className="pt-12">
            <NPCProfiles />
          </div>

          {leaderboard.length > 0 && (
            <div className="pt-12">
              <div className="text-center relative mb-8">
                <span className="text-amber-500 font-black text-2xl uppercase tracking-[0.5em] relative z-10 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
                  戰績排行榜
                </span>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-amber-500/20 blur-sm rounded-full" />
              </div>

              <div className="grid gap-3 max-w-4xl mx-auto relative z-10">
                {leaderboard.map((profile, index) => (
                  <div
                    key={profile.name}
                    className="group flex items-center justify-between bg-gradient-to-r from-black/60 to-black/40 border border-white/5 backdrop-blur-md rounded-2xl px-6 py-5 hover:border-amber-500/50 hover:bg-black/60 transition-all duration-300 shadow-lg"
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-xl shadow-lg transform group-hover:scale-110 transition-transform ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-amber-600 text-black ring-2 ring-yellow-500/50' :
                        index === 1 ? 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800 ring-2 ring-slate-400/50' :
                          index === 2 ? 'bg-gradient-to-br from-orange-400 to-amber-800 text-white ring-2 ring-orange-500/50' :
                            'bg-white/5 text-white/30'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="flex flex-col">
                        <div className="font-black text-lg text-white group-hover:text-amber-400 transition-colors">{profile.name}</div>
                        <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">Player Rank</div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-xl font-black text-emerald-400 tabular-nums tracking-wide group-hover:scale-105 transition-transform origin-right">
                        ${profile.chips.toLocaleString()}
                      </div>
                      <div className="text-xs text-white/40 font-bold uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md">
                        Win {((profile.wins / (profile.games || 1)) * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full text-center py-12">
          <p className="text-white/20 text-xs font-bold tracking-[0.2em] hover:text-white/40 transition-colors cursor-default">
            慈善撲克王大賽 © 2026
          </p>
        </div>
      </div>
    </>
  );
};

export default Lobby;
