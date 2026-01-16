import React from 'react';
import { INITIAL_CHIPS_OPTIONS } from '@/constants';
import { GameButton } from '@/components/ui/GameButton';
import ToggleSwitch from '@/components/ui/ToggleSwitch';
import Panel from '@/components/ui/Panel';

type GameType = 'SHOWDOWN' | 'BLACKJACK' | 'BIG_TWO' | 'GATE' | 'SLOTS';
type BetMode = 'FIXED_LIMIT' | 'NO_LIMIT';
type BlackjackCutPresetKey = 'DEEP' | 'STANDARD' | 'SHALLOW';

const BLACKJACK_DECK_OPTIONS = [4, 6, 8];
const BIG_TWO_BASE_BETS = [5, 50, 1000, 5000];
const BLACKJACK_CUT_PRESETS = [
  { key: 'DEEP' as BlackjackCutPresetKey, label: '深（剩 20%）' },
  { key: 'STANDARD' as BlackjackCutPresetKey, label: '標準（剩 25%）' },
  { key: 'SHALLOW' as BlackjackCutPresetKey, label: '淺（剩 30%）' }
];

const GAMES = [
  { type: 'SHOWDOWN' as GameType, name: '梭哈', icon: '♠️', desc: '經典五張梭哈' },
  { type: 'BLACKJACK' as GameType, name: '21 點', icon: '🃏', desc: '經典 21 點，挑戰莊家' },
  { type: 'BIG_TWO' as GameType, name: '大老二', icon: '♣️', desc: '臺灣玩法大老二' },
  { type: 'GATE' as GameType, name: '射龍門', icon: '🎯', desc: '經典射龍門，賭運氣' },
  { type: 'SLOTS' as GameType, name: '拉霸機', icon: '🎰', desc: '角子老虎機，累積彩金' }
];

interface GameSelectorProps {
  gameType: GameType;
  setGameType: (type: GameType) => void;
  betMode: BetMode;
  setBetMode: (mode: BetMode) => void;
  teamingEnabled: boolean;
  setTeamingEnabled: (enabled: boolean) => void;
  blackjackDecks: number;
  setBlackjackDecks: (decks: number) => void;
  blackjackCutPreset: BlackjackCutPresetKey;
  setBlackjackCutPreset: (preset: BlackjackCutPresetKey) => void;
  bigTwoBaseBet: number;
  setBigTwoBaseBet: (bet: number) => void;
  initialChips: number;
  setInitialChips: (chips: number) => void;
  isExistingProfile: boolean;
  displayedChips: number;
}

