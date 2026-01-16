import React from 'react';
import CardUI from '../CardUI';
import PlayerSeatCard from '../ui/PlayerSeatCard';
import { GamePhase, Player } from '../../types';

interface ShowdownSeatProps {
  player: Player;
  isActive: boolean;
  isWinner: boolean;
  phase: GamePhase;
  vertical?: boolean;
  isMe?: boolean;
  seatPosition?: 'left' | 'right' | 'top' | 'bottom';
}

const ShowdownSeat: React.FC<ShowdownSeatProps> = ({
  player,
  isActive,
  isWinner,
  phase,
  vertical,
  isMe,
  seatPosition
}) => {
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

  return (
    <div className={`flex flex-col items-center gap-4 pointer-events-auto transition-all duration-700 ${player.isFolded ? 'opacity-20 grayscale scale-90' : 'opacity-100 scale-100'} relative`}>
      <PlayerSeatCard
        name={player.name}
        avatar={player.avatar}
        isAI={player.isAI}
        isActive={isActive}
        vertical={vertical}
        stat={{ value: `$ ${player.chips.toLocaleString()}`, label: '籌碼' }}
        quote={player.currentQuote}
        lines={[
          ...(player.chips === 0 && !player.isFolded
            ? [{ text: 'ALL-IN', className: 'text-red-300' }]
            : []),
          ...(player.currentBet > 0
            ? [{ text: `下注 $ ${player.currentBet}`, className: 'text-emerald-300' }]
            : []),
          ...(player.lastAction && !isActive
            ? [{ text: player.lastAction, className: 'text-yellow-300' }]
            : [])
        ]}
      />

      <div
        className="flex flex-row justify-center min-h-[100px] md:min-h-[120px] items-center"
        style={dealVars}
      >
        {player.cards.map((c, i) => {
          const isHidden = !isMe && i === 0 && phase !== GamePhase.SHOWDOWN && phase !== GamePhase.RESULT;
          return (
            <CardUI
              key={i}
              card={c}
              hidden={isHidden}
              className={`deal-card ${i > 0 ? '-ml-6 md:-ml-5' : ''}`}
              style={{ zIndex: i + 1 }}
            />
          );
        })}
      </div>

      {isWinner && phase === GamePhase.RESULT && (
        <div className="absolute -top-12 text-xs font-black text-yellow-400">WINNER</div>
      )}
    </div>
  );
};

export default ShowdownSeat;
