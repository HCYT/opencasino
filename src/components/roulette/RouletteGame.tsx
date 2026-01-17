import React, { useState, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment } from '@react-three/drei';
import { useRouletteEngine } from '../../services/roulette/useRouletteEngine';
import { RouletteWheel3D } from './RouletteWheel3D';
import { BetType, RouletteBet } from '../../services/roulette/types';
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
        if (currentBalance < selectedChip) return; // Insufficient funds
        placeBet(type, selectedChip, numbers);
        setCurrentBalance(prev => prev - selectedChip);
    };

    // Restore balance if clearing bets
    const handleClearBets = () => {
        const total = bets.reduce((sum, b) => sum + b.amount, 0);
        setCurrentBalance(prev => prev + total);
        clearBets();
    };

    useEffect(() => {
        if (gameState === 'RESULT') {
            const newBalance = currentBalance + lastWinAmount;
            setCurrentBalance(newBalance);
            onBalanceUpdate(newBalance, lastWinAmount);
        }
    }, [gameState, lastWinAmount]);

    // Calculate chips aggregation for display
    // Map bet 'numbers' key to total amount? 
    // Actually, straight bets are easy (single number). 
    // Group bets (red/black) need a specific zone key.
    // For simplicity, we'll calculate a "total bet" per number for straight bets, 
    // and special totals for outside zones.
    const betAggregates = useMemo(() => {
        const aggs: Record<string, number> = {};
        bets.forEach(b => {
            // Generate a unique key for the visual zone.
            // If straight, key is the number string.
            // If outside, key is the type + params (e.g. 'color-red').
            let key = '';
            if (b.type === 'straight') key = b.numbers[0];
            else if (b.type === 'color') key = `color-${b.numbers[0] === '1' ? 'red' : (RED_NUMBERS.includes(b.numbers[0]) ? 'red' : 'black')}`; // Wait, color numbers array is big. 
            // Let's use custom "Zone IDs" passed in handleBet for cleaner UI matching?
            // Or infer from matching set.

            // Inferring:
            if (b.type === 'straight') key = `straight-${b.numbers[0]}`;
            else if (b.type === 'dozen') key = `dozen-${b.numbers[0] === '1' ? '1st' : (b.numbers[0] === '13' ? '2nd' : '3rd')}`;
            else if (b.type === 'column') key = `col-${b.numbers[0]}`; // 1/4/7->col1, 2/5/8->col2, 3/6/9->col3
            else if (b.type === 'highLow') key = `hl-${b.numbers[0] === '1' ? 'low' : 'high'}`;
            else if (b.type === 'oddEven') key = `oe-${b.numbers[0] === '2' ? 'even' : 'odd'}`; // 2 is even start, 1 is odd start
            else if (b.type === 'color') key = `color-${RED_NUMBERS.includes(b.numbers[0]) ? 'red' : 'black'}`;

            if (key) {
                aggs[key] = (aggs[key] || 0) + b.amount;
            }
        });
        return aggs;
    }, [bets]);

    // Helper to render chip overlay
    // Use a tiny absolute div with rounded full, borders, and text.
    const Chip = ({ amount }: { amount: number }) => {
        if (!amount) return null;
        return (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 
                            border-2 border-white shadow-lg flex items-center justify-center pointer-events-none z-10">
                <span className="text-[10px] font-bold text-black leading-none">${amount >= 1000 ? (amount / 1000).toFixed(1) + 'k' : amount}</span>
            </div>
        );
    };

    return (
        <div className="w-full h-screen bg-[#0f172a] overflow-hidden relative flex flex-col font-sans">
            {/* 3D Viewport */}
            <div className="flex-1 min-h-[45vh] relative bg-gradient-to-b from-slate-900 to-[#1a1a2e]">
                <Canvas shadows dpr={[1, 2]}>
                    <PerspectiveCamera makeDefault position={[0, 10, 9]} fov={45} />
                    <OrbitControls
                        target={[0, 0, 0]}
                        maxPolarAngle={Math.PI / 2.2}
                        minDistance={5}
                        maxDistance={18}
                        enablePan={false}
                    />
                    <Environment preset="city" /> {/* Brighter preset */}
                    <ambientLight intensity={0.8} />
                    <spotLight position={[5, 15, 5]} angle={0.4} penumbra={1} castShadow intensity={2.0} color="#ffeebb" />
                    {/* Top-down light for metallic reflections */}
                    <pointLight position={[0, 5, 0]} intensity={1.5} color="white" distance={20} />

                    <RouletteWheel3D
                        spinning={gameState === 'SPINNING'}
                        onBallLand={(winner) => {
                            // The 3D component has calculated the winning number from ball position
                            resolveRound(winner);
                        }}
                        onSpinComplete={() => { }}
                    />
                </Canvas>

                {/* Result Overlay */}
                {gameState === 'RESULT' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-[2px] z-50 animate-fadeIn">
                        <div className="bg-slate-900/90 border-2 border-yellow-500/50 p-8 rounded-2xl shadow-[0_0_50px_rgba(234,179,8,0.3)] text-center transform scale-110">
                            <div className="text-6xl font-black text-yellow-500 mb-2 drop-shadow-glow">{winningNumber}</div>
                            <div className="text-2xl text-white font-bold mb-4">
                                {lastWinAmount > 0 ? (
                                    <span className="text-green-400">WIN ${lastWinAmount}</span>
                                ) : (
                                    <span className="text-slate-400">No Win</span>
                                )}
                            </div>
                            <GameButton onClick={resetGame} variant="success" size="pill">Next Round</GameButton>
                        </div>
                    </div>
                )}
            </div>

            {/* Betting Interface */}
            <div className="h-[55vh] bg-[#0b0f19] p-4 border-t border-white/10 flex flex-col relative shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40">
                {/* Controls Bar */}
                <div className="flex justify-between items-center mb-4 px-2">
                    <div className="flex flex-col">
                        <span className="text-slate-400 text-xs uppercase tracking-wider font-bold">Balance</span>
                        <span className="text-yellow-400 font-mono text-xl md:text-2xl drop-shadow-md">
                            ${currentBalance.toLocaleString()}
                        </span>
                    </div>

                    <div className="flex gap-3 bg-black/40 p-2 rounded-full border border-white/5 backdrop-blur-md">
                        {[10, 50, 100, 500].map(amt => (
                            <button
                                key={amt}
                                onClick={() => setSelectedChip(amt)}
                                className={`w-10 h-10 md:w-12 md:h-12 rounded-full border-2 font-black flex items-center justify-center text-xs md:text-sm transition-all
                                           ${selectedChip === amt
                                        ? 'border-yellow-400 bg-yellow-500 text-black scale-110 shadow-[0_0_15px_rgba(234,179,8,0.5)]'
                                        : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-slate-400 hover:text-white'}
                                `}
                            >
                                {amt}
                            </button>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <GameButton
                            variant="danger"
                            size="pillSm"
                            onClick={handleClearBets}
                            disabled={bets.length === 0 || gameState === 'SPINNING'}
                        >
                            Clear
                        </GameButton>
                        <GameButton
                            variant="success"
                            size="pill"
                            onClick={spinWheel}
                            disabled={gameState !== 'BETTING' && gameState !== 'IDLE'}
                            className={gameState === 'SPINNING' ? 'opacity-50' : ''}
                        >
                            {gameState === 'SPINNING' ? 'Spinning...' : 'SPIN'}
                        </GameButton>
                    </div>
                </div>

                {/* Main Board */}
                <div className="flex-1 overflow-auto flex justify-center items-center select-none py-2">
                    <div className="relative flex items-start bg-[#1e293b]/50 p-3 rounded-xl border border-white/10 shadow-2xl backdrop-blur-sm">

                        {/* 0/00 Column */}
                        <div className="flex flex-col mr-1 gap-1">
                            {['0', '00'].map(n => (
                                <div
                                    key={n}
                                    onClick={() => handleBet('straight', [n])}
                                    className="relative w-12 h-[74px] bg-emerald-700/80 hover:bg-emerald-600 border border-emerald-500/30 rounded flex items-center justify-center text-white font-bold cursor-pointer transition-colors group"
                                >
                                    <span className="group-hover:scale-110 transition-transform">{n}</span>
                                    {/* Chip Overlay */}
                                    <Chip amount={betAggregates[`straight-${n}`]} />
                                </div>
                            ))}
                        </div>

                        {/* Numbers Grid */}
                        <div className="flex flex-col gap-1">
                            {/* Number Rows (3,6,9... etc) */}
                            {[
                                [3, 6, 9, 12, 15, 18, 21, 24, 27, 30, 33, 36],
                                [2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35],
                                [1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34]
                            ].map((row, rowIdx) => (
                                <div key={rowIdx} className="flex gap-1">
                                    {row.map(n => (
                                        <div
                                            key={n}
                                            onClick={() => handleBet('straight', [n.toString()])}
                                            className={`relative w-12 h-12 flex items-center justify-center font-bold text-white cursor-pointer border border-white/5 rounded-sm transition-all group
                                                ${RED_NUMBERS.includes(n.toString())
                                                    ? 'bg-rose-700/80 hover:bg-rose-600 border-rose-500/30'
                                                    : 'bg-slate-800/90 hover:bg-slate-700 border-slate-600/30'}
                                            `}
                                        >
                                            <span className="group-hover:scale-110 transition-transform shadow-black drop-shadow-md">{n}</span>
                                            <Chip amount={betAggregates[`straight-${n}`]} />
                                        </div>
                                    ))}
                                </div>
                            ))}

                            {/* Dozens */}
                            <div className="flex gap-1 mt-1">
                                {['1st 12', '2nd 12', '3rd 12'].map((label, idx) => {
                                    const range = idx === 0 ? ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
                                        : idx === 1 ? ['13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24']
                                            : ['25', '26', '27', '28', '29', '30', '31', '32', '33', '34', '35', '36'];
                                    const zoneKey = `dozen-${idx === 0 ? '1st' : (idx === 1 ? '2nd' : '3rd')}`;
                                    return (
                                        <div
                                            key={label}
                                            onClick={() => handleBet('dozen', range)}
                                            className="relative flex-1 h-10 bg-indigo-900/40 hover:bg-indigo-800/60 border border-indigo-500/30 rounded flex items-center justify-center text-indigo-100 text-xs font-bold cursor-pointer"
                                        >
                                            {label}
                                            <Chip amount={betAggregates[zoneKey]} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 2 to 1 Column */}
                        <div className="flex flex-col gap-1 ml-1">
                            {[3, 2, 1].map(colId => { // Mapping simplified
                                // Logic: col 3 (top visual) contains 3,6,9...
                                // col 2 contains 2,5,8...
                                // col 1 contains 1,4,7...
                                // We need the number array.
                                const start = colId;
                                const nums = [];
                                for (let i = 0; i < 12; i++) nums.push((start + i * 3).toString());

                                const zoneKey = `col-${start}`; // matches logic above? "1/4/7 -> col1" yes.

                                return (
                                    <div
                                        key={colId}
                                        onClick={() => handleBet('column', nums)}
                                        className="relative w-10 h-12 bg-transparent hover:bg-white/5 border border-white/10 rounded flex items-center justify-center text-slate-400 text-[10px] font-bold cursor-pointer"
                                    >
                                        2:1
                                        <Chip amount={betAggregates[zoneKey]} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Even Money Bets */}
                <div className="flex justify-center gap-2 pb-2">
                    <EvenBetButton label="1-18" onClick={() => handleBet('highLow', Array.from({ length: 18 }, (_, i) => (i + 1).toString()))} agg={betAggregates['hl-low']} />
                    <EvenBetButton label="EVEN" onClick={() => handleBet('oddEven', Array.from({ length: 18 }, (_, i) => (2 * i + 2).toString()))} agg={betAggregates['oe-even']} />
                    <EvenBetButton label="RED" color="bg-rose-800" onClick={() => handleBet('color', RED_NUMBERS)} agg={betAggregates['color-red']} />
                    <EvenBetButton label="BLACK" color="bg-slate-900" onClick={() => handleBet('color', BLACK_NUMBERS)} agg={betAggregates['color-black']} />
                    <EvenBetButton label="ODD" onClick={() => handleBet('oddEven', Array.from({ length: 18 }, (_, i) => (2 * i + 1).toString()))} agg={betAggregates['oe-odd']} />
                    <EvenBetButton label="19-36" onClick={() => handleBet('highLow', Array.from({ length: 18 }, (_, i) => (i + 19).toString()))} agg={betAggregates['hl-high']} />
                </div>
            </div>
        </div>
    );
}

// Sub-component for outside buttons
const EvenBetButton = ({ label, onClick, color, agg }: { label: string, onClick: () => void, color?: string, agg?: number }) => (
    <div
        onClick={onClick}
        className={`relative px-4 py-3 min-w-[80px] rounded-lg border border-white/20 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:brightness-125 transition-all
         ${color || 'bg-slate-800'}
      `}
    >
        {label}
        {agg ? (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                            w-6 h-6 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 
                            border-2 border-white shadow-lg flex items-center justify-center pointer-events-none z-10">
                <span className="text-[10px] text-black">{agg >= 1000 ? (agg / 1000).toFixed(1) + 'k' : agg}</span>
            </div>
        ) : null}
    </div>
);
