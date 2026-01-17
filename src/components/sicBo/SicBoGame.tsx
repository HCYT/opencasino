import React, { useEffect, useState, useMemo } from 'react';
import { NPCProfile } from '../../types';
import { useSicBoEngine } from '../../services/sicBo/useSicBoEngine';
import { SicBoSeat, SicBoBetType, SicBoBet } from '../../services/sicBo/types';
import { checkBetWin } from '../../services/sicBo/rules';
import TableFrame from '../table/TableFrame';
import Dice3D from './Dice3D';
import BettingBoard from './BettingBoard';
import { GameButton } from '../ui/GameButton';
import PlayerSeatCard from '../ui/PlayerSeatCard';
import { bottomDock, bottomDockInner, lobbyExitButton } from '../ui/sharedStyles';
import './SicBoGame.css';

interface SicBoGameProps {
    seats: SicBoSeat[];
    minBet: number;
    npcProfiles: NPCProfile[];
    onExit: () => void;
    onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: 'WIN' | 'LOSE' | 'PUSH' }>) => void;
}

// 移除舊的 CHIP_VALUES
// const CHIP_VALUES = [10, 50, 100, 500, 1000];

const SicBoGame: React.FC<SicBoGameProps> = ({
    seats,
    minBet,
    npcProfiles,
    onExit,
    onProfilesUpdate,
}) => {
    // NPC 座位組件
    const NPCSeat: React.FC<{
        player: any; // 暫時使用 any 避免複雜類型轉換，實際是 SicBoPlayer
        position: 'left' | 'right' | 'top';
        npcProfile?: NPCProfile;
    }> = ({ player, position, npcProfile }) => {
        const positionClasses = {
            left: 'left-4 top-1/2 -translate-y-1/2',
            right: 'right-4 top-1/2 -translate-y-1/2',
            top: 'top-12 left-1/2 -translate-x-1/2',
        };

        const lines = [];
        if (player.totalBetAmount > 0) {
            lines.push({ text: `下注: $${player.totalBetAmount.toLocaleString()}`, className: 'text-yellow-400' });
        }
        if (player.roundWinnings !== 0) {
            const sign = player.roundWinnings > 0 ? '+' : '';
            lines.push({
                text: `${sign}$${player.roundWinnings}`,
                className: player.roundWinnings > 0 ? 'text-green-400 font-bold' : 'text-red-400 font-bold'
            });
        }

        return (
            <div className={`absolute ${positionClasses[position]} z-10 pointer-events-none`}>
                <PlayerSeatCard
                    name={player.name}
                    avatar={npcProfile?.avatar || '/avatars/default.png'}
                    isAI={true}
                    isActive={false}
                    stat={{ value: `$${player.chips.toLocaleString()}`, label: '籌碼' }}
                    quote={player.quote}
                    lines={lines}
                />
            </div>
        );
    };

    const {
        gameState,
        placeBet,
        removeBet,
        clearBets,
        roll,
        newRound,
        history,
        cleanup,
    } = useSicBoEngine({
        seats,
        minBet,
        npcProfiles,
        onProfilesUpdate,
    });

    const [selectedBetAmount, setSelectedBetAmount] = useState(minBet);
    const humanPlayer = gameState.players.find(p => !p.isAI);
    const npcPlayers = gameState.players.filter(p => p.isAI);
    const npcPositions: Array<'left' | 'right' | 'top'> = ['left', 'right', 'top'];

    // 計算勝出的下注類型
    const [winningBets, setWinningBets] = useState<SicBoBetType[]>([]);

    useEffect(() => {
        if (gameState.phase === 'RESULT') {
            // 找出所有勝出的下注類型
            const allBetTypes: SicBoBetType[] = [
                'BIG', 'SMALL', 'ODD', 'EVEN', 'ANY_TRIPLE',
                ...([1, 2, 3, 4, 5, 6].map(n => `SINGLE_${n}` as SicBoBetType)),
                ...([1, 2, 3, 4, 5, 6].map(n => `DOUBLE_${n}` as SicBoBetType)),
                ...([1, 2, 3, 4, 5, 6].map(n => `TRIPLE_${n}` as SicBoBetType)),
                ...([4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(n => `TOTAL_${n}` as SicBoBetType)),
            ];

            const winners = allBetTypes.filter(type => checkBetWin(type, gameState.dice));
            setWinningBets(winners);
        } else {
            setWinningBets([]);
        }
    }, [gameState.phase, gameState.dice]);

    // 清理
    useEffect(() => {
        return () => cleanup();
    }, [cleanup]);

    const handlePlaceBet = (type: SicBoBetType, amount: number) => {
        if (humanPlayer) {
            placeBet(humanPlayer.id, type, amount);
        }
    };

    const handleRemoveBet = (type: SicBoBetType) => {
        if (humanPlayer) {
            removeBet(humanPlayer.id, type);
        }
    };

    const handleClearBets = () => {
        if (humanPlayer) {
            clearBets(humanPlayer.id);
        }
    };

    const statusText = gameState.phase === 'BETTING'
        ? '請下注'
        : gameState.phase === 'ROLLING'
            ? '搖骰中...'
            : gameState.message;

    // 聚合所有玩家的下注，使用 useMemo 優化效能並確保計算正確
    const totalBets = useMemo(() => {
        const betMap = new Map<SicBoBetType, SicBoBet>();

        gameState.players.forEach(player => {
            player.bets.forEach(bet => {
                const existing = betMap.get(bet.type);
                if (existing) {
                    existing.amount += bet.amount;
                } else {
                    // 必須建立新物件以避免引用副作用
                    betMap.set(bet.type, { ...bet });
                }
            });
        });

        return Array.from(betMap.values());
    }, [gameState.players]);

    return (
        <div className="game-container premium-table-bg relative overflow-visible select-none h-screen w-full">
            <TableFrame title="骰寶 Sic Bo" statusText={statusText}>
                {/* NPC 座位 */}
                {npcPlayers.map((npc, index) => (
                    <NPCSeat
                        key={npc.name}
                        player={npc}
                        position={npcPositions[index % npcPositions.length]}
                        npcProfile={npcProfiles.find(p => p.name === npc.name)}
                    />
                ))}

                {/* 歷史紀錄 */}
                <div className="absolute top-16 left-24 z-10 flex gap-2 bg-black/40 backdrop-blur-md px-3 py-2 rounded-full border border-white/10 max-w-[400px] overflow-x-auto no-scrollbar pointer-events-auto shadow-lg items-center">
                    <span className="text-white/50 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap mr-1">History</span>
                    {history.slice(-10).reverse().map((result, i) => (
                        <div
                            key={i}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/20 shadow-lg shrink-0
                                ${result.isTriple ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-yellow-300'
                                    : result.total >= 11 ? 'bg-gradient-to-br from-red-600 to-red-800 text-white'
                                        : 'bg-gradient-to-br from-blue-600 to-blue-800 text-white'}`}
                        >
                            {result.total}
                        </div>
                    ))}
                </div>

                {/* 骰子區域 - 強制置頂, z-index 500, 調整高度避開 NPC (位於 NPC 與下注盤中間) */}
                <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-full h-[200px] max-w-2xl z-[500] pointer-events-none">
                    <Dice3D
                        dice={gameState.dice}
                        isRolling={gameState.phase === 'ROLLING'}
                    />
                </div>

                {/* 下注盤 */}
                <div className="absolute inset-x-0 top-[42%] bottom-28 flex items-center justify-center p-4 pointer-events-none">
                    <div className="pointer-events-auto transform scale-90 md:scale-100 origin-center transition-transform">
                        <BettingBoard
                            totalBets={totalBets}
                            userBets={humanPlayer?.bets || []}
                            npcBets={gameState.players.filter(p => p.isAI).flatMap(p => p.bets)}
                            onPlaceBet={handlePlaceBet}
                            onRemoveBet={handleRemoveBet}
                            disabled={gameState.phase !== 'BETTING'}
                            currentBetAmount={selectedBetAmount}
                            winningBets={winningBets}
                        />
                    </div>
                </div>
            </TableFrame>

            {/* 底部控制區 - 使用共享樣式 */}
            <div className={bottomDock}>
                <div className={bottomDockInner}>
                    {/* 左側：玩家籌碼和退出 */}
                    <div className="absolute left-0 bottom-0 flex flex-col gap-3 pointer-events-auto">
                        <div className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex flex-col min-w-[160px]">
                            <span className="text-xs text-white/50 uppercase tracking-wider">My Stack</span>
                            <div className="flex items-center gap-2">
                                <span className="text-xl opacity-80">💵</span>
                                <span className="text-xl font-bold text-yellow-400 font-mono">${(humanPlayer?.chips || 0).toLocaleString()}</span>
                            </div>
                            {humanPlayer && humanPlayer.totalBetAmount > 0 && (
                                <div className="text-xs text-white/60 mt-1 pt-1 border-t border-white/5">
                                    下注: <span className="text-yellow-400">${humanPlayer.totalBetAmount.toLocaleString()}</span>
                                </div>
                            )}
                            {gameState.phase === 'RESULT' && humanPlayer && (
                                <div className={`text-sm font-bold mt-1 ${humanPlayer.roundWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {humanPlayer.roundWinnings >= 0 ? '+' : ''}${humanPlayer.roundWinnings.toLocaleString()}
                                </div>
                            )}
                        </div>

                        <GameButton
                            variant="ghost"
                            size="pill"
                            onClick={onExit}
                            className={lobbyExitButton}
                        >
                            離開
                        </GameButton>
                    </div>

                    {/* 中央：下注金額選擇 */}
                    <div className="absolute left-1/2 bottom-4 -translate-x-1/2 pointer-events-auto">
                        {gameState.phase === 'BETTING' && (
                            <div className="flex flex-col items-center gap-2 bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 animate-in fade-in slide-in-from-bottom-4 min-w-[320px]">
                                {/* 快捷按鈕 */}
                                <div className="flex items-center gap-2 w-full justify-center">
                                    {[minBet, minBet * 5, minBet * 10, minBet * 50].map(amount => (
                                        <button
                                            key={amount}
                                            onClick={() => setSelectedBetAmount(Math.min(amount, humanPlayer?.chips || amount))}
                                            disabled={!humanPlayer || humanPlayer.chips < minBet}
                                            className={`
                                                px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer border border-white/10
                                                ${selectedBetAmount === amount
                                                    ? 'bg-yellow-500 text-black border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                                                    : 'bg-white/5 text-white/60 hover:bg-white/20 hover:text-white'}
                                                ${(!humanPlayer || humanPlayer.chips < amount) ? 'opacity-30' : ''}
                                            `}
                                        >
                                            ${amount}
                                        </button>
                                    ))}
                                </div>

                                {/* 拉杆調整與顯示 */}
                                <div className="flex items-center gap-3 w-full">
                                    <span className="text-white/40 text-xs font-mono w-8 text-right">${minBet}</span>
                                    <input
                                        type="range"
                                        min={minBet}
                                        max={Math.max(minBet, humanPlayer?.chips || minBet)}
                                        step={minBet}
                                        value={selectedBetAmount}
                                        onChange={(e) => setSelectedBetAmount(parseInt(e.target.value))}
                                        className="flex-1 h-6 bg-transparent appearance-none cursor-pointer focus:outline-none 
                                            [&::-webkit-slider-runnable-track]:h-1.5
                                            [&::-webkit-slider-runnable-track]:bg-white/10
                                            [&::-webkit-slider-runnable-track]:rounded-full
                                            [&::-webkit-slider-thumb]:appearance-none
                                            [&::-webkit-slider-thumb]:-mt-2
                                            [&::-webkit-slider-thumb]:w-5
                                            [&::-webkit-slider-thumb]:h-5
                                            [&::-webkit-slider-thumb]:rounded-full
                                            [&::-webkit-slider-thumb]:bg-gradient-to-b
                                            [&::-webkit-slider-thumb]:from-yellow-400
                                            [&::-webkit-slider-thumb]:to-yellow-600
                                            [&::-webkit-slider-thumb]:border-2
                                            [&::-webkit-slider-thumb]:border-yellow-300
                                            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(234,179,8,0.5)]
                                            [&::-webkit-slider-thumb]:transition-transform
                                            [&::-webkit-slider-thumb]:hover:scale-110"
                                    />
                                    <div className="min-w-[70px] bg-black/50 text-yellow-400 font-bold text-sm px-2 py-1 rounded-lg border border-yellow-500/30 text-center font-mono shadow-inner">
                                        ${selectedBetAmount}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右側：動作按鈕 */}
                    <div className="absolute right-0 bottom-0 pointer-events-auto flex items-end justify-end gap-4">
                        {gameState.phase === 'BETTING' && (
                            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4">
                                <GameButton
                                    variant="muted"
                                    size="pill"
                                    onClick={handleClearBets}
                                    disabled={!humanPlayer || humanPlayer.bets.length === 0}
                                    className="uppercase tracking-widest"
                                >
                                    清除
                                </GameButton>
                                <GameButton
                                    variant="primary"
                                    size="pillXl"
                                    onClick={roll}
                                    disabled={!humanPlayer || humanPlayer.bets.length === 0}
                                    className={`text-xl uppercase tracking-wider ${humanPlayer?.bets.length ? 'animate-pulse' : ''}`}
                                >
                                    搖骰
                                </GameButton>
                            </div>
                        )}
                        {gameState.phase === 'RESULT' && (
                            <GameButton
                                variant="light"
                                size="pillXl"
                                onClick={newRound}
                                className="text-xl animate-pulse uppercase tracking-wider"
                            >
                                下一局
                            </GameButton>
                        )}
                        {gameState.phase === 'ROLLING' && (
                            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 flex items-center gap-3">
                                <span className="text-white/40 font-bold uppercase tracking-widest text-xs">
                                    搖骰中...
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SicBoGame;
