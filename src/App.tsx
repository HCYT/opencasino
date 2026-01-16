import React, { useEffect, useState } from 'react';
import { Player, GamePhase } from './types';
import { INITIAL_CHIPS_OPTIONS, LOAN_AMOUNT, MIN_BET } from './constants';
import { NPC_PROFILES } from './config/npcProfiles';
import { loadProfiles, saveProfiles, type StoredProfile } from './services/profileStore';
import { useShowdownProfileSync } from './services/showdown/useShowdownProfileSync';
import { useGameEngine } from './services/showdown/useShowdownEngine';
import { ShowdownRules } from './services/showdown/ShowdownRules';
import BlackjackGame, { BlackjackResult, BlackjackSeat } from './components/BlackjackGame';
import BigTwoGame, { BigTwoResult, BigTwoSeat } from './components/BigTwoGame';
import ShowdownGame from './components/showdown/ShowdownGame';

const BLACKJACK_DECK_OPTIONS = [4, 6, 8];
const BIG_TWO_BASE_BETS = [5, 50, 1000, 5000];
const BLACKJACK_CUT_PRESETS = [
  { key: 'DEEP', label: '深（剩 20%）', min: 0.15, max: 0.2 },
  { key: 'STANDARD', label: '標準（剩 25%）', min: 0.2, max: 0.25 },
  { key: 'SHALLOW', label: '淺（剩 30%）', min: 0.25, max: 0.3 }
] as const;
type BlackjackCutPresetKey = typeof BLACKJACK_CUT_PRESETS[number]['key'];

// Showdown icons are now in components/showdown/ShowdownIcons

// profileStore handles localStorage persistence

