import React from 'react';
import { SlotSymbol, PAYOUT_3_OF_KIND, PAYOUT_2_OF_KIND, SYMBOL_EMOJIS } from '../../services/slots/SlotRules';
import Panel from '../ui/Panel';

export const PayTable: React.FC = () => {
    // Order symbols by value (highest to lowest)
    const orderedSymbols: SlotSymbol[] = [
        SlotSymbol.WILD,
        SlotSymbol.SCATTER,
        SlotSymbol.BAR,
        SlotSymbol.BELL,
        SlotSymbol.GRAPE,
        SlotSymbol.ORANGE,
        SlotSymbol.CHERRY,
        SlotSymbol.LEMON
    ];

    return (
        <Panel variant="glass" className="p-6 rounded-[2.5rem] border border-white/10 bg-slate-900/40 backdrop-blur-xl w-full h-full flex flex-col shadow-2xl">
            <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-center mb-4 text-sm md:text-base border-b border-white/10 pb-2 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]">
                Winning Combinations
            </h3>

            {/* Paylines Visualization */}
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

            {/* Symbol Payouts */}
            <div className="space-y-2 pr-2 overflow-y-auto flex-1">
                {orderedSymbols.map(symbol => (
                    <div key={symbol} className="flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent p-3 rounded-xl border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-default group">
                        <div className="flex items-center gap-3">
                            <div className={`text-2xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] group-hover:scale-125 transition-transform`}>
                                {SYMBOL_EMOJIS[symbol]}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs md:text-sm font-medium text-white/70">×3</span>
                                {PAYOUT_2_OF_KIND[symbol] && (
                                    <span className="text-[10px] text-white/40">×2</span>
                                )}
                            </div>
                        </div>
                        <div className="flex flex-col items-end">
                            <div className="text-emerald-400 font-mono font-bold text-lg drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]">
                                ×{PAYOUT_3_OF_KIND[symbol]}
                            </div>
                            {PAYOUT_2_OF_KIND[symbol] && (
                                <div className="text-emerald-400/60 font-mono text-xs">
                                    ×{PAYOUT_2_OF_KIND[symbol]}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Special Features */}
            <div className="mt-4 space-y-2">
                <div className="flex items-center justify-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
                    <span className="text-2xl filter drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">🃏</span>
                    <div className="flex flex-col text-left">
                        <span className="text-purple-300 font-black text-xs uppercase tracking-wider">Wild Card</span>
                        <span className="text-[10px] text-purple-200/50">替代任意符號（SCATTER 除外）</span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3">
                    <span className="text-2xl filter drop-shadow-[0_0_5px_rgba(234,179,8,0.5)]">⭐</span>
                    <div className="flex flex-col text-left">
                        <span className="text-yellow-300 font-black text-xs uppercase tracking-wider">Scatter</span>
                        <span className="text-[10px] text-yellow-200/50">3個以上觸發免費旋轉</span>
                    </div>
                </div>
            </div>
        </Panel>
    );
};
