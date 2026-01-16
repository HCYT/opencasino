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
            relative w-28 h-36 md:w-40 md:h-48 overflow-hidden
            rounded-2xl border-4 transition-all duration-300 transform
            ${internalSpinning ? 'bg-slate-800 border-slate-600' : `${symbolStyle.bg} ${symbolStyle.border}`}
            ${!internalSpinning && 'scale-100'}
            ${isWinning && !internalSpinning ? 'animate-win-pulse z-20' : 'z-10'}
            ${symbolStyle.glow}
        `}>
            <div className="w-full h-full flex items-center justify-center relative">

                {internalSpinning && (
                    <div className="absolute top-0 left-0 w-full animate-slot-spin flex flex-col blur-[3px]">
                        {[...BLUR_STRIP, ...BLUR_STRIP, ...BLUR_STRIP].map((s, i) => (
                            <div key={i} className="h-36 md:h-48 flex items-center justify-center text-7xl md:text-9xl opacity-90">
                                {SYMBOL_EMOJIS[s]}
                            </div>
                        ))}
                    </div>
                )}

                {!internalSpinning && showResult && (
                    <div className={`
                        text-6xl md:text-8xl filter drop-shadow-[0_6px_12px_rgba(0,0,0,0.6)]
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
