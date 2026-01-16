import React, { useEffect, useState } from 'react';
import { SlotSymbol, SYMBOL_EMOJIS, SYMBOL_COLORS } from '../../services/slots/SlotRules';

interface ReelProps {
    symbol: SlotSymbol;
    isSpinning: boolean;
    stopDelay: number;
    isWinning?: boolean;
}

const BLUR_STRIP = [
    SlotSymbol.SEVEN, SlotSymbol.CHERRY, SlotSymbol.BAR, SlotSymbol.GRAPE,
    SlotSymbol.BELL, SlotSymbol.LEMON, SlotSymbol.ORANGE, SlotSymbol.WILD
];

export const Reel: React.FC<ReelProps> = ({ symbol, isSpinning, stopDelay, isWinning }) => {
    const [internalSpinning, setInternalSpinning] = useState(false);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        if (isSpinning) {
            setInternalSpinning(true);
            setShowResult(false);
        } else {
            const timer = setTimeout(() => {
                setInternalSpinning(false);
                setShowResult(true);
            }, stopDelay);
            return () => clearTimeout(timer);
        }
    }, [isSpinning, stopDelay]);

    const symbolStyle = SYMBOL_COLORS[symbol];

    return (
        <div className={`
            relative w-20 h-28 md:w-28 md:h-36 overflow-hidden
            rounded-2xl border-[3px] transition-all duration-300 transform
            shadow-[inset_0_2px_8px_rgba(0,0,0,0.8),_0_2px_5px_rgba(0,0,0,0.5)]
            ${internalSpinning ? 'bg-slate-900 border-slate-700' : `${symbolStyle.bg} ${symbolStyle.border}`}
            ${!internalSpinning && 'scale-100'}
            ${isWinning && !internalSpinning ? 'animate-win-pulse z-20 ring-4 ring-yellow-400/50' : 'z-10'}
            ${symbolStyle.glow}
        `}>
            {/* Reel convex highlight */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-white/20 to-transparent pointer-events-none z-20 rounded-t-xl" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent pointer-events-none z-20 rounded-b-xl" />
            <div className="w-full h-full flex items-center justify-center relative">

                {internalSpinning && (
                    <div className="absolute top-0 left-0 w-full animate-slot-spin flex flex-col blur-[3px]">
                        {[...BLUR_STRIP, ...BLUR_STRIP, ...BLUR_STRIP].map((s, i) => (
                            <div key={i} className="h-28 md:h-36 flex items-center justify-center text-5xl md:text-7xl opacity-90">
                                {SYMBOL_EMOJIS[s]}
                            </div>
                        ))}
                    </div>
                )}

                {!internalSpinning && showResult && (
                    <div className={`
                        text-4xl md:text-6xl filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]
                        ${isWinning ? 'animate-land-bounce' : ''}
                        relative z-10
                    `}>
                        {SYMBOL_EMOJIS[symbol]}
                    </div>
                )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-black/40 pointer-events-none rounded-2xl" />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_30%,rgba(255,255,255,0.15)_50%,rgba(255,255,255,0)_70%)] pointer-events-none" />

            {isWinning && !internalSpinning && (
                <div className="absolute inset-0 border-4 border-yellow-400 rounded-2xl animate-border-glow pointer-events-none" />
            )}
        </div>
    );
};
