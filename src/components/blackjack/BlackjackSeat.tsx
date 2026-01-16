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
  const { style, vertical, seatPosition } = getSeatLayout(seatIndex, player.id === 'player');

  const isActiveSeat = phase === 'PLAYING' && currentTurn?.playerIndex === seatIndex;

  const dealVars = (() => {
    switch (seatPosition) {
      case 'left':
        return { ['--deal-x' as const]: '160px', ['--deal-y' as const]: '0px' };
      case 'right':
        return { ['--deal-x' as const]: '-160px', ['--deal-y' as const]: '0px' };
      case 'top':
        return { ['--deal-x' as const]: '0px', ['--deal-y' as const]: '140px' };
      case 'bottom':
      default:
        return { ['--deal-x' as const]: '0px', ['--deal-y' as const]: '-140px' };
    }
  })();

  const cardsSection = (
    <div
      className="flex flex-col items-center justify-center min-h-[100px] md:min-h-[120px]"
      style={dealVars}
    >
      {player.hands.length === 0 ? (
        <div className="text-white/20 text-xs">等待發牌</div>
      ) : (
        <div className="space-y-3">
          {player.hands.map((hand, hIdx) => {
            const total = getHandValue(hand.cards).total;
            const isActiveHand =
              phase === 'PLAYING' &&
              currentTurn?.playerIndex === seatIndex &&
              currentTurn?.handIndex === hIdx;
            return (
              <div
                key={hand.id}
                className={`flex flex-col items-center gap-2 ${isActiveHand ? 'text-emerald-200' : 'text-white/60'}`}
              >
                <div className="flex items-center justify-center gap-2">
                  {hand.cards.map((card, cardIdx) => (
                    <CardUI
                      key={`${player.id}-${hIdx}-${card.rank}-${card.suit}-${cardIdx}`}
                      card={card}
                      className={`deal-card ${cardIdx > 0 ? '-ml-6 md:-ml-5' : ''}`}
                    />
                  ))}
                </div>
                <div className="text-[10px] uppercase tracking-widest font-black">
                  {renderHandStatus(hand, isActiveHand)} · {hand.cards.length > 0 ? total : 0}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const seatCard = (
    <PlayerSeatCard
      name={player.name}
      avatar={player.avatar}
      isAI={player.isAI}
      isActive={isActiveSeat}
      vertical={vertical}
      stat={{ value: `$ ${player.chips.toLocaleString()}`, label: '籌碼' }}
      quote={player.quote ? `「${player.quote}」` : undefined}
    />
  );

  return (
    <div className="absolute flex flex-col items-center gap-4" style={style}>
      {seatPosition === 'top' ? (
        <>
          {seatCard}
          {cardsSection}
        </>
      ) : (
        <>
          {cardsSection}
          {seatCard}
        </>
      )}
    </div>
  );
};

export default BlackjackSeat;
