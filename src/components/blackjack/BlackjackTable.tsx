import React from 'react';
import { Card } from '../../types';
import CardUI from '../CardUI';
import { tableStyles } from '../ui/sharedStyles';

interface BlackjackTableProps {
  statusText: string;
  dealerCards: Card[];
  dealerTotal: number;
  cutRollPending: boolean;
  onRollCutCard: () => void;
  shufflePending: boolean;
  deckCount: number;
  cutCardOwner: string;
  rollSummary: string;
  children?: React.ReactNode;
}

const BlackjackTable: React.FC<BlackjackTableProps> = ({
  statusText,
  dealerCards,
  dealerTotal,
  cutRollPending,
  onRollCutCard,
  shufflePending,
  deckCount,
  cutCardOwner,
  rollSummary,
  children
}) => {
  return (
    <div className={tableStyles.wrapper}>
      <div className={tableStyles.frame}>
        <div className={tableStyles.surface}>
          <div className={tableStyles.innerBorder}></div>

          <div className={tableStyles.title}>慈善撲克王大賽 · 21 點公開賽</div>

          <div className={tableStyles.statusWrap}>
            <div className={tableStyles.statusBadge}>
              <div className={tableStyles.statusDot}></div>
              <span className={tableStyles.statusText}>
                {statusText}
              </span>
            </div>
          </div>

          {cutRollPending && (
            <div className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-auto">
              <div className="bg-black/80 border border-yellow-500/40 rounded-[28px] px-8 py-6 shadow-2xl text-center space-y-4">
                <div className="text-yellow-300 font-black text-lg tracking-widest">擲骰決定插牌者</div>
                <div className="text-white/50 text-xs uppercase tracking-[0.3em]">21 點牌靴重設</div>
                <button
                  onClick={onRollCutCard}
                  className="bg-gradient-to-b from-yellow-400 to-amber-600 text-slate-900 font-black px-10 py-4 rounded-2xl text-lg shadow-xl hover:brightness-110"
                >
                  擲骰
                </button>
              </div>
            </div>
          )}

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

          <div className="text-center z-10">
            <div className="text-yellow-500/40 font-black text-[10px] tracking-[0.5em] casino-font uppercase mb-2">Dealer</div>
            <div className="flex items-center justify-center gap-3 mb-3">
              {dealerCards.length === 0 ? (
                <div className="text-white/20 text-sm">等待發牌</div>
              ) : (
                dealerCards.map((card, idx) => (
                  <CardUI key={`${card.rank}-${card.suit}-${idx}`} card={card} hidden className="deal-card" />
                ))
              )}
            </div>
            <div className="text-4xl font-black text-white flex items-center gap-2 justify-center">
              <span className="text-emerald-400">🎲</span> {dealerTotal || 0}
            </div>
          </div>
        </div>
      </div>

      <div className={tableStyles.childrenWrap}>
        {children}
      </div>
    </div>
  );
};

export default BlackjackTable;
