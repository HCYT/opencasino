import React from 'react';

interface ShowdownTableProps {
  statusText: string;
  pot: number;
  children?: React.ReactNode;
}

const ShowdownTable: React.FC<ShowdownTableProps> = ({ statusText, pot, children }) => {
  return (
    <div className="table-area relative w-full h-full">
      <div className="absolute inset-8 rounded-[120px] border-[20px] border-[#3d2414] shadow-[inset_0_0_120px_rgba(0,0,0,0.9),0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden">
        <div className="w-full h-full bg-[#0a4a27] relative flex items-center justify-center">
          <div className="absolute inset-20 border-[2px] border-white/5 rounded-[80px]"></div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-48 z-[40]">
            <div className="bg-black/60 backdrop-blur-xl px-10 py-3 rounded-full border border-yellow-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
              <span className="text-yellow-400 font-black tracking-widest text-lg uppercase whitespace-nowrap drop-shadow-md">
                {statusText}
              </span>
            </div>
          </div>

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
        </div>
      </div>

      <div className="absolute inset-0 p-12 pointer-events-none">
        {children}
      </div>
    </div>
  );
};

export default ShowdownTable;
