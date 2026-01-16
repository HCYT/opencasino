import React from 'react';
import { LOAN_AMOUNT } from '@/constants';
import { GameButton } from '@/components/ui/GameButton';

interface BalancePanelProps {
  displayedChips: number;
  displayedDebt: number;
  repayAmount: number;
  setRepayAmount: (amount: number) => void;
  handleLoan: () => void;
  handleRepay: () => void;
  resolveChips: () => void;
}

const BalancePanel: React.FC<BalancePanelProps> = ({
  displayedChips,
  displayedDebt,
  repayAmount,
  setRepayAmount,
  handleLoan,
  handleRepay,
  resolveChips
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
      <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-5 tracking-widest">
        真實餘額
      </label>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-emerald-500/10 border-2 border-emerald-500/30 rounded-2xl p-4 shadow-inner">
          <div className="text-[11px] text-emerald-200/60 uppercase tracking-widest font-medium mb-1">
            可用籌碼
          </div>
          <div className="text-3xl font-black text-emerald-300">
            ${(displayedChips ?? 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-red-500/10 border-2 border-red-500/30 rounded-2xl p-4 shadow-inner">
          <div className="text-[11px] text-red-200/60 uppercase tracking-widest font-medium mb-1">
            負債
          </div>
          <div className="text-3xl font-black text-red-300">
            ${(displayedDebt ?? 0).toLocaleString()}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <GameButton
          onClick={handleLoan}
          variant="success"
          size="pill"
          className="w-full text-base font-black border-2 border-emerald-500/50"
        >
          申請貸款 +${LOAN_AMOUNT.toLocaleString()}
        </GameButton>

        {displayedDebt > 0 && (
          <div className="flex gap-3">
            <input
              type="number"
              min={0}
              value={repayAmount}
              onChange={(e) => setRepayAmount(Number(e.target.value) || 0)}
              placeholder="償還金額"
              className="flex-1 bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl px-4 py-3 text-white text-sm font-bold focus:outline-none focus:border-amber-400 text-right"
            />
            <GameButton
              onClick={handleRepay}
              variant="warning"
              size="pill"
              className="text-sm font-black border-2 border-amber-500/50"
            >
              還款
            </GameButton>
          </div>
        )}
      </div>
    </div>
  );
};

export default BalancePanel;
