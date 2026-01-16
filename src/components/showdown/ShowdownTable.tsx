import React from 'react';
import TableFrame from '../table/TableFrame';

interface ShowdownTableProps {
  title?: string;
  statusText: string;
  pot: number;
  children?: React.ReactNode;
}

const ShowdownTable: React.FC<ShowdownTableProps> = ({ title, statusText, pot, children }) => {
  return (
    <TableFrame title={title} statusText={statusText} overlay={children}>
      <div className="text-center z-10 scale-110">
        <div className="text-yellow-500/40 font-black text-[10px] tracking-[0.5em] casino-font uppercase mb-1">Total Pool</div>
        <div className="text-7xl font-black text-white mb-3 drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)] flex items-center gap-2 justify-center">
          <span className="text-emerald-400">💵</span> ${pot.toLocaleString()}
        </div>
        <div className="flex gap-1.5 justify-center">
          {[...Array(Math.min(20, Math.max(1, Math.ceil(pot / 2000))))].map((_, i) => (
            <div key={i} className="w-10 h-2 bg-yellow-500/80 rounded-full shadow-lg border-b-2 border-amber-700"></div>
          ))}
        </div>
      </div>
    </TableFrame>
  );
};

export default ShowdownTable;
