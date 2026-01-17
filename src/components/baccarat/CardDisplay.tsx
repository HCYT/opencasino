import React from 'react';
import { Card } from '../../types';
import CardUI from '../CardUI';

interface CardDisplayProps {
    cards: Card[];
    points: number;
    label: string;
    isPair: boolean;
    isWinner: boolean;
    colorTheme: 'banker' | 'player';
}

const CardDisplay: React.FC<CardDisplayProps> = ({
    cards,
    points,
    label,
    isPair,
    isWinner,
    colorTheme,
}) => {
    const themeColors = {
        banker: {
            bg: 'from-red-900/70 to-red-950/70',
            border: 'border-red-500/50',
            text: 'text-red-300',
            glow: 'shadow-[0_0_40px_rgba(239,68,68,0.5)]',
            labelBg: 'bg-red-600/80',
        },
        player: {
            bg: 'from-blue-900/70 to-blue-950/70',
            border: 'border-blue-500/50',
            text: 'text-blue-300',
            glow: 'shadow-[0_0_40px_rgba(59,130,246,0.5)]',
            labelBg: 'bg-blue-600/80',
        },
    };

    const theme = themeColors[colorTheme];

    return (
        <div
            className={`
        relative flex flex-col items-center p-5 rounded-[2rem]
        bg-gradient-to-b ${theme.bg}
        backdrop-blur-xl
        border-2 ${theme.border}
        ${isWinner ? `${theme.glow} scale-105` : ''}
        transition-all duration-500
        min-w-[140px] md:min-w-[180px]
      `}
        >
            {/* 標籤 */}
            <div className={`
        ${theme.labelBg} px-4 py-1 rounded-full mb-3
        text-sm font-black text-white uppercase tracking-widest
        shadow-lg
      `}>
                {label.split(' ')[0]}
                {isPair && (
                    <span className="ml-2 text-yellow-300 animate-pulse">
                        對子!
                    </span>
                )}
            </div>

            {/* 卡牌區域 */}
            <div className="flex gap-2 mb-3 min-h-[100px] items-center justify-center">
                {cards.length === 0 ? (
                    <>
                        <div className="w-16 h-24 border-2 border-dashed border-white/20 rounded-lg" />
                        <div className="w-16 h-24 border-2 border-dashed border-white/20 rounded-lg" />
                    </>
                ) : (
                    cards.map((card, index) => (
                        <div
                            key={index}
                            className={`
                transform transition-all duration-500
                ${index === 2 ? 'rotate-90 translate-x-2' : ''}
                animate-in fade-in slide-in-from-top-4
              `}
                            style={{
                                animationDelay: `${index * 200}ms`,
                                animationFillMode: 'backwards',
                            }}
                        >
                            <CardUI card={card} size="md" />
                        </div>
                    ))
                )}
            </div>

            {/* 點數 */}
            <div
                className={`
          text-4xl font-black
          ${isWinner ? 'text-yellow-400 animate-pulse' : 'text-white'}
          drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]
        `}
            >
                {cards.length > 0 ? `${points} 點` : '-'}
            </div>

            {/* 勝利標記 */}
            {isWinner && (
                <div className="absolute -top-3 -right-3 bg-yellow-500 text-black text-xs font-black px-3 py-1 rounded-full shadow-lg animate-bounce">
                    WIN!
                </div>
            )}
        </div>
    );
};

export default CardDisplay;
