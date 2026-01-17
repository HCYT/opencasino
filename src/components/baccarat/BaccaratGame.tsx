import React, { useMemo, useState, useCallback } from 'react';
import { NPCProfile } from '../../types';
import { playSound } from '../../services/sound';
import { useBaccaratEngine } from '../../services/baccarat/useBaccaratEngine';
import { BaccaratSeat, BetType, BACCARAT_PAYOUTS, BaccaratPlayer } from '../../services/baccarat/types';
import TableFrame from '../table/TableFrame';
import CardDisplay from './CardDisplay';
import { GameButton } from '../ui/GameButton';
import StackCard from '../ui/StackCard';
import PlayerSeatCard from '../ui/PlayerSeatCard';
import {
    bottomDock,
    bottomDockInner,
    lobbyExitButton,
} from '../ui/sharedStyles';

interface BaccaratGameProps {
    seats: BaccaratSeat[];
    minBet: number;
    npcProfiles: NPCProfile[];
    onExit: () => void;
    onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: 'WIN' | 'LOSE' | 'PUSH' }>) => void;
}

// 下注圓盤組件
const BetChip: React.FC<{
    label: string;
    payout: string;
    amount: number;
    onBet: () => void;
    disabled: boolean;
    colorClass: string;
    size?: 'lg' | 'md' | 'sm';
}> = ({ label, payout, amount, onBet, disabled, colorClass, size = 'md' }) => {
    const sizeClasses = {
        lg: 'w-28 h-28 md:w-32 md:h-32',
        md: 'w-20 h-20 md:w-24 md:h-24',
        sm: 'w-16 h-16 md:w-20 md:h-20',
    };

    return (
        <button
            onClick={onBet}
            disabled={disabled}
            className={`
        relative flex flex-col items-center justify-center
        ${sizeClasses[size]} rounded-full
        border-4 transition-all duration-200
        shadow-[0_8px_16px_rgba(0,0,0,0.4),inset_0_2px_4px_rgba(255,255,255,0.2)]
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 hover:shadow-[0_12px_24px_rgba(0,0,0,0.5)] cursor-pointer active:scale-95'}
        ${colorClass}
      `}
        >
            <span className="text-base md:text-lg font-black drop-shadow-md">{label}</span>
            <span className="text-[10px] opacity-70">{payout}</span>
            {amount > 0 && (
                <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-[10px] font-black px-2 py-0.5 rounded-full shadow-lg border-2 border-yellow-600">
                    ${amount}
                </div>
            )}
        </button>
    );
};

