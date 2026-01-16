import React, { useEffect, useState } from 'react';
import { SlotSymbol } from '../../services/slots/SlotRules';

interface ReelProps {
    symbol: SlotSymbol;
    isSpinning: boolean;
    stopDelay: number; // ms to wait after isSpinning becomes false before stopping
}

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

const SYMBOL_COLORS: Record<SlotSymbol, string> = {
    [SlotSymbol.WILD]: 'bg-purple-900 border-purple-400',
    [SlotSymbol.SEVEN]: 'bg-red-900 border-red-500',
    [SlotSymbol.BAR]: 'bg-cyan-900 border-cyan-400',
    [SlotSymbol.BELL]: 'bg-yellow-800 border-yellow-400',
    [SlotSymbol.GRAPE]: 'bg-fuchsia-900 border-fuchsia-500',
    [SlotSymbol.ORANGE]: 'bg-orange-900 border-orange-500',
    [SlotSymbol.CHERRY]: 'bg-rose-900 border-rose-500',
    [SlotSymbol.LEMON]: 'bg-yellow-900/50 border-yellow-200'
};

// A fixed strip for the blur animation
const BLUR_STRIP = [
    SlotSymbol.SEVEN, SlotSymbol.CHERRY, SlotSymbol.BAR, SlotSymbol.GRAPE,
    SlotSymbol.BELL, SlotSymbol.LEMON, SlotSymbol.ORANGE, SlotSymbol.WILD
];

export const Reel: React.FC<ReelProps> = ({ symbol, isSpinning, stopDelay }) => {
    const [internalSpinning, setInternalSpinning] = useState(false);

    useEffect(() => {
        if (isSpinning) {
            setInternalSpinning(true);
        } else {
            // Delay the stop to create staggered effect
            const timer = setTimeout(() => {
                setInternalSpinning(false);
            }, stopDelay);
            return () => clearTimeout(timer);
        }
    }, [isSpinning, stopDelay]);

    return (
        <div className={`
      relative w-28 h-36 md:w-40 md:h-48 overflow-hidden
      rounded-xl border-4 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]
      transition-all duration-300 transform
      ${internalSpinning ? 'bg-slate-800 border-slate-600' : SYMBOL_COLORS[symbol]}
      ${!internalSpinning && 'scale-100'}
    `}>
            {/* Inner Container for Symbols */}
            <div className="w-full h-full flex items-center justify-center relative">

                {/* Spinning Loop Animation */}
                {internalSpinning && (
                    <div className="absolute top-0 left-0 w-full animate-slot-spin flex flex-col blur-[2px]">
                        {/* Render strip 3 times to ensure smooth loop */}
                        {[...BLUR_STRIP, ...BLUR_STRIP, ...BLUR_STRIP].map((s, i) => (
                            <div key={i} className="h-36 md:h-48 flex items-center justify-center text-6xl md:text-8xl opacity-80">
                                {SYMBOL_EMOJIS[s]}
                            </div>
                        ))}
                    </div>
                )}

                {/* Static Result - Only shown when NOT spinning */}
                {!internalSpinning && (
                    <div className="text-6xl md:text-8xl filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] animate-land-bounce">
                        {SYMBOL_EMOJIS[symbol]}
                    </div>
                )}
            </div>

            {/* Shine/Gloss Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/30 pointer-events-none rounded-xl" />
            <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0)_45%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0)_55%)] pointer-events-none" />
        </div>
    );
};
