import React from 'react';
import { Card } from '../../types';
import CardUI from '../CardUI';
import TableFrame from '../table/TableFrame';
import DeckStatusCard from '../ui/DeckStatusCard';
import RollPrompt from '../ui/RollPrompt';

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
    <TableFrame title="慈善撲克王大賽 · 21 點公開賽" statusText={statusText} overlay={children}>
      {cutRollPending && (
        <div className="absolute inset-0 z-[70] flex items-center justify-center pointer-events-auto">
          <RollPrompt onRoll={onRollCutCard} />
        </div>
      )}
      <DeckStatusCard
        deckCount={deckCount}
        cutCardOwner={cutCardOwner}
        rollSummary={rollSummary}
        shufflePending={shufflePending}
      />

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
    </TableFrame>
  );
};

export default BlackjackTable;
