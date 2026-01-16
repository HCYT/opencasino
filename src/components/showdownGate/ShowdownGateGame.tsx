import React from 'react';
import { NPCProfile } from '../../types';
import { useShowdownGateEngine } from '../../services/showdownGate/useShowdownGateEngine';
import { GateSeat as GateSeatType, GateResult } from '../../services/showdownGate/types';
import ShowdownTable from '../showdown/ShowdownTable';
import GateSeat from './GateSeat';
import GateControls from './GateControls';
import { getSeatLayout } from '../ui/seatLayout';
import { seatWrapper } from '../ui/sharedStyles';

interface ShowdownGateGameProps {
    seats: GateSeatType[];
    anteBet: number;
    npcProfiles: NPCProfile[];
    resolveChips: (name: string) => number;
    onExit: () => void;
    onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: GateResult }>) => void;
}

const ShowdownGateGame: React.FC<ShowdownGateGameProps> = ({
    seats,
    anteBet,
    npcProfiles,
    resolveChips,
    onExit,
    onProfilesUpdate,
}) => {
    const {
        players,
        pot,
        phase,
        currentPlayerIndex,
        message,
        isPlayerTurn,
        player,
        isSameGate,
        getGateGap,
        startRound,
        placeBet,
        resetToBetting,
    } = useShowdownGateEngine({
        seats,
        anteBet,
        npcProfiles,
        resolveChips,
        onProfilesUpdate,
    });

    const handleStartOrContinue = () => {
        if (phase === 'RESULT') {
            resetToBetting();
            setTimeout(() => startRound(), 100);
        } else {
            startRound();
        }
    };

    const statusText = phase === 'BETTING'
        ? '等待開局'
        : phase === 'RESULT'
            ? '回合結束'
            : message || `${players[currentPlayerIndex]?.name || ''} 思考中...`;

    return (
        <div className="game-container bg-[#052c16] relative overflow-visible select-none h-screen w-full">
            <ShowdownTable title="射龍門" statusText={statusText} pot={pot}>
                {players.map((p, i) => {
                    if (!p) return null;
                    const { style, vertical, seatPosition } = getSeatLayout(i, p.id === 'player');
                    const isWinner = p.result === 'WIN';
                    const isActive = currentPlayerIndex === i && phase === 'PLAYER_TURN';

                    return (
                        <div key={p.id} className={seatWrapper} style={style}>
                            <GateSeat
                                player={p}
                                isActive={isActive}
                                isWinner={isWinner}
                                phase={phase}
                                vertical={vertical}
                                isMe={p.id === 'player'}
                                seatPosition={seatPosition}
                            />
                        </div>
                    );
                })}
            </ShowdownTable>

            {/* Controls */}
            {player && (
                <GateControls
                    player={player}
                    pot={pot}
                    anteBet={anteBet}
                    isPlayerTurn={isPlayerTurn}
                    isSameGate={isSameGate()}
                    gateGap={getGateGap()}
                    onPlaceBet={placeBet}
                    onStartRound={handleStartOrContinue}
                    onExit={onExit}
                    phase={phase}
                />
            )}
        </div>
    );
};

export default ShowdownGateGame;
