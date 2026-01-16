import React from 'react';
import { evaluateHand } from '../../services/pokerLogic';
import CardUI from '../CardUI';
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
  const cardsForStrength = (isMe || phase === GamePhase.SHOWDOWN || phase === GamePhase.RESULT)
    ? player.cards
    : player.cards.filter(c => c.isFaceUp);

  const handEval = evaluateHand(cardsForStrength);
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
    <div className={`flex ${vertical ? 'flex-row items-center gap-10' : (isMe ? 'flex-col-reverse items-center gap-3' : 'flex-col items-center gap-4')} pointer-events-auto transition-all duration-700 ${player.isFolded ? 'opacity-20 grayscale scale-90' : 'opacity-100 scale-100'} relative`}>
      {player.currentQuote && (
        <div className={`absolute z-[100] ${isMe ? '-top-24' : (vertical ? '-top-20' : 'top-24')} whitespace-normal break-words bg-white text-black font-black px-6 py-4 rounded-[2rem] rounded-bl-none shadow-[0_10px_40px_rgba(0,0,0,0.5)] animate-in zoom-in slide-in-from-bottom-4 duration-300 max-w-[240px] md:max-w-[320px] text-center border-4 border-black box-border bubble-arrow`}>
          <span className="text-sm md:text-lg leading-tight block">{player.currentQuote}</span>
        </div>
      )}

      <div className={`relative flex flex-col items-center p-3 md:p-4 rounded-[40px] border-2 shadow-2xl transition-all duration-500 ${isActive ? 'bg-yellow-500/30 border-yellow-400 scale-105 shadow-[0_0_40px_rgba(234,179,8,0.5)]' : 'bg-black/60 border-white/10'} min-w-[140px] md:min-w-[160px]`}>
        <div className="relative mb-2 group">
          <img src={player.avatar} alt={player.name} className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white/10 object-cover shadow-2xl group-hover:border-yellow-500 transition-colors" />
          {(player.chips === 0 && !player.isFolded) && (
            <div className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full border border-white/20 shadow-lg">ALL-IN</div>
          )}
          {isActive && <div className="absolute inset-0 rounded-full border-4 border-yellow-500 animate-ping opacity-40"></div>}
        </div>
        <div className="text-white font-black text-sm md:text-base truncate w-full text-center tracking-tight mb-1 drop-shadow-md">{player.name}</div>
        <div className="text-yellow-500 font-mono font-black text-lg md:text-xl tracking-tighter flex items-center gap-1">
          <span className="text-emerald-400 text-sm md:text-base">💵</span> ${player.chips.toLocaleString()}
        </div>

        {player.currentBet > 0 && (
          <div className="absolute -top-6 -right-10 bg-emerald-600 text-white font-black text-[10px] md:text-[11px] px-4 py-1.5 rounded-2xl border border-emerald-400/40 shadow-2xl transform rotate-12 animate-in zoom-in flex items-center gap-1">
            <span className="text-xs">🪙</span> ${player.currentBet}
          </div>
        )}

        {player.lastAction && !isActive && (
          <div className="absolute -bottom-6 bg-white text-slate-900 font-black px-6 py-2 rounded-full text-[10px] shadow-2xl border-2 border-slate-200 animate-in bounce-in duration-500 uppercase tracking-widest">
            {player.lastAction}
          </div>
        )}
      </div>

      <div
        className={`flex gap-2 ${vertical ? 'flex-col' : 'flex-row justify-center'} min-h-[100px] md:min-h-[120px] items-center`}
        style={dealVars}
      >
        {player.cards.map((c, i) => {
          const isHidden = !isMe && i === 0 && phase !== GamePhase.SHOWDOWN && phase !== GamePhase.RESULT;
          return <CardUI key={i} card={c} hidden={isHidden} className="deal-card" />;
        })}
      </div>

      {!player.isFolded && player.cards.length >= 2 && (
        <div className="text-[11px] md:text-[12px] font-black bg-emerald-950/90 text-emerald-400 px-6 py-1.5 rounded-full border-2 border-emerald-500/40 shadow-[0_15px_30px_rgba(0,0,0,0.6)] backdrop-blur-md tracking-[0.2em] uppercase">
          {handEval.label}
        </div>
      )}

      {isWinner && phase === GamePhase.RESULT && (
        <div className="absolute -top-12 text-xs font-black text-yellow-400">WINNER</div>
      )}
    </div>
  );
};

export default ShowdownSeat;
