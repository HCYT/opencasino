import React from 'react';
import CardUI from '../CardUI';
import PlayerSeatCard from '../ui/PlayerSeatCard';
import { GatePlayer, GateResult } from '../../services/showdownGate/types';

interface GateSeatProps {
    player: GatePlayer;
    isActive: boolean;
    isWinner: boolean;
    phase: 'BETTING' | 'PLAYER_TURN' | 'RESULT';
    vertical?: boolean;
    isMe?: boolean;
    seatPosition?: 'left' | 'right' | 'top' | 'bottom';
}

const resultLabels: Record<GateResult & string, string> = {
    WIN: '中門！',
    LOSE: '射歪',
    POST: '撞柱 x2',
    TRIPLE_POST: '撞柱 x3',
};

const GateSeat: React.FC<GateSeatProps> = ({
    player,
    isActive,
    isWinner,
    phase,
    vertical,
    isMe,
    seatPosition
}) => {
    const dealVars = (() => {
        switch (seatPosition) {
            case 'left':
                return { ['--deal-x' as const]: '160px', ['--deal-y' as const]: '0px' };
            case 'right':
                return { ['--deal-x' as const]: '-160px', ['--deal-y' as const]: '0px' };
            case 'top':
                return { ['--deal-x' as const]: '0px', ['--deal-y' as const]: '140px' };
            case 'bottom':
            default:
                return { ['--deal-x' as const]: '0px', ['--deal-y' as const]: '-140px' };
        }
    })();

    // 組合所有牌（門柱 + 第三張）
    const allCards = [...player.gateCards, ...(player.thirdCard ? [player.thirdCard] : [])];

    const cardsSection = (
        <div
            className="flex flex-row justify-center min-h-[100px] md:min-h-[120px] items-center"
            style={dealVars}
        >
            {allCards.map((c, i) => {
                const isThirdCard = i === 2;
                return (
                    <CardUI
                        key={i}
                        card={c}
                        className={`deal-card ${i > 0 ? '-ml-6 md:-ml-5' : ''} ${isThirdCard ? 'ring-2 ring-yellow-400' : ''}`}
                        style={{ zIndex: i + 1 }}
                    />
                );
            })}
        </div>
    );

    const lines = [
        ...(player.currentBet > 0 && player.turnStatus !== 'RESOLVED'
            ? [{ text: `下注 $${player.currentBet}`, className: 'text-emerald-300' }]
            : []),
        ...(player.guess
            ? [{ text: `猜 ${player.guess === 'HIGH' ? '大' : '小'}`, className: 'text-yellow-300' }]
            : []),
        ...(player.result
            ? [{
                text: resultLabels[player.result] || '',
                className: player.result === 'WIN' ? 'text-emerald-400' : 'text-red-400'
            }]
            : [])
    ];

    const seatCard = (
        <PlayerSeatCard
            name={player.name}
            avatar={player.avatar}
            isAI={player.isAI}
            isActive={isActive}
            vertical={vertical}
            stat={{ value: `$ ${player.chips.toLocaleString()}`, label: '籌碼' }}
            quote={player.quote}
            lines={lines}
        />
    );

    return (
        <div className={`flex flex-col items-center gap-4 pointer-events-auto transition-all duration-700 relative`}>
            {seatPosition === 'top' ? (
                <>
                    {seatCard}
                    {cardsSection}
                </>
            ) : (
                <>
                    {cardsSection}
                    {seatCard}
                </>
            )}

            {isWinner && phase === 'RESULT' && (
                <div className="absolute -top-12 text-xs font-black text-yellow-400">WINNER</div>
            )}
        </div>
    );
};

export default GateSeat;