const GameSelector: React.FC<GameSelectorProps> = ({
  gameType,
  setGameType,
  betMode,
  setBetMode,
  teamingEnabled,
  setTeamingEnabled,
  blackjackDecks,
  setBlackjackDecks,
  blackjackCutPreset,
  setBlackjackCutPreset,
  bigTwoBaseBet,
  setBigTwoBaseBet,
  initialChips,
  setInitialChips,
  isExistingProfile,
  displayedChips
}) => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
        <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-4 tracking-widest">
          選擇遊戲
        </label>
        <div className="grid grid-cols-5 gap-3 mb-4">
          {GAMES.map(game => (
            <GameButton
              key={game.type}
              onClick={() => setGameType(game.type)}
              variant={gameType === game.type ? 'primary' : 'muted'}
              size="pill"
              className={`flex flex-col items-center gap-1 py-4 ${
                gameType === game.type 
                  ? 'scale-105 shadow-[0_0_30px_rgba(251,191,36,0.5)] text-slate-900 border-2 border-amber-400' 
                  : 'text-slate-400 border-2 border-slate-700/50 hover:border-slate-600/50 hover:text-slate-300'
              }`}
            >
              <span className="text-2xl">{game.icon}</span>
              <span className="text-xs font-black">{game.name}</span>
            </GameButton>
          ))}
        </div>
        <div className="text-center">
          <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">
            {GAMES.find(g => g.type === gameType)?.desc}
          </span>
        </div>
      </div>

      {!isExistingProfile && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
          <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-4 tracking-widest">
            初始籌碼
          </label>
          <div className="grid grid-cols-2 gap-4">
            {INITIAL_CHIPS_OPTIONS.map(val => (
              <GameButton
                key={val}
                onClick={() => setInitialChips(val)}
                variant={initialChips === val ? 'primary' : 'muted'}
                size="pill"
                className={`text-lg font-black ${
                  initialChips === val 
                    ? 'scale-105 shadow-[0_0_30px_rgba(251,191,36,0.5)] text-slate-900 border-2 border-amber-400' 
                    : 'text-slate-400 border-2 border-slate-700/50 hover:border-slate-600/50 hover:text-slate-300'
                }`}
              >
                ${val.toLocaleString()}
              </GameButton>
            ))}
          </div>
        </div>
      )}

      {isExistingProfile && (
        <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-2 border-emerald-500/30 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
          <label className="block text-[11px] font-black uppercase text-emerald-400 mb-3 tracking-widest">
            既有角色餘額
          </label>
          <div className="text-4xl font-black text-emerald-300 mb-2">
            ${displayedChips.toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 uppercase tracking-widest font-medium">
            進入將延續角色資產
          </div>
        </div>
      )}

      {gameType === 'BLACKJACK' && (
        <>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
            <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-4 tracking-widest">
              牌靴副數
            </label>
            <div className="grid grid-cols-3 gap-4">
              {BLACKJACK_DECK_OPTIONS.map(val => (
                <GameButton
                  key={val}
                  onClick={() => setBlackjackDecks(val)}
                  variant={blackjackDecks === val ? 'primary' : 'muted'}
                  size="pill"
                  className={`text-sm font-black ${
                    blackjackDecks === val 
                      ? 'scale-105 shadow-[0_0_30px_rgba(251,191,36,0.5)] text-slate-900 border-2 border-amber-400' 
                      : 'text-slate-400 border-2 border-slate-700/50 hover:border-slate-600/50 hover:text-slate-300'
                  }`}
                >
                  {val} 副牌
                </GameButton>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
            <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-4 tracking-widest">
              切牌深度
            </label>
            <div className="grid grid-cols-3 gap-4">
              {BLACKJACK_CUT_PRESETS.map(preset => (
                <GameButton
                  key={preset.key}
                  onClick={() => setBlackjackCutPreset(preset.key)}
                  variant={blackjackCutPreset === preset.key ? 'primary' : 'muted'}
                  size="pill"
                  className={`text-sm font-black ${
                    blackjackCutPreset === preset.key 
                      ? 'scale-105 shadow-[0_0_30px_rgba(251,191,36,0.5)] text-slate-900 border-2 border-amber-400' 
                      : 'text-slate-400 border-2 border-slate-700/50 hover:border-slate-600/50 hover:text-slate-300'
                  }`}
                >
                  {preset.label}
                </GameButton>
              ))}
            </div>
          </div>
        </>
      )}

      {gameType === 'BIG_TWO' && (
        <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
          <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-4 tracking-widest">
            大老二底注
          </label>
          <div className="grid grid-cols-2 gap-4">
            {BIG_TWO_BASE_BETS.map(val => (
              <GameButton
                key={val}
                onClick={() => setBigTwoBaseBet(val)}
                variant={bigTwoBaseBet === val ? 'primary' : 'muted'}
                size="pill"
                className={`text-sm font-black ${
                  bigTwoBaseBet === val 
                    ? 'scale-105 shadow-[0_0_30px_rgba(251,191,36,0.5)] text-slate-900 border-2 border-amber-400' 
                    : 'text-slate-400 border-2 border-slate-700/50 hover:border-slate-600/50 hover:text-slate-300'
                }`}
              >
                每張 ${val.toLocaleString()}
              </GameButton>
            ))}
          </div>
        </div>
      )}

      {gameType === 'SHOWDOWN' && (
        <>
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
            <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-4 tracking-widest">
              下注規則
            </label>
            <div className="grid grid-cols-2 gap-4">
              <GameButton
                onClick={() => setBetMode('FIXED_LIMIT')}
                variant={betMode === 'FIXED_LIMIT' ? 'primary' : 'muted'}
                size="pill"
                className={`text-sm font-black ${
                  betMode === 'FIXED_LIMIT' 
                    ? 'scale-105 shadow-[0_0_30px_rgba(251,191,36,0.5)] text-slate-900 border-2 border-amber-400' 
                    : 'text-slate-400 border-2 border-slate-700/50 hover:border-slate-600/50 hover:text-slate-300'
                }`}
              >
                固定籌碼
              </GameButton>
              <GameButton
                onClick={() => setBetMode('NO_LIMIT')}
                variant={betMode === 'NO_LIMIT' ? 'primary' : 'muted'}
                size="pill"
                className={`text-sm font-black ${
                  betMode === 'NO_LIMIT' 
                    ? 'scale-105 shadow-[0_0_30px_rgba(251,191,36,0.5)] text-slate-900 border-2 border-amber-400' 
                    : 'text-slate-400 border-2 border-slate-700/50 hover:border-slate-600/50 hover:text-slate-300'
                }`}
              >
                自由籌碼
              </GameButton>
            </div>
            <div className="text-center mt-3">
              <span className="text-xs text-slate-500 uppercase tracking-widest font-medium">
                {betMode === 'FIXED_LIMIT' 
                  ? '小注 / 大注，依街數固定加注' 
                  : '可自由下注，仍有最低加注限制'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/30 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
            <div className="flex flex-col">
              <span className="text-white font-black text-lg">惡夢模式</span>
              <span className="text-slate-400 text-[11px] uppercase tracking-wider font-medium">
                NPC 聯合行動
              </span>
            </div>
            <ToggleSwitch checked={teamingEnabled} onChange={setTeamingEnabled} />
          </div>
        </>
      )}

      {(gameType === 'BIG_TWO') && (
        <div className="flex items-center justify-between bg-gradient-to-br from-red-500/20 to-red-600/10 border-2 border-red-500/30 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
          <div className="flex flex-col">
            <span className="text-white font-black text-lg">惡夢模式</span>
            <span className="text-slate-400 text-[11px] uppercase tracking-wider font-medium">
              NPC 聯合行動
            </span>
          </div>
          <ToggleSwitch checked={teamingEnabled} onChange={setTeamingEnabled} />
        </div>
      )}
    </div>
  );
};

export default GameSelector;
