import React from 'react';
import { useSlotMachineEngine } from '../../services/slots/useSlotMachineEngine';
import { GameButton } from '../ui/GameButton';
import Panel from '../ui/Panel';
import { Reel } from './Reel';
import { SlotSymbol } from '../../services/slots/SlotRules';
import { PayTable } from './PayTable';
import './SlotMachine.css';

interface SlotMachineGameProps {
    playerName: string;
    onExit: () => void;
}

const PAYLINE_COORDS = [
    "15%,50% 85%,50%", // Middle
    "15%,16% 85%,16%", // Top
    "15%,84% 85%,84%", // Bottom
    "15%,16% 85%,84%", // TL-BR
    "15%,84% 85%,16%"  // TR-BL
];

const PAYLINE_COLORS = [
    'stroke-red-500',
    'stroke-blue-500',
    'stroke-green-500',
    'stroke-yellow-500',
    'stroke-purple-500'
];

const SlotMachineGame: React.FC<SlotMachineGameProps> = ({ playerName, onExit }) => {
    const {
        credits,
        jackpot,
        betAmount,
        setBetAmount,
        spin,
        isSpinning,
        result,
        message,
        isAutoSpin,
        toggleAutoSpin
    } = useSlotMachineEngine(playerName);

    // Default display grid (initial state)
    const rawGrid = result?.grid || [
        [SlotSymbol.SEVEN, SlotSymbol.SEVEN, SlotSymbol.SEVEN],
        [SlotSymbol.SEVEN, SlotSymbol.SEVEN, SlotSymbol.SEVEN],
        [SlotSymbol.SEVEN, SlotSymbol.SEVEN, SlotSymbol.SEVEN]
    ];

    // Transpose for rendering: Logic is [Row][Col], UI needs [Col][Row]
    const displayColumns = [0, 1, 2].map(colIdx =>
        [0, 1, 2].map(rowIdx => rawGrid[rowIdx][colIdx])
    );

    return (
        <div className="min-h-screen w-full bg-[#0a0f1c] flex flex-col items-center justify-center p-4 relative overflow-hidden overflow-y-auto">
            {/* Background Decor */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/20 via-[#0a0f1c] to-[#0a0f1c] pointer-events-none fixed" />



            <div className="relative z-10 flex flex-col xl:flex-row gap-8 items-start justify-center w-full max-w-[1400px]">

                {/* Left: Pay Table (Desktop) */}
                <div className="hidden xl:block w-80 sticky top-10">
                    <PayTable />
                </div>

                {/* Center: Main Machine Area + Jackpot (Wrapper) */}
                <div className="flex-1 w-full max-w-4xl flex flex-col items-center">
                    {/* Header / Jackpot (Moved Here) */}
                    <div className="relative z-10 mb-6 md:mb-10 text-center animate-pulse scale-110 mt-8 md:mt-0">
                        <h2 className="text-yellow-500 font-black text-xs md:text-sm tracking-[0.5em] uppercase mb-2 drop-shadow-md">Grand Jackpot</h2>
                        <div className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 via-yellow-500 to-yellow-800 drop-shadow-[0_0_50px_rgba(234,179,8,0.6)] font-mono">
                            ${jackpot.toLocaleString()}
                        </div>
                    </div>

                    <Panel variant="glass" className="w-full p-6 md:p-12 rounded-[3rem] border-4 border-yellow-500/40 bg-black/80 shadow-[0_0_150px_rgba(168,85,247,0.25)] transform hover:scale-[1.01] transition-transform duration-500 mx-auto">

                        {/* Decor Lights */}
                        <div className="absolute top-4 left-4 right-4 h-2 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full opacity-50" />

                        {/* Reels Grid with Paylines */}
                        {/* Reels Grid with Paylines - Wrapper for coordinate alignment */}
                        <div className="relative mb-8 bg-[#151515] p-6 rounded-3xl shadow-[inset_0_0_50px_black] border border-white/5 flex flex-col items-center justify-center">
                            <div className="relative w-fit mx-auto">
                                <div className="grid grid-cols-3 gap-3 md:gap-6 relative z-10">
                                    {displayColumns.map((col, colIndex) => (
                                        <div key={colIndex} className="flex flex-col gap-3 md:gap-6">
                                            {col.map((symbol, rowIndex) => (
                                                <Reel
                                                    key={`${colIndex}-${rowIndex}`}
                                                    symbol={symbol}
                                                    isSpinning={isSpinning}
                                                    stopDelay={colIndex * 200 + rowIndex * 100}
                                                />
                                            ))}
                                        </div>
                                    ))}
                                </div>

                                {/* Explicit Payline Rendering using Divs/CSS */}
                                <div className="absolute inset-0 pointer-events-none z-20">
                                    {result?.linesWon.map(lineIndex => (
                                        <div
                                            key={lineIndex}
                                            className={`absolute w-full h-full opacity-90 ${isSpinning ? 'hidden' : 'animate-pulse'}`}
                                        >
                                            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <path
                                                    d={getPaylinePath(lineIndex)}
                                                    fill="none"
                                                    strokeWidth="4"
                                                    className={`${PAYLINE_COLORS[lineIndex]} drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]`}
                                                    strokeLinecap="round"
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                            </svg>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Message Panel */}
                        <div className="text-center h-14 mb-6 flex items-center justify-center bg-black/40 rounded-full border border-white/5 backdrop-blur-md">
                            <span className={`text-xl md:text-3xl font-black ${message.includes('贏') || message.includes('Win') ? 'text-yellow-400 animate-bounce' : 'text-white/90'}`}>
                                {message}
                            </span>
                        </div>

                        {/* Controls */}
                        <div className="flex flex-col gap-6">
                            <div className="flex items-center justify-between bg-gradient-to-r from-white/5 to-transparent p-5 rounded-2xl border border-white/10">
                                <div className="flex flex-col">
                                    <div className="text-[10px] text-white/50 uppercase tracking-widest font-black">Credit</div>
                                    <div className="text-3xl font-black text-emerald-400 drop-shadow-md">${credits.toLocaleString()}</div>
                                </div>

                                <div className="flex flex-col items-end w-full md:w-auto">
                                    <div className="text-[10px] text-white/50 uppercase tracking-widest font-black mb-1 w-full text-center">Bet Amount</div>
                                    <div className="flex flex-col items-center gap-2 w-full md:w-64">
                                        <span className="text-2xl font-black text-yellow-400 w-full text-center">${betAmount}</span>
                                        <div className="flex items-center gap-2 w-full">
                                            <input
                                                type="range"
                                                min="1"
                                                max={Math.min(credits, 1000)}
                                                value={betAmount}
                                                onChange={(e) => setBetAmount(Math.max(1, parseInt(e.target.value)))}
                                                className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all"
                                                disabled={isSpinning || isAutoSpin}
                                            />
                                            <GameButton
                                                onClick={() => setBetAmount(Math.min(credits, 1000))}
                                                size="pillSm"
                                                variant="warning"
                                                disabled={isSpinning || isAutoSpin}
                                                className="text-[10px] px-2 py-1 h-6 min-w-[40px] font-bold text-black"
                                            >
                                                MAX
                                            </GameButton>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-4 h-16 md:h-20">
                                <GameButton
                                    onClick={onExit}
                                    variant="ghost"
                                    size="pill"
                                    disabled={isSpinning || isAutoSpin}
                                    className="flex-[0.5] text-white/50 hover:text-white hover:bg-white/10"
                                >
                                    <span className="text-sm">EXIT</span>
                                </GameButton>

                                <GameButton
                                    onClick={toggleAutoSpin}
                                    variant={isAutoSpin ? 'warning' : 'secondary'}
                                    size="pill"
                                    className={`flex-1 text-base md:text-lg font-bold tracking-wider relative overflow-hidden ${isAutoSpin ? 'text-black' : 'text-white border-2 border-white/20 hover:border-white/50'}`}
                                >
                                    {isAutoSpin ? '⛔ STOP AUTO' : '🔄 AUTO SPIN'}
                                    {isAutoSpin && <div className="absolute inset-0 bg-yellow-500/20 animate-pulse" />}
                                </GameButton>

                                <GameButton
                                    onClick={spin}
                                    variant="success"
                                    size="pillLg"
                                    disabled={isSpinning || credits < betAmount || isAutoSpin}
                                    className="flex-[2] text-2xl md:text-4xl font-black tracking-[0.2em] shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)] hover:scale-105 transition-all active:scale-95 bg-gradient-to-t from-green-700 to-green-500 border-t border-green-400"
                                >
                                    {isSpinning ? '...' : 'SPIN'}
                                </GameButton>
                            </div>
                        </div>
                    </Panel>
                </div>

                {/* Mobile Pay Table (Below machine on small screens) */}
                <div className="xl:hidden w-full max-w-md mx-auto">
                    <PayTable />
                </div>

            </div>
        </div>
    );
};

// Helper for Payline Paths (0-100 coordinate space)
function getPaylinePath(index: number): string {
    // 3 Rows (centers at ~16.66%, 50%, ~83.33%)
    // 3 Cols (centers at ~16.66%, 50%, ~83.33%)
    const C1 = 16.666; const C2 = 50; const C3 = 83.333; // X coords
    const R1 = 16.666; const R2 = 50; const R3 = 83.333; // Y coords

    switch (index) {
        case 0: return `M 0 ${R2} L 100 ${R2}`; // Middle
        case 1: return `M 0 ${R1} L 100 ${R1}`; // Top
        case 2: return `M 0 ${R3} L 100 ${R3}`; // Bottom
        case 3: return `M 0 0 L 100 100`;       // Diagonal TopL to BotR (CORRECTED: Corner to Corner)
        case 4: return `M 0 100 L 100 0`;       // Diagonal BotL to TopR (CORRECTED: Corner to Corner)
        default: return '';
    }
}

export default SlotMachineGame;
