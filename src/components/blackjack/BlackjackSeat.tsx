import React from 'react';
import CardUI from '../CardUI';
import { getSeatLayout } from '../ui/seatLayout';
import PlayerSeatCard from '../ui/PlayerSeatCard';
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
  const { style, vertical } = getSeatLayout(seatIndex, player.id === 'player');

  const isActiveSeat = phase === 'PLAYING' && currentTurn?.playerIndex === seatIndex;

  return (
    <div className="absolute flex flex-col items-center" style={style}>
      <PlayerSeatCard
        name={player.name}
        avatar={player.avatar}
        isAI={player.isAI}
        isActive={isActiveSeat}
        vertical={vertical}
        stat={{ value: `$ ${player.chips.toLocaleString()}`, label: '籌碼' }}
        quote={player.quote ? `「${player.quote}」` : undefined}
      >
        {player.hands.length === 0 ? (
          <div className="text-white/20 text-xs mt-3">等待發牌</div>
        ) : (
          <div className="mt-3 space-y-2">
            {player.hands.map((hand, hIdx) => {
              const total = getHandValue(hand.cards).total;
              const cardCount = hand.cards.length;
              const cardSizeClass =
                cardCount >= 6
                  ? 'w-12 h-16 md:w-14 md:h-20'
                  : cardCount >= 4
                    ? 'w-14 h-20 md:w-16 md:h-24'
                    : '';
              const cardGapClass = cardCount >= 6 ? 'gap-1' : 'gap-2';
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
                  <div className={`flex flex-nowrap ${cardGapClass} overflow-x-auto pr-1 no-scrollbar`}>
                    {hand.cards.map((card, cardIdx) => (
                      <CardUI
                        key={`${player.id}-${hIdx}-${card.rank}-${card.suit}-${cardIdx}`}
                        card={card}
                        className={`deal-card ${cardSizeClass}`}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PlayerSeatCard>
    </div>
  );
};

export default BlackjackSeat;
