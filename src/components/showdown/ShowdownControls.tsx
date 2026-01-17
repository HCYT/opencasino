import React from 'react';
import { ActionType, GamePhase, Player } from '../../types';
import { PLAYER_QUOTES } from '../../constants';
import { IconBolt, IconChat, IconCheck, IconCoin, IconFlag, IconTrendUp } from './ShowdownIcons';
import { GameButton } from '../ui/GameButton';
import PillPanel from '../ui/PillPanel';
import StackCard from '../ui/StackCard';
import RangeSlider from '../ui/RangeSlider';
import { playSound } from '../../services/sound';
import {
  bottomDock,
  bottomDockInner,
  lobbyExitButton
} from '../ui/sharedStyles';

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
  onExit: () => void;
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
  onStartNewHand,
  onExit
}) => {
  return (
    <div className={bottomDock}>
      <div className={bottomDockInner}>
        <div className="absolute left-0 bottom-0 flex flex-col gap-3 pointer-events-auto">
          <StackCard
            label="My Stack"
            value={<><span className="text-2xl opacity-80">💵</span> ${user?.chips.toLocaleString() || 0}</>}
            showPing={isUserTurn}
            className="min-w-[200px] md:min-w-[160px]"
          >
            {isUserTurn && (
              <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest animate-pulse mt-1">
                Your Turn
              </div>
            )}
          </StackCard>
          <GameButton
            onClick={onExit}
            variant="ghost"
            size="pill"
            className={lobbyExitButton}
          >
            返回大廳
          </GameButton>
        </div>

        <div className="absolute right-0 bottom-0 pointer-events-auto flex items-end justify-end gap-4 h-[200px]">
          {/* Check RESULT/SHOWDOWN first, before isUserTurn, to prevent stale turn state from blocking */}
          {(phase === GamePhase.RESULT || phase === GamePhase.SHOWDOWN) ? (
            <GameButton
              onClick={() => { playSound('card-deal'); onStartNewHand(); }}
              variant="light"
              size="pillXl"
              className="text-xl animate-pulse transform hover:scale-105 uppercase tracking-wider"
            >
              Play Again
            </GameButton>
          ) : isUserTurn ? (
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
                    <GameButton
                      onClick={() => {
                        const text = chatInput.trim();
                        if (!text) return;
                        playerSpeak(text);
                        setChatInput('');
                        setShowChatMenu(false);
                      }}
                      variant="warning"
                      size="pillSm"
                      className="text-xs"
                    >
                      送出
                    </GameButton>
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

              <GameButton
                onClick={() => setShowChatMenu(!showChatMenu)}
                variant="muted"
                size="squareSm"
                className="group flex flex-col items-center justify-center backdrop-blur-md"
              >
                <span className="mb-1 text-white/90 group-hover:scale-110 transition-transform">
                  <IconChat />
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Talk</span>
              </GameButton>

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
                      <RangeSlider
                        min={minBet}
                        max={maxRaise}
                        step={minBet}
                        value={customRaiseAmount}
                        onChange={(e) => setCustomRaiseAmount(parseInt(e.target.value, 10))}
                        className="w-full"
                      />
                    </>
                  ) : (
                    <div className="text-white/40 text-xs font-bold uppercase tracking-widest text-center py-2">
                      無法加注
                    </div>
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
                    <div className="text-white/40 text-xs font-bold uppercase tracking-widest text-center py-2">
                      固定限注模式
                    </div>
                  )
                )}
              </div>

              <GameButton
                onClick={() => { playSound('chip-fold'); onAction('FOLD'); }}
                variant="danger"
                size="squareLg"
                className="group flex flex-col items-center justify-center backdrop-blur-md"
              >
                <div className="mb-1 group-hover:scale-110 transition-transform">
                  <IconFlag />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">棄牌</span>
              </GameButton>

              <GameButton
                onClick={() => { playSound(callNeeded === 0 ? 'card-deal' : 'chip-place'); onAction(callNeeded === 0 ? 'CHECK' : 'CALL'); }}
                variant="success"
                size="squareLg"
                className="group flex flex-col items-center justify-center backdrop-blur-md"
              >
                <div className="mb-1 group-hover:scale-110 transition-transform">
                  {callNeeded === 0 ? <IconCheck /> : <IconCoin />}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">
                  {callNeeded === 0 ? '過牌' : `跟 $${callNeeded}`}
                </span>
              </GameButton>

              <GameButton
                onClick={() => { playSound('chip-place'); onAction('RAISE', raiseAmount); }}
                disabled={!canRaise}
                variant="warning"
                size="squareLg"
                className="group flex flex-col items-center justify-center backdrop-blur-md"
              >
                <div className="mb-1 group-hover:scale-110 transition-transform">
                  <IconTrendUp />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">加注</span>
              </GameButton>

              <GameButton
                onClick={() => { playSound('chip-allin'); onAction('ALL_IN'); }}
                variant="info"
                size="squareSm"
                className="group flex flex-col items-center justify-center backdrop-blur-md"
              >
                <span className="mb-1 text-purple-100 group-hover:scale-110 transition-transform">
                  <IconBolt />
                </span>
                <span className="text-[8px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">梭哈</span>
              </GameButton>
            </div>
          ) : (
            <PillPanel className="opacity-80 flex items-center gap-3">
              <div className="flex gap-1">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></div>
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce delay-200"></div>
              </div>
              <span className="text-white/40 font-bold uppercase tracking-widest text-xs whitespace-nowrap">
                Waiting for opponents
              </span>
            </PillPanel>
          )}

        </div>
      </div>
    </div>
  );
};

export default ShowdownControls;
