import React from 'react';
import { BlackjackPhase } from '../../services/blackjack/types';
import { getHandValue } from '../../services/blackjack/rules';
import { BlackjackHand, BlackjackPlayer } from '../../services/blackjack/types';
import { GameButton } from '../ui/GameButton';
import StatusPanel from '../ui/StatusPanel';
import {
  bottomDock,
  bottomDockInnerFlex,
  stackCardBase,
  stackLabel,
  stackValueLg
} from '../ui/sharedStyles';

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
    <div className={bottomDock}>
      <div className={bottomDockInnerFlex}>
        <div className="flex flex-row items-end gap-3 pointer-events-auto">
          <div className={`${stackCardBase} min-w-[200px]`}>
            <div className={stackLabel}>
              <span>My Stack</span>
              {isPlayerTurn && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>}
            </div>
            <div className={stackValueLg}>
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
              <StatusPanel className="border-white/5">
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
              </StatusPanel>
              <GameButton
                onClick={onStartHand}
                disabled={!canBet}
                variant="primary"
                size="pillLg"
                className="text-xl"
              >
                發牌
              </GameButton>
            </div>
          )}

          {phase === 'PLAYING' && (
            <div className="flex items-end gap-3">
              {isPlayerTurn ? (
                <div className={`flex items-end ${canSplitHand ? 'gap-2' : 'gap-3'}`}>
                  <GameButton
                    onClick={onHit}
                    variant="success"
                    size="squareMd"
                    className="uppercase tracking-widest"
                  >
                    要牌
                  </GameButton>
                  <GameButton
                    onClick={onStand}
                    variant="danger"
                    size="squareMd"
                    className="uppercase tracking-widest"
                  >
                    停牌
                  </GameButton>
                  {canSplitHand && (
                    <GameButton
                      onClick={onSplit}
                      variant="info"
                      size="squareMd"
                      className="uppercase tracking-widest"
                    >
                      分牌
                    </GameButton>
                  )}
                </div>
              ) : (
                <StatusPanel>NPC 行動中</StatusPanel>
              )}
            </div>
          )}

          {phase === 'DEALER' && (
            <StatusPanel>莊家補牌中</StatusPanel>
          )}

          {phase === 'RESULT' && (
            <div className="flex items-end gap-3">
              <StatusPanel className="text-yellow-300">{message || '本局結束'}</StatusPanel>
              <GameButton
                onClick={onReset}
                variant="light"
                size="pillLg"
              >
                下一局
              </GameButton>
            </div>
          )}

          <GameButton
            onClick={onExit}
            variant="ghost"
            size="pill"
            className="ml-4 uppercase tracking-widest"
          >
            返回大廳
          </GameButton>
        </div>
      </div>
    </div>
  );
};

export default BlackjackControls;
