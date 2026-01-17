import React, { useMemo, useState } from 'react';
import { Card, NPCProfile } from '../../types';
import CardUI from '../CardUI';
import { GameButton } from '../ui/GameButton';
import PlayerSeatCard from '../ui/PlayerSeatCard';
import ResultCard from '../ui/ResultCard';
import StatusPanel from '../ui/StatusPanel';
import TableFrame from '../table/TableFrame';
import StackCard from '../ui/StackCard';
import ResultOverlay from '../ui/ResultOverlay';
import ToastBanner from '../ui/ToastBanner';
import SevensBoard from './SevensBoard';
import {
    bottomDock,
    bottomDockInner,
    lobbyExitButton,
    seatWrapper
} from '../ui/sharedStyles';
import { SevensSeat, SevensResult, SevensGameVariant } from '../../services/sevens/types';
import { useSevensEngine } from '../../services/sevens/useSevensEngine';
import { getPlayableCards, cardKey, calculateScore } from '../../services/sevens/rules';

export type { SevensResult, SevensSeat } from '../../services/sevens/types';

interface SevensGameProps {
    seats: SevensSeat[];
    baseBet: number;
    variant: SevensGameVariant;
    npcProfiles: NPCProfile[];
    nightmareMode?: boolean;
    onExit: () => void;
    onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: SevensResult }>) => void;
}

