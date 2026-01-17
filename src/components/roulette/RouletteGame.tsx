import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import { useRouletteEngine } from '../../services/roulette/useRouletteEngine';
import { RouletteWheel3D } from './RouletteWheel3D';
import { BetType } from '../../services/roulette/types';
import { RED_NUMBERS, BLACK_NUMBERS } from '../../services/roulette/constants';
import { GameButton } from '../ui/GameButton';

interface RouletteGameProps {
    playerBalance: number;
    onBalanceUpdate: (newBalance: number, wonAmount: number) => void;
    onExit: () => void;
}

export default function RouletteGame({ playerBalance, onBalanceUpdate, onExit }: RouletteGameProps) {
    const {
        gameState,
        winningNumber,
        lastWinAmount,
        placeBet,
        clearBets,
        spinWheel,
        resetGame,
        resolveRound,
        bets
    } = useRouletteEngine();

    const [selectedChip, setSelectedChip] = useState(10);
    const [currentBalance, setCurrentBalance] = useState(playerBalance);

    // Update balance when placing bet
    const handleBet = (type: BetType, numbers: string[]) => {
        if (currentBalance < selectedChip || gameState === 'SPINNING') return;
        placeBet(type, selectedChip, numbers);
        setCurrentBalance(prev => prev - selectedChip);
    };

    // Restore balance if clearing bets
    const handleClearBets = () => {
        const total = bets.reduce((sum, b) => sum + b.amount, 0);
        setCurrentBalance(prev => prev + total);
        clearBets();
    };

    const processedResultRef = React.useRef(false);

    useEffect(() => {
        if (gameState === 'RESULT') {
            if (!processedResultRef.current) {
                const newBalance = currentBalance + lastWinAmount;
                setCurrentBalance(newBalance);
                onBalanceUpdate(newBalance, lastWinAmount);
                processedResultRef.current = true;
            }
        } else {
            processedResultRef.current = false;
        }
    }, [gameState, lastWinAmount, currentBalance, onBalanceUpdate]);

    const betAggregates = useMemo(() => {
        const aggs: Record<string, number> = {};
        bets.forEach(b => {
            let key = '';
            if (b.type === 'straight') key = `straight-${b.numbers[0]}`;
            else if (b.type === 'dozen') key = `dozen-${b.numbers[0] === '1' ? '1st' : (b.numbers[0] === '13' ? '2nd' : '3rd')}`;
            else if (b.type === 'column') key = `col-${b.numbers[0]}`;
            else if (b.type === 'highLow') key = `hl-${b.numbers[0] === '1' ? 'low' : 'high'}`;
            else if (b.type === 'oddEven') key = `oe-${b.numbers[0] === '2' ? 'even' : 'odd'}`;
            else if (b.type === 'color') key = `color-${RED_NUMBERS.includes(b.numbers[0]) ? 'red' : 'black'}`;

            if (key) {
                aggs[key] = (aggs[key] || 0) + b.amount;
            }
        });
        return aggs;
    }, [bets]);

    // Enhanced Chip Component
    const Chip = ({ amount }: { amount: number }) => {
        if (!amount) return null;
        return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-7 h-7 rounded-full bg-gradient-to-b from-yellow-300 to-yellow-600 
                            border-2 border-dashed border-white/50 shadow-[0_4px_6px_rgba(0,0,0,0.5)] 
                            flex items-center justify-center pointer-events-none z-20 animate-bounce-short">
                <div className="w-5 h-5 rounded-full border border-yellow-700/50 flex items-center justify-center">
                    <span className="text-[9px] font-black text-yellow-900 leading-none drop-shadow-sm">
                        {amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount}
                    </span>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full h-screen bg-[#0f172a] overflow-hidden relative font-sans select-none">
            {/* Background Image / Gradient */}
            <div className="absolute inset-0 bg-[url('/image/bg.png')] bg-cover bg-center opacity-40 mix-blend-overlay pointer-events-none z-0" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0f172a]/50 to-[#0f172a] pointer-events-none z-0" />

            {/* 1. Full Screen 3D Viewport */}
            <div className="absolute inset-0 z-0">
                <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }}>
                    {/* Camera adjusted to look slightly higher (y=2 target) so wheel is visible above bottom UI */}
                    <PerspectiveCamera makeDefault position={[0, 12, 11]} fov={40} />
                    <PerspectiveCamera makeDefault position={[0, 12, 11]} fov={40} />
                    <OrbitControls
                        target={[0, -4, 0]}
                        maxPolarAngle={Math.PI / 2.2}
                        minDistance={5}
                        maxDistance={22}
                        enablePan={false}
                        enableZoom={true}
                    />
                    <RouletteWheel3D
                        spinning={gameState === 'SPINNING'}
                        onBallLand={(winner) => {
                            resolveRound(winner);
                        }}
                        onSpinComplete={() => { }}
                    />
                </Canvas>
            </div>

            {/* 3. Result Overlay - Premium Modal (Centered) */}
            {gameState === 'RESULT' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-50 animate-fadeIn duration-300 pointer-events-auto">
                    <div className="relative bg-[#1e293b]/90 border border-white/10 p-10 rounded-3xl shadow-[0_0_100px_rgba(234,179,8,0.2)] text-center transform scale-100 max-w-sm w-full outline outline-4 outline-offset-4 outline-yellow-500/20">
                        {/* Decorative Glow */}
                        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-500/30 blur-[80px] rounded-full pointer-events-none" />

                        <div className="relative">
                            <div className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Winning Number</div>
                            <div className={`text-8xl font-black mb-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)] 
                                            ${RED_NUMBERS.includes(winningNumber!) ? 'text-red-500' :
                                    BLACK_NUMBERS.includes(winningNumber!) ? 'text-slate-200' : 'text-green-500'}`}>
                                {winningNumber}
                            </div>

                            <div className="mb-8 p-4 bg-black/30 rounded-xl border border-white/5">
                                {lastWinAmount > 0 ? (
                                    <>
                                        <div className="text-yellow-400 text-sm font-bold uppercase mb-1">You Won</div>
                                        <div className="text-4xl font-mono text-white drop-shadow-md">+${lastWinAmount}</div>
                                    </>
                                ) : (
                                    <div className="text-slate-400 font-bold">Better Luck Next Time</div>
                                )}
                            </div>

                            <GameButton onClick={resetGame} variant="success" size="lg" className="w-full shadow-xl shadow-green-900/40">
                                Place New Bets
                            </GameButton>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Betting Interface - Bottom Floating Overlay */}
            <div className="absolute bottom-0 left-0 right-0 z-30 flex flex-col justify-end pointer-events-none">

                {/* Gradient Mask to fade top of UI */}
                <div className="h-20 bg-gradient-to-t from-slate-900/80 to-transparent w-full pointer-events-none" />

                <div className="bg-slate-900/80 backdrop-blur-xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.6)] rounded-t-3xl pointer-events-auto max-h-[50vh] flex flex-col">

                    {/* Control Bar (Balance/Chips Left, Actions Right) */}
                    <div className="px-6 py-3 flex justify-between items-center border-b border-white/5 bg-black/20 rounded-t-3xl">

                        {/* LEFT: Balance, Exit, & Chips */}
                        <div className="flex items-center gap-8">
                            {/* Nav & Balance */}
                            <div className="flex items-center gap-4">
                                <GameButton onClick={onExit} variant="glass" size="pillSm" className="text-slate-400 border-white/10 hover:text-white px-3">
                                    <span className="text-lg">←</span>
                                </GameButton>
                                <div className="flex flex-col">
                                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Total Balance</span>
                                    <span className="text-yellow-400 font-mono text-xl md:text-2xl font-bold tracking-tight drop-shadow-md leading-none">
                                        ${currentBalance.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="hidden md:block w-px h-8 bg-white/10" />

                            {/* Chip Selection */}
                            <div className="flex items-center gap-2">
                                {[10, 50, 100, 500, 1000].map(amt => (
                                    <button
                                        key={amt}
                                        onClick={() => setSelectedChip(amt)}
                                        className={`group relative w-10 h-10 md:w-12 md:h-12 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200
                                                ${selectedChip === amt
                                                ? 'scale-110 -translate-y-1 shadow-[0_10px_20px_rgba(0,0,0,0.5)] z-10'
                                                : 'hover:scale-105 hover:-translate-y-0.5 opacity-80 hover:opacity-100'}
                                        `}
                                    >
                                        {/* Chip Graphic CSS */}
                                        <div className={`absolute inset-0 rounded-full border-2 border-dashed border-white/30 
                                                        ${selectedChip === amt ? 'bg-gradient-to-b from-yellow-400 to-yellow-700 border-yellow-200' :
                                                amt === 10 ? 'bg-slate-700' : amt === 50 ? 'bg-blue-700' : amt === 100 ? 'bg-red-700' : 'bg-purple-700'} 
                                                        shadow-inner`}></div>
                                        <div className="absolute inset-1 rounded-full border border-white/20 bg-black/10"></div>
                                        <span className={`relative text-[10px] md:text-xs font-black z-10 
                                                        ${selectedChip === amt ? 'text-yellow-950' : 'text-white'} drop-shadow-md`}>
                                            {amt}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* RIGHT: Action Buttons */}
                        <div className="flex gap-2 md:gap-3 pl-2">
                            <GameButton
                                variant="glass"
                                size="pillSm"
                                onClick={handleClearBets}
                                disabled={bets.length === 0 || gameState === 'SPINNING'}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10 border-red-500/20 whitespace-nowrap text-xs md:text-sm"
                            >
                                CLEAR
                            </GameButton>
                            <GameButton
                                variant="success"
                                size="pill"
                                onClick={spinWheel}
                                disabled={gameState !== 'BETTING' && gameState !== 'IDLE'}
                                className={`min-w-[80px] md:min-w-[120px] shadow-lg shadow-green-900/30 ${gameState === 'SPINNING' ? 'opacity-50 grayscale' : ''}`}
                            >
                                {gameState === 'SPINNING' ? (
                                    <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                ) : 'SPIN'}
                            </GameButton>
                        </div>
                    </div>

                    {/* Main Board Container */}
                    <div className="flex-1 overflow-y-auto overflow-x-auto p-4 flex justify-center items-start">
                        <div className="relative inline-flex flex-col bg-slate-800/50 p-4 rounded-xl shadow-2xl border border-white/5 backdrop-blur-sm scale-90 md:scale-100 origin-top">

                            <div className="flex">
                                {/* 0/00 Column - Green */}
                                <div className="flex flex-col mr-1 gap-1">
                                    {['0', '00'].map(n => (
                                        <div
                                            key={n}
                                            onClick={() => handleBet('straight', [n])}
                                            className="relative w-12 md:w-14 h-[84px] md:h-[90px] bg-gradient-to-br from-emerald-800 to-emerald-900 hover:from-emerald-700 hover:to-emerald-800 
                                                    border border-emerald-500/30 rounded-lg flex items-center justify-center 
                                                    text-emerald-100 font-bold text-lg cursor-pointer transition-all shadow-inner group overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <span className="group-hover:scale-110 transition-transform drop-shadow-md">{n}</span>
                                            <Chip amount={betAggregates[`straight-${n}`]} />
                                        </div>
                                    ))}
                                </div>

                                <div className="flex flex-col gap-1">
                                    {/* Number Grid */}
                                    {[
                                        [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
                                        [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
                                        [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
                                    ].map((row, rowIdx) => (
                                        <div key={rowIdx} className="flex gap-1">
                                            {row.map(n => {
                                                const isRed = RED_NUMBERS.includes(n.toString());
                                                return (
                                                    <div
                                                        key={n}
                                                        onClick={() => handleBet('straight', [n.toString()])}
                                                        className={`relative w-10 md:w-12 h-12 md:h-14 flex items-center justify-center font-bold text-lg cursor-pointer rounded transition-all group overflow-hidden border
                                                            ${isRed ?
                                                                'bg-gradient-to-br from-rose-800 to-rose-950 border-rose-500/30 text-rose-100 hover:from-rose-700 hover:to-rose-900' :
                                                                'bg-gradient-to-br from-slate-800 to-slate-950 border-slate-500/30 text-slate-200 hover:from-slate-700 hover:to-slate-900'}
                                                            shadow-sm hover:shadow-md hover:z-10 hover:scale-105
                                                        `}
                                                    >
                                                        <span className="drop-shadow-md">{n}</span>
                                                        <Chip amount={betAggregates[`straight-${n}`]} />
                                                    </div>
                                                );
                                            })}
                                            {/* 2 to 1 for this row */}
                                            <div
                                                onClick={() => {
                                                    const start = row[0]; // 3, 2, or 1
                                                    const nums = [];
                                                    for (let i = 0; i < 12; i++) nums.push((start + i * 3).toString());
                                                    handleBet('column', nums);
                                                }}
                                                className="relative w-8 md:w-10 h-14 bg-transparent hover:bg-white/5 border border-white/10 rounded flex items-center justify-center text-slate-400 text-[10px] font-bold cursor-pointer transition-colors"
                                            >
                                                <span className="writing-vertical rotate-180">2 : 1</span>
                                                <Chip amount={betAggregates[`col-${row[0]}`]} />
                                            </div>
                                        </div>
                                    ))}

                                    {/* Dozens */}
                                    <div className="flex gap-1 mt-1 pr-8 md:pr-11">
                                        {['1st 12', '2nd 12', '3rd 12'].map((label, idx) => {
                                            const range = idx === 0 ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
                                                : idx === 1 ? ['13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24']
                                                    : ['25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36'];
                                            const zoneKey = `dozen-${idx === 0 ? '1st' : (idx === 1 ? '2nd' : '3rd')}`;
                                            return (
                                                <div
                                                    key={label}
                                                    onClick={() => handleBet('dozen', range)}
                                                    className="relative flex-1 h-10 bg-indigo-900/20 hover:bg-indigo-800/40 border border-indigo-500/20 rounded flex items-center justify-center text-indigo-200 text-xs font-bold cursor-pointer transition-colors"
                                                >
                                                    {label}
                                                    <Chip amount={betAggregates[zoneKey]} />
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Even Money Bets */}
                                    <div className="flex gap-1 mt-1 pr-8 md:pr-11">
                                        <EvenBetButton label="1-18" onClick={() => handleBet('highLow', Array.from({ length: 18 }, (_, i) => (i + 1).toString()))} agg={betAggregates['hl-low']} />
                                        <EvenBetButton label="EVEN" onClick={() => handleBet('oddEven', Array.from({ length: 18 }, (_, i) => (2 * i + 2).toString()))} agg={betAggregates['oe-even']} />
                                        <EvenBetButton label="RED" color="bg-rose-900/40 border-rose-500/30 text-rose-300" onClick={() => handleBet('color', RED_NUMBERS)} agg={betAggregates['color-red']} />
                                        <EvenBetButton label="BLACK" color="bg-slate-900/40 border-slate-500/30 text-slate-300" onClick={() => handleBet('color', BLACK_NUMBERS)} agg={betAggregates['color-black']} />
                                        <EvenBetButton label="ODD" onClick={() => handleBet('oddEven', Array.from({ length: 18 }, (_, i) => (2 * i + 1).toString()))} agg={betAggregates['oe-odd']} />
                                        <EvenBetButton label="19-36" onClick={() => handleBet('highLow', Array.from({ length: 18 }, (_, i) => (i + 19).toString()))} agg={betAggregates['hl-high']} />
                                    </div>

                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Sub-component for outside buttons
const EvenBetButton = ({ label, onClick, color, agg }: { label: string, onClick: () => void, color?: string, agg?: number }) => (
    <div
        onClick={onClick}
        className={`relative flex-1 h-10 rounded border flex items-center justify-center text-[10px] md:text-xs font-bold cursor-pointer hover:brightness-125 transition-all
         ${color || 'bg-slate-800/40 border-white/10 text-slate-300 hover:bg-slate-700/60'}
      `}
    >
        {label}
        {agg ? (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-5 h-5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 
                            border border-white shadow flex items-center justify-center pointer-events-none z-10">
                <span className="text-[8px] font-bold text-black">{agg >= 1000 ? (agg / 1000).toFixed(1) + 'k' : agg}</span>
            </div>
        ) : null}
    </div>
);
