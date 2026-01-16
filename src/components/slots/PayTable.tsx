import React from 'react';
import { SlotSymbol, PAYOUT_MULTIPLIERS, SYMBOL_EMOJIS } from '../../services/slots/SlotRules';
import Panel from '../ui/Panel';

export const PayTable: React.FC = () => {
    return (
        <Panel variant="glass" className="p-4 md:p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md max-w-sm w-full">
            <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-center mb-4 text-sm md:text-base border-b border-white/10 pb-2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                Winning Combinations
            </h3>

            <div className="mb-6">
                <div className="text-xs text-white/50 mb-2 text-center uppercase font-bold">5 Winning Lines</div>
                <div className="grid grid-cols-5 gap-1">
                    {[
                        { name: '中間', active: [3, 4, 5] },
                        { name: '上方', active: [0, 1, 2] },
                        { name: '下方', active: [6, 7, 8] },
                        { name: '斜1', active: [0, 4, 8] },
                        { name: '斜2', active: [2, 4, 6] }
                    ].map((line, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                            <div className="grid grid-cols-3 gap-[2px] w-8 h-8 opacity-80">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className={`rounded-[1px] transition-all ${line.active.includes(i) ? 'bg-yellow-400 shadow-[0_0_3px_yellow] scale-110' : 'bg-white/10'}`} />
                                ))}
                            </div>
                            <span className="text-[9px] text-white/60 font-medium">{line.name}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {Object.values(SlotSymbol).map(symbol => (
                    <div key={symbol} className="flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent p-3 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-default group">
                        <div className="flex items-center gap-3">
                            <div className={`text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-125 transition-transform`}>
                                {SYMBOL_EMOJIS[symbol]}
                            </div>
                            <span className="text-xs md:text-sm font-medium text-white/70">x 3</span>
                        </div>
                        <div className="text-emerald-400 font-mono font-bold text-lg drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                            x{PAYOUT_MULTIPLIERS[symbol]}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 text-[10px] text-white/30 text-center border-t border-white/5 pt-3">
                🃏 Wild 可替代任何符號
            </div>
        </Panel>
    );
};