const SevensGame: React.FC<SevensGameProps> = ({
    seats,
    baseBet,
    variant,
    npcProfiles,
    nightmareMode = false,
    onExit,
    onProfilesUpdate
}) => {
    const [selectedCardKey, setSelectedCardKey] = useState<string | null>(null);

    const {
        players,
        board,
        currentTurnIndex,
        phase,
        finishedOrder,
        message,
        setMessage,
        payoutSummary,
        isFirstMove,
        initializeGame,
        handlePlayCard,
        handlePassCard,
        canPass
    } = useSevensEngine({
        seats,
        baseBet,
        npcProfiles,
        variant,
        nightmareMode,
        onProfilesUpdate
    });

    const playerIndex = players.findIndex(p => !p.isAI);
    const player = players[playerIndex];
    const isPlayerTurn = phase === 'PLAYING' && playerIndex >= 0 && currentTurnIndex === playerIndex;

    // Get playable cards for the current player
    const playableCards = useMemo(() => {
        if (!player || phase !== 'PLAYING') return new Set<string>();
        return new Set(getPlayableCards(player.hand, board).map(cardKey));
    }, [player, board, phase]);

    const handleCardClick = (card: Card) => {
        if (!isPlayerTurn) return;
        const key = cardKey(card);

        if (selectedCardKey === key) {
            // Double click to play (only for playable cards, not for pass)
            if (playableCards.has(key)) {
                const success = handlePlayCard(playerIndex, card);
                if (success) setSelectedCardKey(null);
            }
            // For pass, user must use the pass button - don't auto-pass on double click
        } else {
            setSelectedCardKey(key);
        }
    };

    const handlePlay = () => {
        if (!player || !selectedCardKey) return;
        const card = player.hand.find(c => cardKey(c) === selectedCardKey);
        if (card && playableCards.has(selectedCardKey)) {
            const success = handlePlayCard(playerIndex, card);
            if (success) setSelectedCardKey(null);
        } else {
            setMessage('請選擇可出的牌！');
        }
    };

    const handlePass = () => {
        if (!player || !selectedCardKey) {
            setMessage('請先選擇要蓋的牌！');
            return;
        }
        const card = player.hand.find(c => cardKey(c) === selectedCardKey);
        if (card) {
            const success = handlePassCard(playerIndex, card);
            if (success) setSelectedCardKey(null);
        }
    };

    // Sort players for ranking: Finished players (in order) followed by unfinished players (sorted by current score)
    const ranking = useMemo(() => {
        if (phase !== 'RESULT') return [];

        const sorted = [...players].sort((a, b) => {
            const aFinishOrder = finishedOrder.indexOf(players.indexOf(a));
            const bFinishOrder = finishedOrder.indexOf(players.indexOf(b));
            const aFinished = aFinishOrder >= 0;
            const bFinished = bFinishOrder >= 0;

            if (aFinished && !bFinished) return -1;
            if (!aFinished && bFinished) return 1;
            if (aFinished && bFinished) return aFinishOrder - bFinishOrder;

            // For unfinished, higher score (penalty) is worse (lower rank)
            // But actually we want 1st, 2nd, 3rd... so Losers are last.
            // Within losers, lower penalty is better? Or doesn't matter much as usually 1 loser.
            const aScore = calculateScore([...a.passedCards, ...a.hand]);
            const bScore = calculateScore([...b.passedCards, ...b.hand]);
            return aScore - bScore;
        });

        return sorted;
    }, [phase, players, finishedOrder]);

    return (
        <div className="game-container premium-table-bg relative overflow-visible select-none h-screen w-full">
            <TableFrame
                title="慈善撲克王大賽 · 牌七"
                statusText={phase === 'RESULT' ? '本局結束' : `${players[currentTurnIndex]?.name || ''} 出牌中...`}
                overlay={
                    <>
                        {players.map((p, i) => {
                            let style: React.CSSProperties = {};
                            let vertical = false;

                            if (p.id === 'player') {
                                style = { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' };
                            } else if (i === 1) {
                                style = { left: '4rem', top: '50%', transform: 'translateY(-50%)' };
                                vertical = true;
                            } else if (i === 2) {
                                style = { top: '3rem', left: '50%', transform: 'translateX(-50%)' };
                            } else {
                                style = { right: '4rem', top: '50%', transform: 'translateY(-50%)' };
                                vertical = true;
                            }

                            const isActiveSeat = phase === 'PLAYING' && currentTurnIndex === i;

                            return (
                                <div key={p.id} className={seatWrapper} style={style}>
                                    <PlayerSeatCard
                                        name={p.name}
                                        avatar={p.avatar}
                                        isAI={p.isAI}
                                        isActive={isActiveSeat}
                                        vertical={vertical}
                                        stat={{ value: `${p.hand.length} 張`, label: '手牌' }}
                                        quote={p.quote}
                                        lines={[
                                            ...(p.passedCards.length > 0
                                                ? [{ text: `蓋 ${p.passedCards.length} 張`, className: 'text-red-300' }]
                                                : []),
                                            ...(p.finished
                                                ? [{ text: '已出完', className: 'text-yellow-300' }]
                                                : [])
                                        ]}
                                    />
                                </div>
                            );
                        })}
                    </>
                }
            >
                <div className="flex flex-col items-center justify-center gap-4 z-10">
                    <div className="text-yellow-500/40 font-black text-[10px] tracking-[0.5em] casino-font uppercase mb-2">
                        牌堆
                    </div>
                    <SevensBoard board={board} />
                    {isFirstMove && (
                        <div className="text-emerald-300 font-bold text-sm mt-2 animate-pulse">
                            首家必須出 ♠7
                        </div>
                    )}
                </div>
            </TableFrame>

            <div className={bottomDock}>
                <div className={bottomDockInner}>
                    <div className="absolute left-0 bottom-0 flex flex-col gap-3 pointer-events-auto">
                        <StackCard
                            label="My Stack"
                            value={
                                <>
                                    <span className="text-2xl opacity-80">💵</span> ${player?.chips.toLocaleString() || 0}
                                </>
                            }
                            showPing={isPlayerTurn}
                            size="md"
                            className="min-w-[220px]"
                        >
                            <div className="text-[10px] text-white/50 uppercase tracking-widest">
                                手牌 {player?.hand.length || 0} 張 · 蓋牌 {player?.passedCards.length || 0} 張
                            </div>
                            <div className="text-[10px] text-white/50 uppercase tracking-widest">
                                每點 ${baseBet.toLocaleString()}
                            </div>
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

                    <div className="absolute right-0 bottom-0 pointer-events-auto flex items-end gap-4 h-[180px]">
                        {phase === 'PLAYING' && (
                            <div className="flex items-end gap-3">
                                {isPlayerTurn ? (
                                    <div className="flex items-end gap-3">
                                        <GameButton
                                            onClick={handlePlay}
                                            disabled={!selectedCardKey || !playableCards.has(selectedCardKey)}
                                            variant="success"
                                            size="squareMd"
                                            className="uppercase tracking-widest"
                                        >
                                            出牌
                                        </GameButton>
                                        <GameButton
                                            onClick={handlePass}
                                            disabled={!canPass(playerIndex) || !selectedCardKey}
                                            variant="danger"
                                            size="squareMd"
                                            className="uppercase tracking-widest"
                                        >
                                            蓋牌
                                        </GameButton>
                                    </div>
                                ) : (
                                    <StatusPanel>NPC 行動中</StatusPanel>
                                )}
                            </div>
                        )}

                        {phase === 'RESULT' && (
                            <div className="flex items-end gap-3">
                                <StatusPanel className="text-yellow-300">本局結束</StatusPanel>
                                <GameButton
                                    onClick={initializeGame}
                                    variant="light"
                                    size="pillLg"
                                >
                                    再來一局
                                </GameButton>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {phase === 'RESULT' && ranking.length > 0 && (
                <ResultOverlay
                    title="慈善撲克王大賽"
                    subtitle="牌七名次"
                    titleClassName="text-[6rem] md:text-[8rem] font-black text-yellow-500 drop-shadow-[0_0_60px_rgba(0,0,0,1)] casino-font mb-4 italic tracking-tight text-shadow"
                    subtitleClassName="text-2xl md:text-3xl font-black mb-6 text-sky-400"
                >
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        {ranking.map((p, idx) => (
                            <ResultCard key={p.id} className="max-w-[340px]">
                                <div className="text-yellow-300 text-sm font-black uppercase tracking-widest">
                                    第 {idx + 1} 名
                                </div>
                                <img
                                    src={p.avatar}
                                    alt={p.name}
                                    className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400/40 shadow-[0_0_30px_rgba(234,179,8,0.35)] mx-auto mt-3"
                                />
                                <div className="text-white text-2xl font-black mt-4 tracking-tight">{p.name}</div>
                                <div className="text-white/60 text-sm mt-2">
                                    蓋牌 {p.passedCards.length + p.hand.length} 張 · {calculateScore([...p.passedCards, ...p.hand])} 點
                                </div>
                            </ResultCard>
                        ))}
                    </div>
                    {payoutSummary && (
                        <div className="mt-8 bg-black/40 backdrop-blur-sm rounded-2xl p-6 max-w-xl mx-auto">
                            <div className="text-yellow-400 font-black text-lg mb-4">
                                🏆 {payoutSummary.winnerName} 獲得 ${payoutSummary.totalGain.toLocaleString()}
                            </div>
                            <div className="space-y-2 text-sm">
                                {payoutSummary.lines.map((line, idx) => (
                                    <div key={idx} className="flex justify-between text-white/70">
                                        <span>{line.name}: {line.passedCount} 張蓋牌 ({line.passedScore} 點)</span>
                                        <span className="text-red-400">${Math.abs(line.amount).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </ResultOverlay>
            )}

            {message && phase === 'PLAYING' && (
                <ToastBanner>{message}</ToastBanner>
            )}

            {player && phase === 'PLAYING' && (
                <div className="absolute bottom-[15rem] left-1/2 -translate-x-1/2 flex flex-nowrap justify-center px-4 pl-[220px] pr-[260px] w-[92vw] max-w-[1400px] pointer-events-auto z-[80]">
                    {player.hand.map((card, idx) => {
                        const key = cardKey(card);
                        const selected = selectedCardKey === key;
                        const isPlayable = playableCards.has(key);

                        return (
                            <button
                                key={key}
                                onClick={() => handleCardClick(card)}
                                className={`relative transition-transform ${idx > 0 ? '-ml-6 md:-ml-5' : ''} ${selected ? '-translate-y-4 scale-105' : ''}`}
                                style={{ zIndex: idx + 1 }}
                            >
                                <CardUI
                                    card={card}
                                    className={`${selected ? 'ring-2 ring-yellow-400' : ''} ${!isPlayable ? 'brightness-75' : ''}`}
                                />
                                {isPlayable && (
                                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-pulse" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SevensGame;