const App: React.FC = () => {
  const [initialChips, setInitialChips] = useState(INITIAL_CHIPS_OPTIONS[0]);
  const [playerName, setPlayerName] = useState('我 (玩家)');
  const [betMode, setBetMode] = useState<'FIXED_LIMIT' | 'NO_LIMIT'>('FIXED_LIMIT');
  const [gameType, setGameType] = useState<'SHOWDOWN' | 'BLACKJACK' | 'BIG_TWO'>('SHOWDOWN');
  const [blackjackActive, setBlackjackActive] = useState(false);
  const [blackjackSessionKey, setBlackjackSessionKey] = useState(0);
  const [blackjackSeats, setBlackjackSeats] = useState<BlackjackSeat[]>([]);
  const [blackjackDecks, setBlackjackDecks] = useState(6);
  const [blackjackCutPreset, setBlackjackCutPreset] = useState<BlackjackCutPresetKey>('STANDARD');
  const [bigTwoActive, setBigTwoActive] = useState(false);
  const [bigTwoSessionKey, setBigTwoSessionKey] = useState(0);
  const [bigTwoSeats, setBigTwoSeats] = useState<BigTwoSeat[]>([]);
  const [bigTwoBaseBet, setBigTwoBaseBet] = useState(BIG_TWO_BASE_BETS[0]);
  const [teamingEnabled, setTeamingEnabled] = useState(false); // Default OFF
  const [profiles, setProfiles] = useState<Record<string, StoredProfile>>(() => loadProfiles());
  const [repayAmount, setRepayAmount] = useState(0);
  const [startError, setStartError] = useState<string | null>(null);
  const playerAvatar = 'https://picsum.photos/seed/me/200/200';

  // Initialize Engine with specific Rules
  const { gameState, initGame, handleAction, startNewHand, playerSpeak } = useGameEngine(new ShowdownRules());
  const { phase, players, pot, currentMaxBet, activePlayerIndex, winners } = gameState;
  const currentPlayer = players[activePlayerIndex];
  const user = players.find(p => p.id === 'player');
  const isUserAlive = !!user;

  useShowdownProfileSync({
    phase,
    winners,
    players,
    setProfiles
  });

  const getEligibleNPC = (exclude: string[]) => {
    const avail = NPC_PROFILES.filter(p => !exclude.includes(p.name));
    return avail[Math.floor(Math.random() * avail.length)];
  };

  const handleStartGame = () => {
    setStartError(null);
    if (npcNames.has(playerName)) return;

    const getProfile = (name: string) => profiles[name];
    const withStats = (base: Player, minChips: number = 0): Player => {
      const stored = getProfile(base.name);
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

    const playerStored = getProfile(playerName);
    const playerChips = playerStored?.chips ?? initialChips;
    const minEntry = gameType === 'BIG_TWO' ? bigTwoBaseBet : MIN_BET;
    if (playerChips < minEntry) {
      setStartError('餘額不足，請先貸款或重設資料');
      return;
    }

    const eligibleNPCs = NPC_PROFILES.filter(p => {
      const stored = getProfile(p.name);
      const chips = stored?.chips ?? initialChips;
      return chips >= minEntry;
    });

    if (eligibleNPCs.length < 3) {
      setStartError('可用 NPC 不足，請重設資料');
      return;
    }

    if (gameType === 'BLACKJACK') {
      const ai1 = getEligibleNPC([]);
      const ai2 = getEligibleNPC([ai1.name]);
      const ai3 = getEligibleNPC([ai1.name, ai2.name]);

      const seatData: BlackjackSeat[] = [
        { id: 'player', name: playerName, chips: playerChips, avatar: playerAvatar, isAI: false },
        { id: 'ai1', name: ai1.name, chips: getProfile(ai1.name)?.chips ?? initialChips, avatar: ai1.avatar, isAI: true },
        { id: 'ai2', name: ai2.name, chips: getProfile(ai2.name)?.chips ?? initialChips, avatar: ai2.avatar, isAI: true },
        { id: 'ai3', name: ai3.name, chips: getProfile(ai3.name)?.chips ?? initialChips, avatar: ai3.avatar, isAI: true }
      ];

      const updated = { ...profiles };
      seatData.forEach(seat => {
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
      saveProfiles(updated);
      setProfiles(updated);
      setBlackjackSeats(seatData);
      setBlackjackSessionKey(prev => prev + 1);
      setBlackjackActive(true);
      return;
    }

    if (gameType === 'BIG_TWO') {
      const ai1 = getEligibleNPC([]);
      const ai2 = getEligibleNPC([ai1.name]);
      const ai3 = getEligibleNPC([ai1.name, ai2.name]);

      const seatData: BigTwoSeat[] = [
        { id: 'player', name: playerName, chips: playerChips, avatar: playerAvatar, isAI: false },
        { id: 'ai1', name: ai1.name, chips: getProfile(ai1.name)?.chips ?? initialChips, avatar: ai1.avatar, isAI: true },
        { id: 'ai2', name: ai2.name, chips: getProfile(ai2.name)?.chips ?? initialChips, avatar: ai2.avatar, isAI: true },
        { id: 'ai3', name: ai3.name, chips: getProfile(ai3.name)?.chips ?? initialChips, avatar: ai3.avatar, isAI: true }
      ];

      const updated = { ...profiles };
      seatData.forEach(seat => {
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
      saveProfiles(updated);
      setProfiles(updated);
      setBigTwoSeats(seatData);
      setBigTwoSessionKey(prev => prev + 1);
      setBigTwoActive(true);
      return;
    }

    const ai1 = getEligibleNPC([]);
    const ai2 = getEligibleNPC([ai1.name]);
    const ai3 = getEligibleNPC([ai1.name, ai2.name]);

    const initialPlayers: Player[] = [
      withStats({ id: 'player', name: playerName, chips: initialChips, currentBet: 0, cards: [], isFolded: false, isAI: false, avatar: playerAvatar }, 0),
      withStats({ id: 'ai1', name: ai1.name, chips: initialChips, currentBet: 0, cards: [], isFolded: false, isAI: true, avatar: ai1.avatar, lastAction: '', teamId: 'AI_TEAM' }, 0),
      withStats({ id: 'ai2', name: ai2.name, chips: initialChips, currentBet: 0, cards: [], isFolded: false, isAI: true, avatar: ai2.avatar, lastAction: '', teamId: 'AI_TEAM' }, 0),
      withStats({ id: 'ai3', name: ai3.name, chips: initialChips, currentBet: 0, cards: [], isFolded: false, isAI: true, avatar: ai3.avatar, lastAction: '', teamId: 'AI_TEAM' }, 0)
    ];
    // Note: Added teamId for AI cooperation
    initGame(initialPlayers, teamingEnabled, betMode);
  };

  const handleBlackjackProfileUpdate = (updates: Array<{ name: string; chips: number; result: BlackjackResult }>) => {
    const updated = { ...profiles };
    updates.forEach(payload => {
      const prev = updated[payload.name];
      const wins = prev?.wins ?? 0;
      const losses = prev?.losses ?? 0;
      const games = prev?.games ?? 0;
      const debt = prev?.debt ?? 0;
      const win = payload.result === 'WIN' || payload.result === 'BLACKJACK';
      const loss = payload.result === 'LOSE';
      updated[payload.name] = {
        name: payload.name,
        chips: payload.chips,
        wins: wins + (win ? 1 : 0),
        losses: losses + (loss ? 1 : 0),
        games: games + 1,
        debt
      };
    });
    saveProfiles(updated);
    setProfiles(updated);
  };

  const handleBigTwoProfileUpdate = (updates: Array<{ name: string; chips: number; result: BigTwoResult }>) => {
    const updated = { ...profiles };
    updates.forEach(payload => {
      const prev = updated[payload.name];
      const wins = prev?.wins ?? 0;
      const losses = prev?.losses ?? 0;
      const games = prev?.games ?? 0;
      const debt = prev?.debt ?? 0;
      updated[payload.name] = {
        name: payload.name,
        chips: payload.chips,
        wins: wins + (payload.result === 'WIN' ? 1 : 0),
        losses: losses + (payload.result === 'LOSE' ? 1 : 0),
        games: games + 1,
        debt
      };
    });
    saveProfiles(updated);
    setProfiles(updated);
  };

  const handleLoan = () => {
    const current = profiles[playerName] || {
      name: playerName,
      chips: initialChips,
      wins: 0,
      losses: 0,
      games: 0,
      debt: 0
    };
    const updated = {
      ...profiles,
      [playerName]: {
        ...current,
        chips: current.chips + LOAN_AMOUNT,
        debt: current.debt + LOAN_AMOUNT
      }
    };
    saveProfiles(updated);
    setProfiles(updated);
  };

  const handleResetAllProfiles = () => {
    if (!window.confirm('確定要重設所有角色資料（含玩家與 NPC）嗎？')) return;
    saveProfiles({});
    setProfiles({});
    setPlayerName('');
    setInitialChips(INITIAL_CHIPS_OPTIONS[0]);
  };

  const handleRepay = () => {
    const current = profiles[playerName];
    if (!current || current.debt <= 0 || repayAmount <= 0) return;
    const repay = Math.min(repayAmount, current.debt, current.chips);
    if (repay <= 0) return;

    const updated = {
      ...profiles,
      [playerName]: {
        ...current,
        chips: current.chips - repay,
        debt: current.debt - repay
      }
    };
    saveProfiles(updated);
    setProfiles(updated);
    setRepayAmount(0);
  };

  const handleCreateProfile = () => {
    if (!playerName.trim()) return;
    if (profiles[playerName]) return;
    const updated = {
      ...profiles,
      [playerName]: {
        name: playerName,
        chips: initialChips,
        wins: 0,
        losses: 0,
        games: 0,
        debt: 0
      }
    };
    saveProfiles(updated);
    setProfiles(updated);
  };

  const handleDeleteProfile = (name: string) => {
    if (!profiles[name]) return;
    const { [name]: _, ...rest } = profiles;
    saveProfiles(rest);
    setProfiles(rest);
    if (playerName === name) {
      setPlayerName('');
      setInitialChips(INITIAL_CHIPS_OPTIONS[0]);
    }
  };

  const handleResetNpcProfiles = () => {
    if (!window.confirm('確定要重設所有 NPC 資產嗎？')) return;
    const npcNames = NPC_PROFILES.map(profile => profile.name);
    const updated = { ...profiles };
    npcNames.forEach(name => {
      updated[name] = {
        name,
        chips: INITIAL_CHIPS_OPTIONS[0],
        wins: 0,
        losses: 0,
        games: 0,
        debt: 0
      };
    });
    saveProfiles(updated);
    setProfiles(updated);
  };

  // showdown profile sync handled by useShowdownProfileSync

  const blackjackCutRange = BLACKJACK_CUT_PRESETS.find(preset => preset.key === blackjackCutPreset) ?? BLACKJACK_CUT_PRESETS[1];

  const resolveBlackjackChips = (name: string) => {
    const stored = profiles[name];
    return stored?.chips ?? initialChips;
  };

  const activeProfile = profiles[playerName];
  const isExistingProfile = Boolean(activeProfile);
  const displayedChips = activeProfile?.chips ?? initialChips;
  const displayedDebt = activeProfile?.debt ?? 0;
  const npcNames = new Set(NPC_PROFILES.map(profile => profile.name));
  const isNpcSelected = npcNames.has(playerName);
  const leaderboard = Object.keys(profiles)
    .map(key => profiles[key])
    .filter((profile): profile is StoredProfile => Boolean(profile))
    .sort((a, b) => {
      if (b.chips !== a.chips) return b.chips - a.chips;
      return b.wins - a.wins;
    });

  useEffect(() => {
    if (activeProfile?.chips !== undefined) {
      setInitialChips(activeProfile.chips);
    }
  }, [activeProfile?.chips]);

  if (bigTwoActive) {
    return (
      <BigTwoGame
        key={`big-two-${bigTwoSessionKey}`}
        seats={bigTwoSeats}
        baseBet={bigTwoBaseBet}
        onExit={() => setBigTwoActive(false)}
        onProfilesUpdate={handleBigTwoProfileUpdate}
      />
    );
  }

  if (blackjackActive) {
    return (
      <BlackjackGame
        key={`blackjack-${blackjackSessionKey}`}
        seats={blackjackSeats}
        minBet={MIN_BET}
        shoeDecks={blackjackDecks}
        cutRatioRange={{ min: blackjackCutRange.min, max: blackjackCutRange.max }}
        npcProfiles={NPC_PROFILES}
        resolveChips={resolveBlackjackChips}
        onExit={() => setBlackjackActive(false)}
        onProfilesUpdate={handleBlackjackProfileUpdate}
      />
    );
  }

  if (phase === GamePhase.SETTING || (!isUserAlive && phase !== GamePhase.RESULT)) {
    if (players.length > 0 && !isUserAlive) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-[#052c16] text-white p-4">
          <h1 className="text-4xl text-yellow-500 font-black mb-2">慈善撲克王大賽</h1>
          <div className="text-red-300 font-black mb-6">你已破產</div>
          <button onClick={() => setInitialChips(INITIAL_CHIPS_OPTIONS[0])} className="text-white underline mb-8">返回大廳</button>
          <div className="bg-black/60 backdrop-blur-xl p-10 rounded-[40px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] max-w-md w-full space-y-8">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-b from-yellow-400 to-amber-600 text-slate-900 font-black py-5 rounded-2xl text-2xl hover:brightness-110 active:scale-95 transition-all shadow-xl"
            >
              重新載入
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-screen w-full flex flex-col items-center justify-start bg-[#052c16] text-white p-4 overflow-y-auto">
        <div className="relative mb-8 text-center pt-6">
          <h1 className="casino-font text-5xl md:text-7xl font-bold mb-4 text-yellow-500 drop-shadow-[0_0_20px_rgba(234,179,8,0.7)] tracking-tight italic">慈善撲克王大賽</h1>
          <div className="h-1 w-32 bg-yellow-500 mx-auto rounded-full mb-4"></div>
          <p className="text-xl text-emerald-100 font-light tracking-[0.4em] uppercase opacity-70">慈 善 撲 克 王 大 賽</p>
        </div>
        <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 pb-10">
          <div className="bg-black/60 backdrop-blur-xl p-10 rounded-[40px] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.6)] space-y-8">
            <div>
              <label className="block text-[10px] font-black uppercase text-yellow-500/60 mb-3 tracking-widest">輸入您的名號</label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="例如：發哥、星爺..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-lg focus:outline-none focus:border-yellow-500 focus:bg-white/10 transition-all placeholder:text-white/20"
              />
            </div>

            {!isExistingProfile ? (
              <div>
                <label className="block text-[10px] font-black uppercase text-yellow-500/60 mb-3 tracking-widest">初始帶入籌碼</label>
                <div className="grid grid-cols-2 gap-4">
                  {INITIAL_CHIPS_OPTIONS.map(val => (
                    <button
                      key={val}
                      onClick={() => setInitialChips(val)}
                      className={`py-4 rounded-2xl border transition-all font-black text-lg ${initialChips === val ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}
                    >
                      ${val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                <div className="text-[10px] font-black uppercase text-yellow-500/60 tracking-widest">既有角色餘額</div>
                <div className="text-2xl font-black text-emerald-300">${displayedChips.toLocaleString()}</div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest">進入將延續角色資產</div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black uppercase text-yellow-500/60 mb-3 tracking-widest">遊戲選擇</label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setGameType('SHOWDOWN')}
                  className={`py-4 rounded-2xl border transition-all font-black text-xs md:text-sm ${gameType === 'SHOWDOWN' ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}
                >
                  梭哈
                </button>
                <button
                  onClick={() => setGameType('BLACKJACK')}
                  className={`py-4 rounded-2xl border transition-all font-black text-xs md:text-sm ${gameType === 'BLACKJACK' ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}
                >
                  21 點
                </button>
                <button
                  onClick={() => setGameType('BIG_TWO')}
                  className={`py-4 rounded-2xl border transition-all font-black text-xs md:text-sm ${gameType === 'BIG_TWO' ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}
                >
                  大老二
                </button>
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest mt-2">
                {gameType === 'SHOWDOWN' ? '經典五張梭哈' : gameType === 'BLACKJACK' ? '經典 21 點，挑戰莊家' : '臺灣玩法大老二'}
              </div>
            </div>

            {gameType === 'BLACKJACK' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-yellow-500/60 mb-3 tracking-widest">牌靴副數</label>
                  <div className="grid grid-cols-3 gap-3">
                    {BLACKJACK_DECK_OPTIONS.map(val => (
                      <button
                        key={val}
                        onClick={() => setBlackjackDecks(val)}
                        className={`py-3 rounded-2xl border transition-all font-black text-xs md:text-sm ${blackjackDecks === val ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-105 shadow-[0_0_16px_rgba(234,179,8,0.25)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}
                      >
                        {val} 副牌
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-yellow-500/60 mb-3 tracking-widest">切牌深度</label>
                  <div className="grid grid-cols-3 gap-3">
                    {BLACKJACK_CUT_PRESETS.map(preset => (
                      <button
                        key={preset.key}
                        onClick={() => setBlackjackCutPreset(preset.key)}
                        className={`py-3 rounded-2xl border transition-all font-black text-[10px] md:text-xs ${blackjackCutPreset === preset.key ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-105 shadow-[0_0_16px_rgba(234,179,8,0.25)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {gameType === 'BIG_TWO' && (
              <div>
                <label className="block text-[10px] font-black uppercase text-yellow-500/60 mb-3 tracking-widest">大老二底注（每張）</label>
                <div className="grid grid-cols-2 gap-4">
                  {BIG_TWO_BASE_BETS.map(val => (
                    <button
                      key={val}
                      onClick={() => setBigTwoBaseBet(val)}
                      className={`py-4 rounded-2xl border transition-all font-black text-xs md:text-sm ${bigTwoBaseBet === val ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}
                    >
                      每張 ${val.toLocaleString()}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {gameType === 'SHOWDOWN' && (
              <div>
                <label className="block text-[10px] font-black uppercase text-yellow-500/60 mb-3 tracking-widest">下注規則</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setBetMode('FIXED_LIMIT')}
                    className={`py-4 rounded-2xl border transition-all font-black text-xs md:text-sm ${betMode === 'FIXED_LIMIT' ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}
                  >
                    固定籌碼
                  </button>
                  <button
                    onClick={() => setBetMode('NO_LIMIT')}
                    className={`py-4 rounded-2xl border transition-all font-black text-xs md:text-sm ${betMode === 'NO_LIMIT' ? 'bg-yellow-500 border-yellow-300 text-slate-900 scale-105 shadow-[0_0_20px_rgba(234,179,8,0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10 text-white/50'}`}
                  >
                    自由籌碼
                  </button>
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-widest mt-2">
                  {betMode === 'FIXED_LIMIT' ? '小注 / 大注，依街數固定加注' : '可自由下注，仍有最低加注限制'}
                </div>
              </div>
            )}

            {gameType === 'SHOWDOWN' && (
              <div className="grid gap-4 grid-cols-2">
                <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-white/10">
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm">惡夢模式</span>
                    <span className="text-white/40 text-[10px] uppercase tracking-wider">NPC 聯合行動</span>
                  </div>
                  <button
                    onClick={() => setTeamingEnabled(!teamingEnabled)}
                    className={`w-12 h-7 rounded-full transition-all duration-300 relative ${teamingEnabled ? 'bg-red-600 shadow-[0_0_15px_rgba(220,38,38,0.5)]' : 'bg-slate-700'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-all duration-300 ${teamingEnabled ? 'translate-x-5' : 'translate-x-0'}`}></div>
                  </button>
                </div>
              </div>
            )}

            {isNpcSelected && (
              <div className="text-xs text-red-300 font-black text-center">不能使用 NPC 名稱進場</div>
            )}
            {startError && (
              <div className="text-xs text-red-300 font-black text-center">{startError}</div>
            )}
            <button
              onClick={handleStartGame}
              disabled={isNpcSelected}
              className={`w-full bg-gradient-to-b from-yellow-400 to-amber-600 text-slate-900 font-black py-5 rounded-2xl text-2xl transition-all shadow-xl ${isNpcSelected ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:scale-95'}`}
            >
              {gameType === 'BLACKJACK' ? '開始 21 點' : gameType === 'BIG_TWO' ? '開始大老二' : '踏入牌局'}
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="text-[10px] font-black uppercase text-yellow-500/60 tracking-widest">真實餘額</div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-black text-emerald-300">${displayedChips.toLocaleString()}</div>
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">可用籌碼</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-white/40 uppercase tracking-widest">負債</div>
                  <div className="text-sm text-red-300 font-black">${displayedDebt.toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={handleLoan}
                className="w-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-black text-xs py-2 rounded-2xl hover:bg-emerald-500/30 transition-all"
              >
                申請貸款 +${LOAN_AMOUNT.toLocaleString()}
              </button>
              <div className="flex gap-2">
                <input
                  type="number"
                  min={0}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(Number(e.target.value) || 0)}
                  placeholder="償還金額"
                  className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 text-white text-xs focus:outline-none focus:border-yellow-500 text-right"
                />
                <button
                  onClick={handleRepay}
                  className="px-4 py-2 rounded-2xl bg-yellow-500/20 border border-yellow-400/40 text-yellow-200 text-xs font-black hover:bg-yellow-500/30 transition-all"
                >
                  還款
                </button>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              <div className="text-[10px] font-black uppercase text-yellow-500/60 tracking-widest">角色列表</div>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {leaderboard.length === 0 && (
                  <div className="text-xs text-white/40">尚無角色</div>
                )}
                {leaderboard.map(profile => (
                  <div key={profile.name} className="flex items-center justify-between bg-black/30 border border-white/10 rounded-2xl px-3 py-2">
                    {npcNames.has(profile.name) ? (
                      <span className="text-sm font-black text-white/50">{profile.name}</span>
                    ) : (
                      <button
                        onClick={() => setPlayerName(profile.name)}
                        className={`text-sm font-black ${playerName === profile.name ? 'text-yellow-300' : 'text-white/80'}`}
                      >
                        {profile.name}
                      </button>
                    )}
                    <div className="text-xs text-emerald-200 font-black">${profile.chips.toLocaleString()}</div>
                    {playerName === profile.name ? (
                      <span className="text-[10px] text-yellow-200 font-black bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2 py-1">使用中</span>
                    ) : npcNames.has(profile.name) ? (
                      <span className="text-[10px] text-white/40 font-black">NPC</span>
                    ) : (
                      <button
                        onClick={() => handleDeleteProfile(profile.name)}
                        className="text-[10px] text-red-200 font-black bg-red-500/10 border border-red-500/30 rounded-lg px-2 py-1"
                      >
                        刪除
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={handleCreateProfile}
                className="w-full bg-white/5 border border-white/10 text-white/80 font-black text-xs py-2 rounded-2xl hover:bg-white/10 transition-all"
              >
                建立角色
              </button>
              <button
                onClick={handleResetNpcProfiles}
                className="w-full bg-red-500/10 border border-red-500/30 text-red-200 font-black text-[10px] py-2 rounded-2xl hover:bg-red-500/20 transition-all"
              >
                重設 NPC 資產
              </button>
              <button
                onClick={handleResetAllProfiles}
                className="w-full bg-yellow-500/10 border border-yellow-400/30 text-yellow-200 font-black text-[10px] py-2 rounded-2xl hover:bg-yellow-500/20 transition-all"
              >
                全部重設
              </button>
            </div>
          </div>
        </div>

        {leaderboard.length > 0 && (
          <div className="mt-10 w-full max-w-2xl bg-black/50 border border-white/10 rounded-[30px] p-6">
            <div className="text-yellow-500 font-black text-xs uppercase tracking-[0.4em] mb-4 text-center">戰績排行榜</div>
            <div className="space-y-2">
              {leaderboard.map(profile => (
                <div key={profile.name} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-3 text-white/90">
                  <div className="font-black text-sm truncate">{profile.name}</div>
                  <div className="text-xs text-white/60">W {profile.wins} / L {profile.losses} / G {profile.games}</div>
                  <div className="text-sm font-black text-emerald-300">${profile.chips.toLocaleString()}</div>
                  <div className="text-[10px] text-red-300">負債 ${profile.debt.toLocaleString()}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <ShowdownGame
      phase={phase}
      players={players}
      pot={pot}
      currentPlayer={currentPlayer}
      currentMaxBet={currentMaxBet}
      minBet={MIN_BET}
      winners={winners}
      betMode={betMode}
      handleAction={handleAction}
      startNewHand={startNewHand}
      playerSpeak={playerSpeak}
    />
  );
};

export default App;
