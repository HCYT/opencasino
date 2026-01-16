import React from 'react';
import QuoteBubble from './QuoteBubble';

type SeatStat = {
  value: string;
  label: string;
};

type SeatLine = {
  text: string;
  className?: string;
};

type PlayerSeatCardProps = {
  name: string;
  avatar: string;
  isAI: boolean;
  isActive: boolean;
  vertical?: boolean;
  stat: SeatStat;
  quote?: string;
  lines?: SeatLine[];
  children?: React.ReactNode;
};

const PlayerSeatCard: React.FC<PlayerSeatCardProps> = ({
  name,
  avatar,
  isAI,
  isActive,
  vertical,
  stat,
  quote,
  lines = [],
  children
}) => {
  return (
    <div
      className={`bg-black/70 border ${isActive ? 'border-emerald-400/60' : 'border-white/10'} rounded-[24px] px-5 py-4 shadow-2xl min-w-[220px] max-w-[260px] ${vertical ? 'scale-95' : ''}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <img src={avatar} alt={name} className="w-12 h-12 rounded-full border-2 border-yellow-400/40 object-cover" />
          <div>
            <div className="text-lg font-black text-white truncate whitespace-nowrap max-w-[120px]">
              {name}
            </div>
            <div className="text-[10px] text-white/40 uppercase tracking-widest">{isAI ? 'NPC' : '玩家'}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-emerald-300 font-black text-lg">{stat.value}</div>
          <div className="text-[10px] text-white/40 uppercase tracking-widest">{stat.label}</div>
        </div>
      </div>
      {quote && <QuoteBubble text={quote} className="mt-3" />}
      {lines.map((line, index) => (
        <div key={`${line.text}-${index}`} className={`mt-2 text-xs font-black uppercase tracking-widest ${line.className ?? 'text-white/60'}`}>
          {line.text}
        </div>
      ))}
      {children}
    </div>
  );
};

export default PlayerSeatCard;
