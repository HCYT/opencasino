import React, { useEffect, useState } from 'react';
import { useSlotMachineEngine } from '../../services/slots/useSlotMachineEngine';
import { GameButton } from '../ui/GameButton';
import Panel from '../ui/Panel';
import { Reel } from './Reel';
import { SlotSymbol } from '../../services/slots/SlotRules';
import { PayTable } from './PayTable';
import { playSound } from '../../services/sound';
import './SlotMachine.css';

interface SlotMachineGameProps {
    playerName: string;
    onExit: () => void;
}

const PAYLINE_COLORS = [
    'stroke-red-500',
    'stroke-blue-500',
    'stroke-green-500',
    'stroke-yellow-500',
    'stroke-purple-500'
];

const PAYLINES = [
    [[1, 0], [1, 1], [1, 2]],
    [[0, 0], [0, 1], [0, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[2, 0], [1, 1], [0, 2]]
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
        toggleAutoSpin,
        freeSpinsRemaining,
        isFreeSpinMode
    } = useSlotMachineEngine(playerName);

    const [showCoins, setShowCoins] = useState(false);
    const [winAmount, setWinAmount] = useState(0);

    const rawGrid = result?.grid || [
        [SlotSymbol.LEMON, SlotSymbol.CHERRY, SlotSymbol.ORANGE],
        [SlotSymbol.GRAPE, SlotSymbol.WILD, SlotSymbol.BELL],
        [SlotSymbol.BAR, SlotSymbol.SCATTER, SlotSymbol.LEMON]
    ];

    const displayColumns = [0, 1, 2].map(colIdx =>
        [0, 1, 2].map(rowIdx => rawGrid[rowIdx][colIdx])
    );

    const getWinningPositions = () => {
        if (!result || result.linesWon.length === 0) return new Set<string>();
        const winning = new Set<string>();
        result.linesWon.forEach(lineIndex => {
            PAYLINES[lineIndex].forEach(([row, col]) => {
                winning.add(`${row}-${col}`);
            });
        });
        return winning;
    };

    const winningPositions = getWinningPositions();

    const [coinParticles, setCoinParticles] = useState<Array<{ id: number; left: number; delay: number; width: number; height: number }>>([]);

    useEffect(() => {
        if (result && result.winAmount > 0 && !isSpinning) {
            setWinAmount(result.winAmount);
            if (result.isJackpot) {
                playSound('slot-jackpot');
            } else {
                playSound('slot-win');
            }
            const particles = Array.from({ length: 20 }).map((_, i) => ({
                id: Date.now() + i,
                left: Math.random() * 100,
                delay: Math.random() * 0.5,
                width: 15 + Math.random() * 15,
                height: 15 + Math.random() * 15
            }));
            setCoinParticles(particles);
            setShowCoins(true);
            setTimeout(() => {
                setShowCoins(false);
                setCoinParticles([]);
            }, 2000);
        }
        if (isSpinning) {
            setWinAmount(0);
        }
    }, [result, isSpinning]);

    function getPaylinePath(index: number): string {
        const R1 = 16.666; const R2 = 50; const R3 = 83.333;

        switch (index) {
            case 0: return `M 0 ${R2} L 100 ${R2}`;
            case 1: return `M 0 ${R1} L 100 ${R1}`;
            case 2: return `M 0 ${R3} L 100 ${R3}`;
            case 3: return `M 0 0 L 100 100`;
            case 4: return `M 0 100 L 100 0`;
            default: return '';
        }
    }

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 relative overflow-x-hidden overflow-y-auto">
            <div className="fixed inset-0 -z-20">
                <img
                    src="/image/bg1.png"
                    alt="Slot Machine Background"
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="fixed inset-0 bg-gradient-to-br from-purple-950/80 via-black/60 to-black/80 -z-10 pointer-events-none" />

            <div className="relative z-10 flex flex-col xl:flex-row gap-8 items-start justify-center w-full max-w-[1400px]">

                <div className="hidden xl:flex w-80 sticky top-10 h-fit">
                    <PayTable />
                </div>

                <div className="flex-1 w-full max-w-xl flex flex-col items-center">
                    <Panel variant="glass" className="w-full p-6 md:p-10 rounded-[2.5rem] border border-white/10 bg-slate-900/40 backdrop-blur-xl shadow-2xl mx-auto relative overflow-hidden group flex flex-col items-center">

                        {/* Glass Reflections */}
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                        {/* Integrated Jackpot Display */}
                        <div className={`relative z-10 mb-4 text-center ${result?.isJackpot ? 'animate-jackpot-flash' : ''}`}>
                            <h2 className="text-yellow-500/80 font-black text-xs md:text-sm tracking-[0.3em] uppercase mb-1">Grand Jackpot</h2>
                            <div
                                className="text-4xl md:text-5xl font-black font-mono text-yellow-400 animate-pulse"
                                style={{
                                    textShadow: '0 0 20px rgba(250, 204, 21, 0.5), 0 0 40px rgba(250, 204, 21, 0.3), 0 2px 4px rgba(0,0,0,0.5)'
                                }}
                            >
                                ${jackpot.toLocaleString()}
                            </div>
                        </div>

                        {/* Free Spins Indicator */}
                        {(isFreeSpinMode || freeSpinsRemaining > 0) && (
                            <div className="relative z-10 mb-4 px-6 py-2 bg-gradient-to-r from-yellow-500/20 via-yellow-500/30 to-yellow-500/20 rounded-full border border-yellow-500/50 animate-pulse">
                                <span className="text-yellow-300 font-black text-lg tracking-wider">
                                    ⭐ FREE SPINS: {freeSpinsRemaining} ⭐
                                </span>
                            </div>
                        )}

                        {/* Main Machine Area */}
                        <div className="relative mb-10 bg-black/40 p-6 rounded-[2rem] border border-white/5 shadow-inner flex flex-col items-center justify-center backdrop-blur-sm">
                            <div className="relative w-fit mx-auto">
                                <div className="grid grid-cols-3 gap-2 md:gap-3 relative z-10">
                                    {displayColumns.map((col, colIndex) => (
                                        <div key={colIndex} className="flex flex-col gap-2 md:gap-3">
                                            {col.map((symbol, rowIndex) => {
                                                const isWinning = winningPositions.has(`${rowIndex}-${colIndex}`);
                                                return (
                                                    <Reel
                                                        key={`${colIndex}-${rowIndex}`}
                                                        symbol={symbol}
                                                        isSpinning={isSpinning}
                                                        stopDelay={colIndex * 200 + rowIndex * 100}
                                                        isWinning={isWinning}
                                                    />
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>

                                <div className="absolute inset-0 pointer-events-none z-20">
                                    {result?.linesWon.map(lineIndex => (
                                        <div
                                            key={lineIndex}
                                            className={`absolute w-full h-full opacity-90 ${isSpinning ? 'hidden' : ''} win-line-active`}
                                        >
                                            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                                                <path
                                                    d={getPaylinePath(lineIndex)}
                                                    fill="none"
                                                    strokeWidth="5"
                                                    className={`${PAYLINE_COLORS[lineIndex]} drop-shadow-[0_0_12px_rgba(255,255,255,1)]`}
                                                    strokeLinecap="round"
                                                    vectorEffect="non-scaling-stroke"
                                                />
                                            </svg>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {showCoins && (
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                {coinParticles.map(p => (
                                    <div
                                        key={p.id}
                                        className="coin-particle"
                                        style={{
                                            left: `${p.left}%`,
                                            animationDelay: `${p.delay}s`,
                                            width: `${p.width}px`,
                                            height: `${p.height}px`
                                        }}
                                    />
                                ))}
                            </div>
                        )}

                        <div className="text-center h-14 mb-6 flex items-center justify-center bg-black/40 rounded-full border border-white/5 backdrop-blur-md animate-slide-up">
                            <span className={`text-xl md:text-3xl font-black ${message.includes('贏') || message.includes('Win') || message.includes('大獎') ? 'text-yellow-400 animate-bounce' : 'text-white/90'}`}>
                                {message}
                            </span>
                            {winAmount > 0 && (
                                <span className="ml-4 text-emerald-400 font-bold text-lg animate-slide-up">
                                    +${winAmount.toLocaleString()}
                                </span>
                            )}
                        </div>

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
                                                onClick={() => { playSound('chip-place'); setBetAmount(Math.min(credits, 1000)); }}
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
                                    onClick={() => { playSound('chip-place'); toggleAutoSpin(); }}
                                    variant={isAutoSpin ? 'warning' : 'secondary'}
                                    size="pill"
                                    className={`flex-1 text-base md:text-lg font-bold tracking-wider relative overflow-hidden group whitespace-nowrap flex items-center justify-center gap-2 ${isAutoSpin ? 'text-black' : 'text-white border-2 border-white/20 hover:border-white/50'}`}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] translate-x-[-200%] group-hover:animate-shine transition-all duration-1000" />
                                    <span>{isAutoSpin ? '⛔ STOP' : '🔄 AUTO'}</span>
                                    {isAutoSpin && <div className="absolute inset-0 bg-yellow-500/20 animate-pulse" />}
                                </GameButton>

                                <GameButton
                                    onClick={() => { playSound('chip-place'); spin(); }}
                                    variant="success"
                                    size="pillLg"
                                    disabled={isSpinning || credits < betAmount || isAutoSpin}
                                    className="relative flex-[2] text-2xl md:text-4xl font-black tracking-[0.2em] shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_60px_rgba(34,197,94,0.6)] hover:scale-105 transition-all active:scale-95 bg-gradient-to-t from-green-700 to-green-500 border-t border-green-400 overflow-hidden group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-[-20deg] translate-x-[-200%] group-hover:animate-shine transition-all duration-700" />
                                    {isSpinning ? '...' : 'SPIN'}
                                </GameButton>
                            </div>
                        </div>
                    </Panel>
                </div>

                <div className="xl:hidden w-full max-w-md mx-auto">
                    <PayTable />
                </div>

            </div>
        </div>
    );
};

export default SlotMachineGame;
