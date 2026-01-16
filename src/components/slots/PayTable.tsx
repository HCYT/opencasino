import React from 'react';
import { SlotSymbol, SYMBOL_VALUES } from '../../services/slots/SlotRules';
import Panel from '../ui/Panel';

const SYMBOL_EMOJIS: Record<SlotSymbol, string> = {
    [SlotSymbol.WILD]: '🃏',
    [SlotSymbol.SEVEN]: '7️⃣',
    [SlotSymbol.BAR]: '💎',
    [SlotSymbol.BELL]: '🔔',
    [SlotSymbol.GRAPE]: '🍇',
    [SlotSymbol.ORANGE]: '🍊',
    [SlotSymbol.CHERRY]: '🍒',
    [SlotSymbol.LEMON]: '🍋'
};

const PAYOUT_MULTIPLIERS: Record<SlotSymbol, number> = {
    [SlotSymbol.WILD]: 500,
    [SlotSymbol.SEVEN]: 2500, // 500 * 5 from code logic
    [SlotSymbol.BAR]: 250,
    [SlotSymbol.BELL]: 100,
    [SlotSymbol.GRAPE]: 75,
    [SlotSymbol.ORANGE]: 50,
    [SlotSymbol.CHERRY]: 25,
    [SlotSymbol.LEMON]: 10
};

export const PayTable: React.FC = () => {
    return (
        <Panel variant="glass" className="p-4 md:p-6 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md max-w-sm w-full">
            <h3 className="text-yellow-500 font-bold uppercase tracking-widest text-center mb-4 text-sm md:text-base border-b border-white/10 pb-2">
                Winning Combinations
            </h3>

            {/* Paylines Diagram */}
            <div className="mb-6">
                <div className="text-xs text-white/50 mb-2 text-center uppercase">5 Winning Lines</div>
                <div className="grid grid-cols-5 gap-1">
                    {[
                        { name: 'Middle', active: [3, 4, 5] },
                        { name: 'Top', active: [0, 1, 2] },
                        { name: 'Bottom', active: [6, 7, 8] },
                        { name: 'Diag 1', active: [0, 4, 8] },
                        { name: 'Diag 2', active: [2, 4, 6] }
                    ].map((line, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1">
                            <div className="grid grid-cols-3 gap-[2px] w-8 h-8 opacity-80">
                                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                    <div key={i} className={`rounded-[1px] ${line.active.includes(i) ? 'bg-yellow-400 shadow-[0_0_2px_yellow]' : 'bg-white/10'}`} />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Payouts */}
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                {Object.values(SlotSymbol).map(symbol => (
                    <div key={symbol} className="flex items-center justify-between bg-white/5 p-2 rounded-lg border border-white/5 hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl filter drop-shadow-md">{SYMBOL_EMOJIS[symbol]}</span>
                            <span className="text-xs md:text-sm font-medium text-white/70">x 3</span>
                        </div>
                        <div className="text-emerald-400 font-mono font-bold">
                            x{PAYOUT_MULTIPLIERS[symbol]}
                        </div>
                    </div>
                ))}

            </div>

            <div className="mt-4 text-[10px] text-white/30 text-center">
                * Wild (🃏) substitutes for any symbol.
            </div>
        </Panel>
    );
};
