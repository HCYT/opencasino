import React from 'react';
import QuoteBubble from './QuoteBubble';
import {
  seatCardActiveBorder,
  seatCardAvatar,
  seatCardBase,
  seatCardInactiveBorder,
  seatCardLine,
  seatCardMeta,
  seatCardName,
  seatCardStatValue,
  seatCardVertical
} from './sharedStyles';

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
      className={`${seatCardBase} ${isActive ? seatCardActiveBorder : seatCardInactiveBorder} ${vertical ? seatCardVertical : ''}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <img src={avatar} alt={name} className={seatCardAvatar} />
          <div>
            <div className={seatCardName}>
              {name}
            </div>
            <div className={seatCardMeta}>{isAI ? 'NPC' : '玩家'}</div>
            <div className={seatCardStatValue}>{stat.value}</div>
            <div className={seatCardMeta}>{stat.label}</div>
          </div>
        </div>
      </div>
      {quote && <QuoteBubble text={quote} className="mt-3" />}
      {lines.map((line, index) => (
        <div key={`${line.text}-${index}`} className={`${seatCardLine} ${line.className ?? 'text-white/60'}`}>
          {line.text}
        </div>
      ))}
      {children}
    </div>
  );
};

export default PlayerSeatCard;