// NPC 座位組件 - 使用共享 PlayerSeatCard
const NPCSeat: React.FC<{
    player: BaccaratPlayer;
    position: 'left' | 'right' | 'top';
    npcProfile?: NPCProfile;
}> = ({ player, position, npcProfile }) => {
    const positionClasses = {
        left: 'left-4 top-1/2 -translate-y-1/2',
        right: 'right-4 top-1/2 -translate-y-1/2',
        top: 'top-12 left-1/2 -translate-x-1/2',
    };

    // 構建下注資訊行
    const betLabels: Record<BetType, string> = {
        BANKER: '莊',
        PLAYER: '閒',
        TIE: '和',
        BANKER_PAIR: '莊對',
        PLAYER_PAIR: '閒對',
    };

    const lines = [];

    // 顯示下注
    if (player.bets.length > 0) {
        const betSummary = player.bets.map(b => `${betLabels[b.type]} $${b.amount}`).join(' / ');
        lines.push({ text: `下注：${betSummary}`, className: 'text-yellow-400' });
    }

    // 顯示輸贏結果
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

const BaccaratGame: React.FC<BaccaratGameProps> = ({
    seats,
    minBet,
    npcProfiles,
    onExit,
    onProfilesUpdate,
}) => {
    // 音效適配器
    const handlePlaySound = useCallback((name: string) => {
        switch (name) {
            case 'chip':
                playSound('chip-place');
                break;
            case 'deal':
                playSound('card-deal');
                break;
            case 'card':
                playSound('card-place');
                break;
            case 'win':
                playSound('slot-win');
                break;
            // lose 暫無特定音效
        }
    }, []);

    const {
        players,
        phase,
        bankerCards,
        playerCards,
        bankerPoints,
        playerPoints,
        bankerPair,
        playerPair,
        result,
        message,
        humanPlayer,
        placeBet,
        clearBets,
        startDeal,
        resetRound,
    } = useBaccaratEngine({
        seats,
        minBet,
        npcProfiles,
        onProfilesUpdate,
        playSound: handlePlaySound,
    });

    const [selectedBetAmount, setSelectedBetAmount] = useState(minBet);

    // 將 bets 數組轉換為 Map
    const betsMap = useMemo(() => {
        const map = new Map<BetType, number>();
        humanPlayer?.bets.forEach(b => {
            map.set(b.type, (map.get(b.type) || 0) + b.amount);
        });
        return map;
    }, [humanPlayer?.bets]);

    const getBet = (type: BetType) => betsMap.get(type) || 0;

    // 獲取 NPC 玩家
    const npcPlayers = players.filter(p => p.isAI);
    const npcPositions: Array<'left' | 'right' | 'top'> = ['left', 'right', 'top'];

    const isBetting = phase === 'BETTING';
    const isResult = phase === 'RESULT';
    const isDealing = phase === 'DEALING';
    const isPlayerTurn = isBetting;

    const statusText = isBetting
        ? '請下注'
        : isDealing
            ? message || '發牌中...'
            : isResult
                ? message
                : '遊戲進行中';

    return (
        <div className="game-container premium-table-bg relative overflow-visible select-none h-screen w-full">
            <TableFrame title="百家樂 Baccarat" statusText={statusText}>
                {/* NPC 座位 */}
                {npcPlayers.map((npc, index) => (
                    <NPCSeat
                        key={npc.name}
                        player={npc}
                        position={npcPositions[index % npcPositions.length]}
                        npcProfile={npcProfiles.find(p => p.name === npc.name)}
                    />
                ))}

                {/* 發牌區域 - 放在桌面中央 */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="flex gap-12 md:gap-20 items-start">
                        {/* 閒家（左側） */}
                        <CardDisplay
                            cards={playerCards}
                            points={playerPoints}
                            label="閒 PLAYER"
                            isPair={playerPair}
                            isWinner={result === 'PLAYER_WIN'}
                            colorTheme="player"
                        />

                        {/* 莊家（右側） */}
                        <CardDisplay
                            cards={bankerCards}
                            points={bankerPoints}
                            label="莊 BANKER"
                            isPair={bankerPair}
                            isWinner={result === 'BANKER_WIN'}
                            colorTheme="banker"
                        />
                    </div>
                </div>
            </TableFrame>

            {/* 底部控制區 - 使用共享樣式 */}
            <div className={bottomDock}>
                <div className={bottomDockInner}>
                    {/* 左側：玩家籌碼和退出 */}
                    <div className="absolute left-0 bottom-0 flex flex-col gap-3 pointer-events-auto">
                        <StackCard
                            label="My Stack"
                            value={<><span className="text-2xl opacity-80">💵</span> ${(humanPlayer?.chips ?? 0).toLocaleString()}</>}
                            showPing={isPlayerTurn}
                            className="min-w-[200px] md:min-w-[180px]"
                        >
                            {humanPlayer && humanPlayer.totalBetAmount > 0 && (
                                <div className="text-xs text-white/60 mt-1">
                                    已下注: <span className="text-yellow-400 font-bold">${humanPlayer.totalBetAmount}</span>
                                </div>
                            )}
                            {isResult && humanPlayer && (
                                <div className={`text-sm font-bold mt-1 ${humanPlayer.roundWinnings >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    本局: {humanPlayer.roundWinnings >= 0 ? '+' : ''}${humanPlayer.roundWinnings}
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

                    {/* 中央：下注區域（圓盤風格） */}
                    <div className="absolute left-1/2 bottom-4 -translate-x-1/2 pointer-events-auto">
                        {isBetting && (
                            <div className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                {/* 下注金額選擇 - 快捷按鈕 + 拉杆調整 */}
                                <div className="flex flex-col items-center gap-2 bg-black/60 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10">
                                    {/* 快捷按鈕 */}
                                    <div className="flex items-center gap-2">
                                        {[minBet, minBet * 5, minBet * 10, minBet * 25].map(amount => (
                                            <button
                                                key={amount}
                                                onClick={() => setSelectedBetAmount(Math.min(amount, humanPlayer?.chips || amount))}
                                                disabled={!humanPlayer || humanPlayer.chips < minBet}
                                                className={`
                                                    px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer
                                                    ${selectedBetAmount === amount
                                                        ? 'bg-yellow-500 text-black'
                                                        : 'bg-white/10 text-white/60 hover:bg-white/20'}
                                                    ${(!humanPlayer || humanPlayer.chips < amount) ? 'opacity-30' : ''}
                                                `}
                                            >
                                                ${amount}
                                            </button>
                                        ))}
                                    </div>
                                    {/* 拉杆調整 + 金額顯示 */}
                                    <div className="flex items-center gap-3 w-full">
                                        <span className="text-white/40 text-xs font-mono">${minBet}</span>
                                        <input
                                            type="range"
                                            min={minBet}
                                            max={Math.max(minBet, humanPlayer?.chips || minBet)}
                                            step={minBet}
                                            value={selectedBetAmount}
                                            onChange={(e) => setSelectedBetAmount(parseInt(e.target.value))}
                                            className="flex-1 h-8 bg-transparent appearance-none cursor-pointer focus:outline-none
                                                [&::-webkit-slider-runnable-track]:h-2
                                                [&::-webkit-slider-runnable-track]:bg-white/10
                                                [&::-webkit-slider-runnable-track]:rounded-full
                                                [&::-webkit-slider-runnable-track]:w-full
                                                
                                                [&::-webkit-slider-thumb]:appearance-none
                                                [&::-webkit-slider-thumb]:-mt-1.5
                                                [&::-webkit-slider-thumb]:w-5
                                                [&::-webkit-slider-thumb]:h-5
                                                [&::-webkit-slider-thumb]:rounded-full
                                                [&::-webkit-slider-thumb]:bg-gradient-to-b
                                                [&::-webkit-slider-thumb]:from-yellow-400
                                                [&::-webkit-slider-thumb]:to-yellow-600
                                                [&::-webkit-slider-thumb]:border-2
                                                [&::-webkit-slider-thumb]:border-yellow-300
                                                [&::-webkit-slider-thumb]:shadow-lg
                                                [&::-webkit-slider-thumb]:cursor-grab
                                                [&::-webkit-slider-thumb]:active:cursor-grabbing
                                                [&::-webkit-slider-thumb]:hover:scale-110
                                                [&::-webkit-slider-thumb]:transition-transform"
                                        />
                                        <div className="min-w-[70px] bg-black/50 text-yellow-400 font-bold text-sm px-3 py-1.5 rounded-full border border-yellow-500/30 text-center">
                                            ${selectedBetAmount}
                                        </div>
                                    </div>
                                </div>

                                {/* 下注圓盤 */}
                                <div className="flex items-center gap-3">
                                    <BetChip
                                        label="閒對"
                                        payout={`1:${BACCARAT_PAYOUTS.PLAYER_PAIR}`}
                                        amount={getBet('PLAYER_PAIR')}
                                        onBet={() => placeBet('PLAYER_PAIR', selectedBetAmount)}
                                        disabled={!humanPlayer || humanPlayer.chips < selectedBetAmount + humanPlayer.totalBetAmount}
                                        colorClass="bg-gradient-to-b from-blue-500 to-blue-700 border-blue-300 text-white"
                                        size="sm"
                                    />
                                    <BetChip
                                        label="閒"
                                        payout={`1:${BACCARAT_PAYOUTS.PLAYER}`}
                                        amount={getBet('PLAYER')}
                                        onBet={() => placeBet('PLAYER', selectedBetAmount)}
                                        disabled={!humanPlayer || humanPlayer.chips < selectedBetAmount + humanPlayer.totalBetAmount}
                                        colorClass="bg-gradient-to-b from-blue-400 to-blue-600 border-blue-200 text-white"
                                        size="lg"
                                    />
                                    <BetChip
                                        label="和"
                                        payout={`1:${BACCARAT_PAYOUTS.TIE}`}
                                        amount={getBet('TIE')}
                                        onBet={() => placeBet('TIE', selectedBetAmount)}
                                        disabled={!humanPlayer || humanPlayer.chips < selectedBetAmount + humanPlayer.totalBetAmount}
                                        colorClass="bg-gradient-to-b from-green-400 to-green-600 border-green-200 text-white"
                                        size="md"
                                    />
                                    <BetChip
                                        label="莊"
                                        payout={`1:${BACCARAT_PAYOUTS.BANKER}`}
                                        amount={getBet('BANKER')}
                                        onBet={() => placeBet('BANKER', selectedBetAmount)}
                                        disabled={!humanPlayer || humanPlayer.chips < selectedBetAmount + humanPlayer.totalBetAmount}
                                        colorClass="bg-gradient-to-b from-red-400 to-red-600 border-red-200 text-white"
                                        size="lg"
                                    />
                                    <BetChip
                                        label="莊對"
                                        payout={`1:${BACCARAT_PAYOUTS.BANKER_PAIR}`}
                                        amount={getBet('BANKER_PAIR')}
                                        onBet={() => placeBet('BANKER_PAIR', selectedBetAmount)}
                                        disabled={!humanPlayer || humanPlayer.chips < selectedBetAmount + humanPlayer.totalBetAmount}
                                        colorClass="bg-gradient-to-b from-red-500 to-red-700 border-red-300 text-white"
                                        size="sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* 右側：操作按鈕 */}
                    <div className="absolute right-0 bottom-0 pointer-events-auto flex items-end justify-end gap-4">
                        {isBetting ? (
                            <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                <GameButton
                                    onClick={clearBets}
                                    variant="muted"
                                    size="pill"
                                    disabled={!humanPlayer || humanPlayer.bets.length === 0}
                                    className="uppercase tracking-widest"
                                >
                                    清除
                                </GameButton>
                                <GameButton
                                    onClick={startDeal}
                                    variant="light"
                                    size="pillXl"
                                    disabled={!humanPlayer || humanPlayer.bets.length === 0}
                                    className={`text-xl uppercase tracking-wider ${humanPlayer?.bets.length ? 'animate-pulse' : ''}`}
                                >
                                    發牌
                                </GameButton>
                            </div>
                        ) : isResult ? (
                            <GameButton
                                onClick={resetRound}
                                variant="light"
                                size="pillXl"
                                className="text-xl animate-pulse uppercase tracking-wider"
                            >
                                下一局
                            </GameButton>
                        ) : (
                            <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-full border border-white/5 flex items-center gap-3">
                                <div className="flex gap-1">
                                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce"></div>
                                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:100ms]"></div>
                                    <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-bounce [animation-delay:200ms]"></div>
                                </div>
                                <span className="text-white/40 font-bold uppercase tracking-widest text-xs">
                                    發牌中
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BaccaratGame;
