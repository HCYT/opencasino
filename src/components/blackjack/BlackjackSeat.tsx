import React from 'react';
import CardUI from '../CardUI';
import { BlackjackHand, BlackjackPlayer, BlackjackPhase, TurnRef } from '../../services/blackjack/types';
import { getHandValue } from '../../services/blackjack/rules';

interface BlackjackSeatProps {
  player: BlackjackPlayer;
  seatIndex: number;
  phase: BlackjackPhase;
  currentTurn: TurnRef | null;
  renderHandStatus: (hand: BlackjackHand, isActive: boolean) => string;
}

const BlackjackSeat: React.FC<BlackjackSeatProps> = ({
  player,
  seatIndex,
  phase,
  currentTurn,
  renderHandStatus
}) => {
  let style: React.CSSProperties = {};
  let vertical = false;

  if (player.id === 'player') {
    style = { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' };
  } else if (seatIndex === 1) {
    style = { left: '4rem', top: '50%', transform: 'translateY(-50%)' };
    vertical = true;
  } else if (seatIndex === 2) {
    style = { top: '3rem', left: '50%', transform: 'translateX(-50%)' };
  } else {
    style = { right: '4rem', top: '50%', transform: 'translateY(-50%)' };
    vertical = true;
  }

  const isActiveSeat = phase === 'PLAYING' && currentTurn?.playerIndex === seatIndex;

  return (
    <div className="absolute flex flex-col items-center" style={style}>
      <div className={`bg-black/70 border ${isActiveSeat ? 'border-emerald-400/60' : 'border-white/10'} rounded-[24px] px-5 py-4 shadow-2xl min-w-[220px] max-w-[260px] ${vertical ? 'scale-95' : ''}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img src={player.avatar} alt={player.name} className="w-12 h-12 rounded-full border-2 border-yellow-400/40 object-cover" />
            <div>
              <div className="text-lg font-black text-white">{player.name}</div>
              <div className="text-[10px] text-white/40 uppercase tracking-widest">{player.isAI ? 'NPC' : '玩家'}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-emerald-300 font-black text-lg">$ {player.chips.toLocaleString()}</div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">籌碼</div>
          </div>
        </div>

        {player.hands.length === 0 ? (
          <div className="text-white/20 text-xs mt-3">等待發牌</div>
        ) : (
          <div className="mt-3 space-y-2">
            {player.hands.map((hand, hIdx) => {
              const total = getHandValue(hand.cards).total;
              const isActiveHand =
                phase === 'PLAYING' &&
                currentTurn?.playerIndex === seatIndex &&
                currentTurn?.handIndex === hIdx;
              return (
                <div
                  key={hand.id}
                  className={`rounded-2xl border ${isActiveHand ? 'border-emerald-400/60' : 'border-white/10'} bg-black/40 p-3 space-y-2`}
                  style={(() => {
                    switch (seatIndex) {
                      case 1:
                        return { ['--deal-x' as const]: '160px', ['--deal-y' as const]: '0px' };
                      case 2:
                        return { ['--deal-x' as const]: '0px', ['--deal-y' as const]: '140px' };
                      case 3:
                        return { ['--deal-x' as const]: '-160px', ['--deal-y' as const]: '0px' };
                      default:
                        return { ['--deal-x' as const]: '0px', ['--deal-y' as const]: '-140px' };
                    }
                  })()}
                >
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/40">
                    <span>手牌 {hIdx + 1}</span>
                    <span className="text-yellow-300 font-black">$ {hand.bet.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/40">
                    <span>狀態</span>
                    <span className={`font-black ${isActiveHand ? 'text-emerald-300' : 'text-white/60'}`}>
                      {renderHandStatus(hand, isActiveHand)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs uppercase tracking-widest text-white/40">
                    <span>點數</span>
                    <span className="text-emerald-200 font-black">{hand.cards.length > 0 ? total : 0}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {hand.cards.map((card, cardIdx) => (
                      <CardUI key={`${player.id}-${hIdx}-${card.rank}-${card.suit}-${cardIdx}`} card={card} className="deal-card" />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {player.quote && (
          <div className="mt-3 text-[10px] text-amber-200 font-black bg-black/40 px-3 py-2 rounded-2xl border border-white/10">
            「{player.quote}」
          </div>
        )}
      </div>
    </div>
  );
};

export default BlackjackSeat;
