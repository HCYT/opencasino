import React, { useState } from 'react';
import { GamePhase } from '@/types';
import { INITIAL_CHIPS_OPTIONS, MIN_BET } from '@/constants';
import { NPC_PROFILES } from '@/config/npcProfiles';
import { useLobbyState } from '@/services/lobby/useLobbyState';
import { validateLobbyEntry } from '@/services/lobby/entryValidation';
import LobbyHeader from './LobbyHeader';
import GameSelector from './GameSelector';
import PlayerInput from './PlayerInput';
import BalancePanel from './BalancePanel';
import ProfileList from './ProfileList';
import NPCProfiles from './NPCProfiles';
import ParticleBackground from './ParticleBackground';
import { GameButton } from '@/components/ui/GameButton';
import VolumeControl from '@/components/ui/VolumeControl';

type GameType = 'SHOWDOWN' | 'BLACKJACK' | 'BIG_TWO' | 'GATE' | 'SLOTS';
type BetMode = 'FIXED_LIMIT' | 'NO_LIMIT';

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

const BLACKJACK_DECK_OPTIONS = [4, 6, 8];
const BIG_TWO_BASE_BETS = [5, 50, 1000, 5000];
const BLACKJACK_CUT_PRESETS = [
  { key: 'DEEP', label: '深（剩 20%）', min: 0.15, max: 0.2 },
  { key: 'STANDARD', label: '標準（剩 25%）', min: 0.2, max: 0.25 },
  { key: 'SHALLOW', label: '淺（剩 30%）', min: 0.25, max: 0.3 }
] as const;
type BlackjackCutPresetKey = typeof BLACKJACK_CUT_PRESETS[number]['key'];

const Lobby: React.FC<LobbyProps> = ({ onGameStart }) => {
  const {
    initialChips,
    setInitialChips,
    playerName,
    setPlayerName,
    profiles,
    setProfiles,
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
    handleResetAllProfiles
  } = useLobbyState({ npcProfiles: NPC_PROFILES });

  const [gameType, setGameType] = useState<GameType>('SHOWDOWN');
  const [betMode, setBetMode] = useState<BetMode>('FIXED_LIMIT');
  const [teamingEnabled, setTeamingEnabled] = useState(false);
  const [blackjackDecks, setBlackjackDecks] = useState(6);
  const [blackjackCutPreset, setBlackjackCutPreset] = useState<BlackjackCutPresetKey>('STANDARD');
  const [bigTwoBaseBet, setBigTwoBaseBet] = useState(BIG_TWO_BASE_BETS[0]);
  const [startError, setStartError] = useState<string | null>(null);

  const handleStartGame = () => {
    setStartError(null);
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

  return (
    <>
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-900 to-emerald-950 -z-10"></div>
      <ParticleBackground />
      <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
        <VolumeControl />
      </div>

      <div className="w-full flex flex-col items-center text-white py-8">
        <LobbyHeader />

        <div className="w-full max-w-6xl px-4 py-8 space-y-12">
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
            <div className="space-y-6">
              <PlayerInput
                playerName={playerName}
                setPlayerName={setPlayerName}
              />

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
                <div className="text-center py-3 px-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <div className="text-red-300 font-black text-sm">
                    {isNpcSelected ? '不能使用 NPC 名稱進場' : startError}
                  </div>
                </div>
              )}

              <GameButton
                onClick={handleStartGame}
                disabled={isNpcSelected}
                variant="primary"
                size="pillLg"
                className={`w-full text-2xl ${isNpcSelected ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
              >
                {gameType === 'BLACKJACK' ? '開始 21 點' :
                  gameType === 'BIG_TWO' ? '開始大老二' :
                    gameType === 'SLOTS' ? '進入賭場' : '踏入牌局'}
              </GameButton>
            </div>

            <div className="space-y-6">
              <BalancePanel
                displayedChips={displayedChips}
                displayedDebt={displayedDebt}
                repayAmount={repayAmount}
                setRepayAmount={setRepayAmount}
                handleLoan={handleLoan}
                handleRepay={handleRepay}
                resolveChips={resolveChips}
              />

              <ProfileList
                leaderboard={leaderboard}
                playerName={playerName}
                setPlayerName={setPlayerName}
                npcNames={npcNames}
                handleDeleteProfile={handleDeleteProfile}
                handleCreateProfile={handleCreateProfile}
                handleResetNpcProfiles={handleResetNpcProfiles}
                handleResetAllProfiles={handleResetAllProfiles}
              />
            </div>
          </div>

          <div className="pt-12 border-t border-slate-700/30">
            <NPCProfiles />
          </div>

          {leaderboard.length > 0 && (
            <div className="pt-12 border-t border-slate-700/30">
              <div className="text-amber-400 font-black text-sm uppercase tracking-[0.4em] mb-6 text-center relative z-10">
                戰績排行榜
              </div>
              <div className="grid gap-2 max-w-3xl mx-auto relative z-10">
                {leaderboard.map((profile, index) => (
                  <div
                    key={profile.name}
                    className="flex items-center justify-between bg-gradient-to-r from-slate-800/80 to-slate-900/80 border border-slate-700/50 backdrop-blur-sm rounded-xl px-6 py-4 text-white/90 hover:border-amber-400/30 transition-all"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-base shadow-lg ${index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-slate-900' :
                        index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-slate-900' :
                          index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white' :
                            'bg-slate-700/50 text-slate-400'
                        }`}>
                        {index + 1}
                      </div>
                      <div className="font-black text-base truncate">{profile.name}</div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-xs text-slate-400 font-bold uppercase tracking-wide">
                        W {profile.wins} / L {profile.losses} / G {profile.games}
                      </div>
                      <div className="text-base font-black text-emerald-300">
                        ${profile.chips.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full text-center py-8 text-slate-600 text-xs">
          <p>慈善撲克王大賽 © 2026</p>
        </div>
      </div>
    </>
  );


};

export default Lobby;
