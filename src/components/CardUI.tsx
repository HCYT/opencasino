
import React from 'react';
import { Card } from '../types';

interface CardUIProps {
  card: Card;
  hidden?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const CardUI: React.FC<CardUIProps> = ({ card, hidden = false, className = '', style }) => {
  const getSuitColor = (suit: string) => {
    return (suit === 'Hearts' || suit === 'Diamonds') ? 'text-red-600' : 'text-slate-900';
  };

  const getSuitIcon = (suit: string) => {
    switch (suit) {
      case 'Spades': return '♠';
      case 'Hearts': return '♥';
      case 'Diamonds': return '♦';
      case 'Clubs': return '♣';
      default: return '';
    }
  };

  if (hidden && !card.isFaceUp) {
    return (
      <div
        className={`w-16 h-24 md:w-20 md:h-28 rounded-lg shadow-xl card-back flex items-center justify-center border-white border-2 ${className}`}
        style={style}
      >
        <div className="text-white/20 text-4xl font-bold opacity-30">?</div>
      </div>
    );
  }

  return (
    <div
      className={`w-16 h-24 md:w-20 md:h-28 rounded-lg shadow-xl bg-white border-2 border-slate-200 flex flex-col p-1 transition-all duration-300 transform hover:-translate-y-1 ${className}`}
      style={style}
    >
      <div className={`text-lg font-bold flex justify-between leading-none ${getSuitColor(card.suit)}`}>
        <span>{card.rank}</span>
        <span>{getSuitIcon(card.suit)}</span>
      </div>
      <div className={`flex-grow flex items-center justify-center text-4xl md:text-5xl ${getSuitColor(card.suit)}`}>
        {getSuitIcon(card.suit)}
      </div>
      <div className={`text-lg font-bold flex justify-between leading-none rotate-180 ${getSuitColor(card.suit)}`}>
        <span>{card.rank}</span>
        <span>{getSuitIcon(card.suit)}</span>
      </div>
    </div>
  );
};

export default CardUI;
