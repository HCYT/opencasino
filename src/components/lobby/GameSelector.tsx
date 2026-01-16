import React from 'react';
import { INITIAL_CHIPS_OPTIONS } from '@/constants';
import ToggleSwitch from '@/components/ui/ToggleSwitch';

type GameType = 'SHOWDOWN' | 'BLACKJACK' | 'BIG_TWO' | 'GATE' | 'SLOTS';
type BetMode = 'FIXED_LIMIT' | 'NO_LIMIT';
type BlackjackCutPresetKey = 'DEEP' | 'STANDARD' | 'SHALLOW';

const BLACKJACK_DECK_OPTIONS = [4, 6, 8];
const BIG_TWO_BASE_BETS = [5, 50, 1000, 5000];
const BLACKJACK_CUT_PRESETS = [
  { key: 'DEEP' as BlackjackCutPresetKey, label: '深 (20%)' },
  { key: 'STANDARD' as BlackjackCutPresetKey, label: '標準 (25%)' },
  { key: 'SHALLOW' as BlackjackCutPresetKey, label: '淺 (30%)' }
];

const GAMES = [
  { type: 'SHOWDOWN' as GameType, name: '梭哈', icon: '♠️', desc: '經典五張' },
  { type: 'BLACKJACK' as GameType, name: '21 點', icon: '🃏', desc: '挑戰莊家' },
  { type: 'BIG_TWO' as GameType, name: '大老二', icon: '♣️', desc: '台灣玩法' },
  { type: 'GATE' as GameType, name: '射龍門', icon: '🥅', desc: '運氣對決' },
  { type: 'SLOTS' as GameType, name: '拉霸機', icon: '🎰', desc: '累積大獎' }
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
    <div className="space-y-8">
      {/* Game Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4">
        {GAMES.map(game => {
          const isSelected = gameType === game.type;
          return (
            <button
              key={game.type}
              onClick={() => setGameType(game.type)}
              className={`relative group flex flex-col items-center justify-between p-4 py-6 rounded-[1.5rem] transition-all duration-300 min-h-[160px] ${isSelected
                ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-amber-500 shadow-[0_0_25px_rgba(245,158,11,0.3)] scale-[1.02] z-10'
                : 'bg-black/20 border border-white/5 hover:bg-black/40 hover:border-amber-500/30 hover:-translate-y-1'
                }`}
            >
              <div className={`text-5xl lg:text-6xl mb-3 filter drop-shadow-xl transition-transform duration-300 ${isSelected ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                {game.icon}
              </div>
              <div className="text-center space-y-1 z-10">
                <div className={`text-base lg:text-lg font-black uppercase tracking-wider transition-colors ${isSelected ? 'text-amber-400' : 'text-slate-300 group-hover:text-white'
                  }`}>
                  {game.name}
                </div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-80">
                  {game.desc}
                </div>
              </div>

              {isSelected && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-900 text-[9px] font-black px-3 py-0.5 rounded-full shadow-lg uppercase tracking-widest whitespace-nowrap">
                  Selected
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Configuration Panel */}
      <div className="bg-black/30 backdrop-blur-md rounded-[2rem] p-6 lg:p-8 border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />

        <div className="flex items-center gap-3 mb-6">
          <div className="w-1 h-5 bg-amber-500 rounded-full" />
          <h3 className="text-sm font-black text-white/90 uppercase tracking-[0.2em]">
            桌檯設定 <span className="text-slate-600 ml-2 text-[10px]">CONFIGURATION</span>
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Left Column: Chips & Balance */}
          <div className="space-y-5">
            {!isExistingProfile ? (
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">初始籌碼 buy-in</label>
                <div className="flex flex-wrap gap-2">
                  {INITIAL_CHIPS_OPTIONS.map(val => (
                    <button
                      key={val}
                      onClick={() => setInitialChips(val)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all ${initialChips === val
                        ? 'bg-amber-500 text-slate-900 shadow-[0_0_15px_rgba(245,158,11,0.3)] scale-105'
                        : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      ${val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-emerald-500/10 rounded-2xl p-4 border border-emerald-500/20">
                <label className="text-[10px] font-bold text-emerald-400 uppercase tracking-[0.15em]">當前餘額 Balance</label>
                <div className="text-3xl font-black text-emerald-300 tracking-tight">
                  <span className="text-lg mr-1 opacity-50">$</span>
                  {displayedChips.toLocaleString()}
                </div>
                <div className="text-[10px] text-emerald-500/50 uppercase tracking-wider font-bold">
                  延續角色資產
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Game Specific Rules */}
          <div className="space-y-6">

            {/* BLACKJACK SETTINGS */}
            {gameType === 'BLACKJACK' && (
              <div className="space-y-5 animate-slide-up">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">牌靴 Decks</label>
                  <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                    {BLACKJACK_DECK_OPTIONS.map(val => (
                      <button
                        key={val}
                        onClick={() => setBlackjackDecks(val)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all ${blackjackDecks === val
                          ? 'bg-slate-700 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">切牌 Cut Card</label>
                  <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                    {BLACKJACK_CUT_PRESETS.map(preset => (
                      <button
                        key={preset.key}
                        onClick={() => setBlackjackCutPreset(preset.key)}
                        className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all ${blackjackCutPreset === preset.key
                          ? 'bg-slate-700 text-white shadow-md'
                          : 'text-slate-500 hover:text-slate-300'
                          }`}
                      >
                        {preset.key}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* BIG TWO SETTINGS */}
            {gameType === 'BIG_TWO' && (
              <div className="space-y-5 animate-slide-up">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">底注 Base Bet</label>
                  <div className="grid grid-cols-4 gap-2">
                    {BIG_TWO_BASE_BETS.map(val => (
                      <button
                        key={val}
                        onClick={() => setBigTwoBaseBet(val)}
                        className={`py-2 rounded-xl text-[11px] font-black transition-all ${bigTwoBaseBet === val
                          ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/40'
                          : 'bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white'
                          }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                  <div className="flex flex-col">
                    <span className="text-red-400 font-black text-sm">惡夢模式 Nightmare</span>
                    <span className="text-red-500/40 text-[10px] font-bold uppercase tracking-wider">NPC 聯合行動</span>
                  </div>
                  <ToggleSwitch checked={teamingEnabled} onChange={setTeamingEnabled} />
                </div>
              </div>
            )}

            {/* SHOWDOWN SETTINGS */}
            {gameType === 'SHOWDOWN' && (
              <div className="space-y-5 animate-slide-up">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">下注模式 Betting</label>
                  <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
                    <button
                      onClick={() => setBetMode('FIXED_LIMIT')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all ${betMode === 'FIXED_LIMIT'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      LIMIT
                    </button>
                    <button
                      onClick={() => setBetMode('NO_LIMIT')}
                      className={`flex-1 py-1.5 rounded-lg text-[11px] font-black transition-all ${betMode === 'NO_LIMIT'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'text-slate-500 hover:text-slate-300'
                        }`}
                    >
                      NO LIMIT
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-red-500/5 p-4 rounded-xl border border-red-500/10">
                  <div className="flex flex-col">
                    <span className="text-red-400 font-black text-sm">惡夢模式</span>
                    <span className="text-red-500/40 text-[10px] font-bold uppercase tracking-wider">NPC Team Up</span>
                  </div>
                  <ToggleSwitch checked={teamingEnabled} onChange={setTeamingEnabled} />
                </div>
              </div>
            )}

            {/* DEFAULT / NO SETTINGS */}
            {['GATE', 'SLOTS'].includes(gameType) && (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-40 py-4">
                <span className="text-4xl mb-2">⚡️</span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">無需額外設定</span>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default GameSelector;
