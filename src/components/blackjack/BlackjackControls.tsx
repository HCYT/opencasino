import React from 'react';
import { BlackjackPhase } from '../../services/blackjack/types';
import { getHandValue } from '../../services/blackjack/rules';
import { BlackjackHand, BlackjackPlayer } from '../../services/blackjack/types';

interface BlackjackControlsProps {
  phase: BlackjackPhase;
  message: string;
  minBet: number;
  playerBet: number;
  canBet: boolean;
  setPlayerBet: (value: number) => void;
  onStartHand: () => void;
  onHit: () => void;
  onStand: () => void;
  onSplit: () => void;
  canSplitHand: boolean;
  isPlayerTurn: boolean;
  player?: BlackjackPlayer;
  activeHand?: BlackjackHand;
  onReset: () => void;
  onExit: () => void;
}

const BlackjackControls: React.FC<BlackjackControlsProps> = ({
  phase,
  message,
  minBet,
  playerBet,
  canBet,
  setPlayerBet,
  onStartHand,
  onHit,
  onStand,
  onSplit,
  canSplitHand,
  isPlayerTurn,
  player,
  activeHand,
  onReset,
  onExit
}) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 z-[60] pointer-events-none">
      <div className="max-w-[1400px] mx-auto w-full h-full relative flex items-end justify-between">
        <div className="flex flex-row items-end gap-3 pointer-events-auto">
          <div className="bg-black/80 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-1 min-w-[200px]">
            <div className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
              <span>My Stack</span>
              {isPlayerTurn && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>}
            </div>
            <div className="text-yellow-500 font-mono font-black text-3xl flex items-center gap-2">
              <span className="text-2xl opacity-80">💵</span> ${player?.chips.toLocaleString() || 0}
            </div>
            {activeHand && (
              <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mt-1">
                目前手牌點數 {getHandValue(activeHand.cards).total}
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-auto flex items-end gap-4 h-[160px]">
          {phase === 'BETTING' && (
            <div className="flex items-end gap-3">
              <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/5">
                <div className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em]">玩家下注</div>
                <div className="text-yellow-400 font-black text-2xl">$ {playerBet.toLocaleString()}</div>
                <input
                  type="range"
                  min={minBet}
                  max={Math.max(minBet, player?.chips ?? minBet)}
                  step={minBet}
                  value={playerBet}
                  disabled={!canBet}
                  onChange={(e) => setPlayerBet(Number(e.target.value))}
                  className="w-52 accent-yellow-500"
                />
              </div>
              <button
                onClick={onStartHand}
                disabled={!canBet}
                className="bg-gradient-to-b from-yellow-400 to-amber-600 text-slate-900 font-black px-10 py-5 rounded-2xl text-xl transition-all shadow-xl disabled:opacity-40"
              >
                發牌
              </button>
            </div>
          )}

          {phase === 'PLAYING' && (
            <div className="flex items-end gap-3">
              {isPlayerTurn ? (
                <div className={`flex items-end ${canSplitHand ? 'gap-2' : 'gap-3'}`}>
                  <button
                    onClick={onHit}
                    className="w-24 h-24 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg hover:brightness-110"
                  >
                    要牌
                  </button>
                  <button
                    onClick={onStand}
                    className="w-24 h-24 rounded-[1.5rem] bg-red-600 text-white font-black uppercase tracking-widest shadow-lg hover:brightness-110"
                  >
                    停牌
                  </button>
                  {canSplitHand && (
                    <button
                      onClick={onSplit}
                      className="w-24 h-24 rounded-[1.5rem] bg-blue-600 text-white font-black uppercase tracking-widest shadow-lg hover:brightness-110"
                    >
                      分牌
                    </button>
                  )}
                </div>
              ) : (
                <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/10 text-white/60 font-black uppercase tracking-widest">
                  NPC 行動中
                </div>
              )}
            </div>
          )}

          {phase === 'DEALER' && (
            <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/10 text-white/60 font-black uppercase tracking-widest">
              莊家補牌中
            </div>
          )}

          {phase === 'RESULT' && (
            <div className="flex items-end gap-3">
              <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/10 text-yellow-300 font-black">
                {message || '本局結束'}
              </div>
              <button
                onClick={onReset}
                className="bg-white text-slate-900 font-black px-10 py-5 rounded-2xl shadow-xl"
              >
                下一局
              </button>
            </div>
          )}

          <button
            onClick={onExit}
            className="ml-4 bg-black/50 border border-white/10 text-white/70 font-black px-6 py-4 rounded-2xl uppercase tracking-widest hover:text-white hover:border-white/40"
          >
            返回大廳
          </button>
        </div>
      </div>
    </div>
  );
};

export default BlackjackControls;
