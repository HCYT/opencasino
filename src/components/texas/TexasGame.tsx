import React, { useEffect, useState } from 'react';
import { useTexasEngine, TexasResult } from '../../services/texas/useTexasEngine';
import CardUI from '../CardUI';
import ShowdownControls from '../showdown/ShowdownControls';
import ShowdownTable from '../showdown/ShowdownTable';
import TexasSeat from './TexasSeat';
import { Player, GamePhase, NPCProfile } from '../../types';
import { getSeatLayout } from '../ui/seatLayout';
import { seatWrapper } from '../ui/sharedStyles';
import { playSound } from '../../services/sound';
import { Skull } from 'lucide-react';

interface TexasGameProps {
    onBack: () => void;
    isNightmareMode?: boolean;
    initialPlayers: Player[];
    npcProfiles: NPCProfile[];
    onProfilesUpdate?: (updates: Array<{ name: string; chips: number; result: TexasResult }>) => void;
}

const TexasGame: React.FC<TexasGameProps> = ({ onBack, isNightmareMode = false, initialPlayers, npcProfiles, onProfilesUpdate }) => {
    const { gameState, initGame, handleAction, startNewHand, returnToLobby, playerSpeak } = useTexasEngine({
        npcProfiles,
        onProfilesUpdate
    });

    const [userPlayer, setUserPlayer] = useState<Player | undefined>(undefined);

    // UI State for Controls
    const [customRaiseAmount, setCustomRaiseAmount] = useState(100);
    const [showChatMenu, setShowChatMenu] = useState(false);
    const [chatInput, setChatInput] = useState('');

    const handleExit = () => {
        returnToLobby();
        onBack();
    };

    useEffect(() => {
        if (initialPlayers.length > 0) {
            initGame(initialPlayers, false, 'NO_LIMIT');
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        setUserPlayer(gameState.players.find(p => p.id === 'player'));
    }, [gameState.players]);

    const activePlayer = gameState.players[gameState.activePlayerIndex];
    const isPlayerTurn = activePlayer?.id === 'player';

    // Calculation for Controls
    const isActive = isPlayerTurn;
    const callNeeded = userPlayer ? Math.max(0, gameState.currentMaxBet - userPlayer.currentBet) : 0;
    const minBet = 100;
    const raiseAmount = customRaiseAmount;
    const maxRaise = userPlayer ? userPlayer.chips : 0;
    const canRaise = userPlayer ? userPlayer.chips > callNeeded : false;
    const raiseTotal = (userPlayer?.currentBet || 0) + callNeeded + raiseAmount;

    useEffect(() => {
        if (gameState.phase === GamePhase.RESULT && gameState.winners.length > 0) {
            const userWon = gameState.winners.includes('player');
            if (userWon) {
                playSound('slot-win');
            } else {
                playSound('chip-fold');
            }
        }
    }, [gameState.phase, gameState.winners]);

    // Reset custom raise amount when new hand starts
    useEffect(() => {
        if (gameState.phase === GamePhase.PRE_FLOP) {
            setCustomRaiseAmount(100); // Reset to default value
        }
    }, [gameState.phase]);

    const getPhaseLabel = (phase: GamePhase): string => {
        switch (phase) {
            case GamePhase.PRE_FLOP: return '翻牌前';
            case GamePhase.FLOP: return '翻牌';
            case GamePhase.TURN: return '轉牌';
            case GamePhase.RIVER: return '河牌';
            case GamePhase.SHOWDOWN: return '攤牌';
            case GamePhase.RESULT: return '結算';
            default: return phase;
        }
    };

    const statusText = gameState.phase === GamePhase.RESULT
        ? '本局結束'
        : `${getPhaseLabel(gameState.phase)} - ${activePlayer?.name || ''} 思考中...`;

    return (
        <div className="game-container premium-table-bg relative overflow-visible select-none h-screen w-full">
            {/* Nightmare Mode Overlay */}
            {isNightmareMode && (
                <div className="absolute inset-0 bg-red-900/10 pointer-events-none z-0" />
            )}

            {/* Top Left Info Panel: Status + Pot */}
            <div className="absolute top-4 left-4 z-50 flex flex-col gap-2">
                {/* Status Badge */}
                <div className="bg-black/60 backdrop-blur-xl px-6 py-2 rounded-full border border-yellow-500/30 shadow-lg flex items-center gap-3">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                    <span className="text-yellow-400 font-black tracking-widest text-sm uppercase whitespace-nowrap">
                        {statusText}
                    </span>
                </div>

                {/* Pot Display */}
                <div className="bg-black/60 backdrop-blur-xl px-6 py-3 rounded-2xl border border-emerald-500/30 shadow-lg flex items-center gap-3">
                    <span className="text-2xl">💵</span>
                    <div className="flex flex-col">
                        <span className="text-emerald-400/60 text-[10px] font-black uppercase tracking-widest">底池</span>
                        <span className="text-emerald-400 font-mono font-black text-xl">${gameState.pot.toLocaleString()}</span>
                    </div>
                </div>

                {/* Nightmare Mode Badge */}
                {isNightmareMode && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-red-900/80 border border-red-500/50 rounded-full text-red-200 text-xs font-black uppercase tracking-widest animate-pulse">
                        <Skull size={14} />
                        惡夢模式
                        <Skull size={14} />
                    </div>
                )}

                {/* Result Announcement */}
                {(gameState.phase === GamePhase.RESULT || gameState.phase === GamePhase.SHOWDOWN) && gameState.winners.length > 0 && (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 backdrop-blur-xl px-6 py-4 rounded-2xl border border-yellow-500/40 shadow-lg animate-in slide-in-from-left fade-in duration-500">
                        <div className="text-yellow-400/60 text-[10px] font-black uppercase tracking-widest mb-1">🏆 本局結果</div>
                        <div className="text-yellow-400 font-black text-lg">
                            {gameState.winners.map(id => gameState.players.find(p => p.id === id)?.name).filter(Boolean).join(', ')}
                        </div>
                        <div className="text-emerald-400 font-mono font-black text-xl mt-1">
                            贏得 ${gameState.pot.toLocaleString()}
                        </div>
                    </div>
                )}
            </div>

            <ShowdownTable statusText="" pot={0} title="">
                {/* Community Cards - True Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4 z-30">
                    {gameState.communityCards?.map((card, idx) => (
                        <div
                            key={`comm-${idx}`}
                            className="animate-in fade-in zoom-in duration-500 shadow-2xl relative group"
                            style={{ animationDelay: `${idx * 150}ms` }}
                        >
                            <CardUI card={card} className="w-16 h-24 lg:w-20 lg:h-28 shadow-2xl ring-1 ring-black/20" />
                        </div>
                    ))}
                    {(!gameState.communityCards || gameState.communityCards.length === 0) && (
                        <div className="text-white/10 font-black text-5xl tracking-widest uppercase select-none">
                            TEXAS
                        </div>
                    )}
                </div>

                {/* Players */}
                {gameState.players.map((p, i) => {
                    const { style, vertical, seatPosition } = getSeatLayout(i, p.id === 'player');

                    return (
                        <div key={p.id} className={seatWrapper} style={style}>
                            <TexasSeat
                                player={p}
                                isActive={gameState.activePlayerIndex === i}
                                isWinner={gameState.winners.includes(p.id)}
                                phase={gameState.phase}
                                vertical={vertical}
                                isMe={p.id === 'player'}
                                seatPosition={seatPosition}
                            />
                        </div>
                    );
                })}
            </ShowdownTable>

            <ShowdownControls
                phase={gameState.phase}
                minBet={minBet}
                user={userPlayer || { chips: 0, currentBet: 0 } as Player}
                isUserTurn={isActive}
                callNeeded={callNeeded}
                canRaise={canRaise}
                raiseAmount={raiseAmount}
                raiseTotal={raiseTotal}
                maxRaise={maxRaise}
                betMode="NO_LIMIT"
                customRaiseAmount={customRaiseAmount}
                setCustomRaiseAmount={setCustomRaiseAmount}
                showChatMenu={showChatMenu}
                setShowChatMenu={setShowChatMenu}
                chatInput={chatInput}
                setChatInput={setChatInput}
                playerSpeak={playerSpeak}
                onAction={handleAction}
                onStartNewHand={startNewHand}
                onExit={handleExit}
            />
        </div>
    );
};

export default TexasGame;
