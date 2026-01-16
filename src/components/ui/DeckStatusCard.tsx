import React from 'react';

type DeckStatusCardProps = {
  deckCount: number;
  cutCardOwner: string;
  rollSummary: string;
  shufflePending: boolean;
};

const DeckStatusCard: React.FC<DeckStatusCardProps> = ({
  deckCount,
  cutCardOwner,
  rollSummary,
  shufflePending
}) => {
  return (
    <div className="absolute right-12 top-12 flex flex-col items-center gap-2 text-white/70">
      <div className="relative w-20 h-28 bg-black/70 border border-white/20 rounded-xl shadow-xl">
        <div className="absolute inset-2 border border-white/10 rounded-lg"></div>
        <div className={`absolute left-2 right-2 h-1 rounded ${shufflePending ? 'bg-red-500' : 'bg-amber-400'} top-3`}></div>
        <div className="absolute inset-3 border border-white/5 rounded-md"></div>
      </div>
      <div className="text-[10px] uppercase tracking-widest text-white/60">牌靴</div>
      <div className="text-[10px] text-amber-200 font-black">剩餘 {deckCount}</div>
      <div className="text-[10px] text-white/50">插牌：{cutCardOwner || '未知'}</div>
      {rollSummary && (
        <div className="text-[9px] text-white/30 max-w-[160px] text-center leading-snug">
          擲骰 {rollSummary}
        </div>
      )}
      {shufflePending && (
        <div className="text-[9px] text-red-300 font-black">切牌已到</div>
      )}
    </div>
  );
};

export default DeckStatusCard;
