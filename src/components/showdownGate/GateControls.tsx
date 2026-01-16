import React, { useState, useMemo } from 'react';
import { GatePlayer, GuessDirection } from '../../services/showdownGate/types';
import { GameButton } from '../ui/GameButton';
import RangeSlider from '../ui/RangeSlider';
import StackCard from '../ui/StackCard';
import PillPanel from '../ui/PillPanel';
import {
    bottomDock,
    bottomDockInner,
    lobbyExitButton
} from '../ui/sharedStyles';
import { RANK_VALUE } from '../../constants';

interface GateControlsProps {
    player: GatePlayer;
    pot: number;
    anteBet: number;
    isPlayerTurn: boolean;
    isSameGate: boolean;
    gateGap: number;
    onPlaceBet: (amount: number, guess?: GuessDirection) => void;
    onStartRound: () => void;
    onExit: () => void;
    phase: 'BETTING' | 'PLAYER_TURN' | 'RESULT';
}

const GateControls: React.FC<GateControlsProps> = ({
    player,
    pot,
    anteBet,
    isPlayerTurn,
    isSameGate,
    gateGap,
    onPlaceBet,
    onStartRound,
    onExit,
    phase,
}) => {
    const [betAmount, setBetAmount] = useState(anteBet);
    const [selectedGuess, setSelectedGuess] = useState<GuessDirection>(null);

    const maxBet = useMemo(() => Math.min(pot, player?.chips || 0), [pot, player?.chips]);
    const minBet = anteBet;

    const canBet = isPlayerTurn && player?.turnStatus === 'GATE_REVEALED';
    const needsGuess = isSameGate && canBet;

    // 根據間距給出建議
    const gapAdvice = useMemo(() => {
        if (gateGap === 0) return '同點門柱！需選擇大或小';
        if (gateGap === 1) return '相鄰門柱，無法中門';
        if (gateGap <= 3) return '間距較小，風險較高';
        if (gateGap <= 6) return '間距中等';
        return '間距較大，較安全';
    }, [gateGap]);

    const handleConfirmBet = () => {
        if (!canBet) return;
        if (needsGuess && !selectedGuess) return;
        onPlaceBet(betAmount, selectedGuess);
    };

    return (
        <div className={bottomDock}>
            <div className={bottomDockInner}>
                {/* Left side: Player stack and exit */}
                <div className="absolute left-0 bottom-0 flex flex-col gap-3 pointer-events-auto">
                    <StackCard
                        label="My Stack"
                        value={<><span className="text-2xl opacity-80">💵</span> ${player?.chips.toLocaleString() || 0}</>}
                        showPing={isPlayerTurn}
                        className="min-w-[200px] md:min-w-[160px]"
                    >
                        {isPlayerTurn && (
                            <div className="text-xs font-bold text-yellow-400 uppercase tracking-widest animate-pulse mt-1">
                                Your Turn
                            </div>
                        )}
                    </StackCard>
                    <GameButton
                        onClick={onExit}
                        variant="ghost"
                        size="pill"
                        className={lobbyExitButton}
                    >
                        返回大廳
                    </GameButton>
                </div>

                {/* Right side: Controls */}
                <div className="absolute right-0 bottom-0 pointer-events-auto flex items-end justify-end gap-4">
                    {phase === 'BETTING' ? (
                        <GameButton
                            onClick={onStartRound}
                            variant="light"
                            size="pillXl"
                            className="text-xl animate-pulse transform hover:scale-105 uppercase tracking-wider"
                        >
                            開始新局
                        </GameButton>
                    ) : phase === 'RESULT' ? (
                        <GameButton
                            onClick={onStartRound}
                            variant="light"
                            size="pillXl"
                            className="text-xl animate-pulse transform hover:scale-105 uppercase tracking-wider"
                        >
                            繼續下一局
                        </GameButton>
                    ) : canBet ? (
                        <div className="flex items-end gap-3 animate-in slide-in-from-bottom-20 fade-in duration-300 relative">
                            {/* Bet panel */}
                            <div className="absolute bottom-[110%] right-0 mb-4 bg-black/90 backdrop-blur-xl p-4 rounded-[2rem] border border-yellow-500/20 shadow-2xl w-[300px] flex flex-col gap-3">
                                <div className="text-[10px] text-white/50 font-black uppercase tracking-widest text-center">
                                    {gapAdvice}
                                </div>

                                {/* Same Gate: Guess Selection */}
                                {needsGuess && (
                                    <div className="flex flex-col gap-2">
                                        <div className="text-center text-yellow-400 font-bold text-xs mb-1">
                                            👆 請選擇第三張牌比門柱大還是小
                                        </div>
                                        <div className="flex gap-3">
                                            <GameButton
                                                onClick={() => setSelectedGuess('LOW')}
                                                variant={selectedGuess === 'LOW' ? 'danger' : 'muted'}
                                                size="pill"
                                                className={`flex-1 text-lg font-bold py-3 ${selectedGuess === 'LOW' ? 'ring-2 ring-red-400' : ''}`}
                                            >
                                                ⬇️ 猜小
                                            </GameButton>
                                            <GameButton
                                                onClick={() => setSelectedGuess('HIGH')}
                                                variant={selectedGuess === 'HIGH' ? 'success' : 'muted'}
                                                size="pill"
                                                className={`flex-1 text-lg font-bold py-3 ${selectedGuess === 'HIGH' ? 'ring-2 ring-green-400' : ''}`}
                                            >
                                                ⬆️ 猜大
                                            </GameButton>
                                        </div>
                                    </div>
                                )}

                                {/* Bet display */}
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] text-white/50 font-black uppercase tracking-widest">下注金額</span>
                                    <span className="text-yellow-500 font-mono font-bold text-lg">$ {betAmount.toLocaleString()}</span>
                                </div>

                                {/* Slider */}
                                <RangeSlider
                                    min={minBet}
                                    max={maxBet}
                                    step={Math.max(1, Math.floor(maxBet / 100))}
                                    value={betAmount}
                                    onChange={(e) => setBetAmount(Number(e.target.value))}
                                    className="w-full"
                                />

                                {/* Quick bet buttons */}
                                <div className="flex gap-2">
                                    <GameButton
                                        onClick={() => setBetAmount(minBet)}
                                        variant="muted"
                                        size="pillSm"
                                        className="flex-1 text-[10px]"
                                    >
                                        底注
                                    </GameButton>
                                    <GameButton
                                        onClick={() => setBetAmount(Math.floor(maxBet * 0.5))}
                                        variant="muted"
                                        size="pillSm"
                                        className="flex-1 text-[10px]"
                                    >
                                        半池
                                    </GameButton>
                                    <GameButton
                                        onClick={() => setBetAmount(maxBet)}
                                        variant="muted"
                                        size="pillSm"
                                        className="flex-1 text-[10px]"
                                    >
                                        滿池
                                    </GameButton>
                                </div>
                            </div>

                            {/* Confirm bet button */}
                            <GameButton
                                onClick={handleConfirmBet}
                                disabled={needsGuess && !selectedGuess}
                                variant={needsGuess && !selectedGuess ? 'muted' : 'success'}
                                size="squareLg"
                                className="group flex flex-col items-center justify-center backdrop-blur-md"
                            >
                                <div className="mb-1 group-hover:scale-110 transition-transform text-2xl">
                                    {needsGuess && !selectedGuess ? '👆' : '🎯'}
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">
                                    {needsGuess && !selectedGuess ? '先選大小' : '確認下注'}
                                </span>
                            </GameButton>
                        </div>
                    ) : (
                        <PillPanel className="opacity-80 flex items-center gap-3">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce delay-100"></div>
                                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce delay-200"></div>
                            </div>
                            <span className="text-white/40 font-bold uppercase tracking-widest text-xs whitespace-nowrap">
                                等待其他玩家
                            </span>
                        </PillPanel>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GateControls;
