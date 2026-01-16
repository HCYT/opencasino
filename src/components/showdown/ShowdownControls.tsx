import React from 'react';
import { ActionType, GamePhase, Player } from '../../types';
import { PLAYER_QUOTES } from '../../constants';
import { IconBolt, IconChat, IconCheck, IconCoin, IconFlag, IconTrendUp } from './ShowdownIcons';

interface ShowdownControlsProps {
  phase: GamePhase;
  minBet: number;
  user?: Player;
  isUserTurn: boolean;
  callNeeded: number;
  canRaise: boolean;
  raiseAmount: number;
  raiseTotal: number;
  maxRaise: number;
  betMode: 'FIXED_LIMIT' | 'NO_LIMIT';
  customRaiseAmount: number;
  setCustomRaiseAmount: (value: number) => void;
  showChatMenu: boolean;
  setShowChatMenu: (value: boolean) => void;
  chatInput: string;
  setChatInput: (value: string) => void;
  playerSpeak: (text: string) => void;
  onAction: (action: ActionType, amount?: number) => void;
  onStartNewHand: () => void;
}

const ShowdownControls: React.FC<ShowdownControlsProps> = ({
  phase,
  minBet,
  user,
  isUserTurn,
  callNeeded,
  canRaise,
  raiseAmount,
  raiseTotal,
  maxRaise,
  betMode,
  customRaiseAmount,
  setCustomRaiseAmount,
  showChatMenu,
  setShowChatMenu,
  chatInput,
  setChatInput,
  playerSpeak,
  onAction,
  onStartNewHand
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 z-[60] pointer-events-none">
      <div className="max-w-[1400px] mx-auto w-full h-full relative flex items-end justify-between">
        <div className="flex flex-row items-end gap-3 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-1 min-w-[200px] md:min-w-[160px]">
            <div className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
              <span>My Stack</span>
              {isUserTurn && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>}
            </div>
            <div className="text-yellow-500 font-mono font-black text-3xl flex items-center gap-2">
              <span className="text-2xl opacity-80">💵</span> ${user?.chips.toLocaleString() || 0}
            </div>
            {isUserTurn && (
              <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest animate-pulse mt-1">
                Your Turn
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-auto flex items-end gap-4 h-[200px]">
          {isUserTurn ? (
            <div className="flex items-end gap-3 animate-in slide-in-from-bottom-20 fade-in duration-300 relative">
              {showChatMenu && (
                <div className="absolute bottom-[110%] left-0 mb-4 bg-black/90 backdrop-blur-xl p-4 rounded-[2rem] border border-white/20 shadow-2xl w-[300px] h-[400px] flex flex-col gap-2 overflow-y-auto z-[100] no-scrollbar">
                  <h3 className="text-yellow-500 font-black text-xs uppercase tracking-widest mb-2 sticky top-0 bg-black/90 py-2 border-b border-white/10">選擇你的名言</h3>
                  <div className="flex gap-2">
                    <input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const text = chatInput.trim();
                          if (!text) return;
                          playerSpeak(text);
                          setChatInput('');
                          setShowChatMenu(false);
                        }
                      }}
                      placeholder="輸入你的台詞..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-yellow-500"
                    />
                    <button
                      onClick={() => {
                        const text = chatInput.trim();
                        if (!text) return;
                        playerSpeak(text);
                        setChatInput('');
                        setShowChatMenu(false);
                      }}
                      className="px-3 py-2 rounded-xl bg-yellow-500/20 border border-yellow-400/40 text-yellow-200 text-xs font-black"
                    >
                      送出
                    </button>
                  </div>
                  {PLAYER_QUOTES.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => { playerSpeak(q); setShowChatMenu(false); }}
                      className="bg-white/5 hover:bg-yellow-500 hover:text-black text-white text-left px-4 py-3 rounded-xl text-sm font-bold transition-all text-[11px] border border-white/5"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <button
                onClick={() => setShowChatMenu(!showChatMenu)}
                className="group w-20 h-20 rounded-[1.5rem] bg-slate-700/50 border border-white/10 hover:bg-slate-600 text-white transition-all active:scale-95 flex flex-col items-center justify-center backdrop-blur-md"
              >
                <span className="mb-1 text-white/90 group-hover:scale-110 transition-transform">
                  <IconChat />
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Talk</span>
              </button>

              <div className="absolute bottom-[110%] right-0 mb-4 bg-black/90 backdrop-blur-xl p-4 rounded-[2rem] border border-yellow-500/20 shadow-2xl w-[300px] flex flex-col gap-3">
                {betMode === 'NO_LIMIT' ? (
                  canRaise ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">自由籌碼</span>
                        <span className="text-yellow-500 font-mono font-bold text-lg">$ {raiseTotal.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                        加注額 $ {raiseAmount.toLocaleString()}
                      </div>
                      <input
                        type="range"
                        min={minBet}
                        max={maxRaise}
                        step={minBet}
                        value={customRaiseAmount}
                        onChange={(e) => setCustomRaiseAmount(parseInt(e.target.value, 10))}
                        className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400"
                      />
                    </>
                  ) : (
                    <div className="text-center text-white/30 font-bold text-xs uppercase py-2">無法加注</div>
                  )
                ) : (
                  canRaise ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">固定籌碼</span>
                        <span className="text-yellow-500 font-mono font-bold text-lg">$ {raiseTotal.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                        加注幅度 $ {raiseAmount.toLocaleString()}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-white/30 font-bold text-xs uppercase py-2">無法加注</div>
                  )
                )}
              </div>

              <button
                onClick={() => onAction('FOLD')}
                className="group w-20 h-20 rounded-[1.5rem] bg-red-500/10 border border-red-500/30 hover:bg-red-600 hover:border-red-400 text-red-100 transition-all active:scale-95 flex flex-col items-center justify-center backdrop-blur-md"
              >
                <span className="mb-1 text-red-100 group-hover:scale-110 transition-transform">
                  <IconFlag />
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">不跟</span>
              </button>

              <button
                onClick={() => onAction(callNeeded === 0 ? 'CHECK' : 'CALL')}
                className="group w-24 h-24 rounded-[1.8rem] bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-600 hover:border-emerald-400 text-emerald-100 transition-all active:scale-95 flex flex-col items-center justify-center backdrop-blur-md shadow-lg"
              >
                <div className="mb-1 group-hover:scale-110 transition-transform">
                  {callNeeded === 0 ? <IconCheck /> : <IconCoin />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">
                  {callNeeded === 0 ? '過牌' : `跟 $${callNeeded}`}
                </span>
              </button>

              <button
                onClick={() => onAction('RAISE', raiseAmount)}
                disabled={!canRaise}
                className="group w-24 h-24 rounded-[1.8rem] bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500 hover:border-amber-400 text-amber-100 transition-all active:scale-95 flex flex-col items-center justify-center backdrop-blur-md shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="mb-1 group-hover:scale-110 transition-transform">
                  <IconTrendUp />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">加注</span>
              </button>

              <button
                onClick={() => onAction('ALL_IN')}
                className="group w-20 h-20 rounded-[1.5rem] bg-purple-500/10 border border-purple-500/30 hover:bg-purple-600 hover:border-purple-400 text-purple-100 transition-all active:scale-95 flex flex-col items-center justify-center backdrop-blur-md"
              >
                <span className="mb-1 text-purple-100 group-hover:scale-110 transition-transform">
                  <IconBolt />
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">梭哈</span>
              </button>
            </div>
          ) : phase === GamePhase.RESULT ? (
            <button
              onClick={onStartNewHand}
              className="bg-white text-slate-900 font-black px-12 py-6 rounded-3xl shadow-[0_0_50px_rgba(255,255,255,0.4)] text-xl animate-pulse transform hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
            >
              Play Again
            </button>
          ) : (
            <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 opacity-80">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-white/40 font-bold uppercase tracking-widest text-xs whitespace-nowrap">
                Waiting for opponents
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShowdownControls;
