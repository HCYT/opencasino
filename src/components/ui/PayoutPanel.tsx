import React from 'react';

type PayoutLine = {
  name: string;
  remaining: number;
  amount: number;
};

type PayoutPanelProps = {
  baseBet: number;
  winnerName: string;
  totalGain: number;
  winnerMultipliers?: string[];
  lines: PayoutLine[];
  className?: string;
};

const PayoutPanel: React.FC<PayoutPanelProps> = ({
  baseBet,
  winnerName,
  totalGain,
  winnerMultipliers = [],
  lines,
  className = ''
}) => {
  return (
    <div className={`mt-8 bg-black/60 border border-white/10 rounded-[2rem] px-6 py-5 max-w-[720px] mx-auto text-left ${className}`}>
      <div className="text-emerald-200 font-black text-sm uppercase tracking-widest">
        結算金額（每張 ${baseBet.toLocaleString()}）
      </div>
      <div className="text-yellow-300 font-black text-xl mt-2">
        {winnerName} 獲得 +${totalGain.toLocaleString()}
      </div>
      {winnerMultipliers.length > 0 && (
        <div className="text-[11px] text-white/50 font-black uppercase tracking-widest mt-2">
          {winnerMultipliers.join(' · ')}
        </div>
      )}
      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
        {lines.map(line => (
          <div key={line.name} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
            <div className="text-white/80 font-black text-sm">{line.name}</div>
            <div className="text-xs text-white/50">剩 {line.remaining} 張</div>
            <div className="text-red-300 font-black text-sm">-${line.amount.toLocaleString()}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PayoutPanel;
