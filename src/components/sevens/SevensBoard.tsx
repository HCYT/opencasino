import React from 'react';
import { Suit } from '../../types';
import { SevensBoard as BoardType } from '../../services/sevens/types';

interface SevensBoardProps {
    board: BoardType;
}

const SUIT_SYMBOLS: Record<Suit, { symbol: string; color: string }> = {
    Spades: { symbol: '♠', color: 'text-slate-200' },
    Hearts: { symbol: '♥', color: 'text-red-400' },
    Diamonds: { symbol: '♦', color: 'text-red-400' },
    Clubs: { symbol: '♣', color: 'text-slate-200' }
};

const SUITS: Suit[] = ['Spades', 'Hearts', 'Diamonds', 'Clubs'];

// Mini card component for board display
const MiniCard: React.FC<{ rank: string; suit: Suit }> = ({ rank, suit }) => {
    const isRed = suit === 'Hearts' || suit === 'Diamonds';
    const suitSymbol = SUIT_SYMBOLS[suit].symbol;

    return (
        <div className={`w-8 h-11 bg-white rounded shadow-sm border border-slate-200 flex flex-col items-center justify-center text-xs font-bold ${isRed ? 'text-red-600' : 'text-slate-900'}`}>
            <span className="leading-none">{rank}</span>
            <span className="leading-none text-[10px]">{suitSymbol}</span>
        </div>
    );
};

const SevensBoard: React.FC<SevensBoardProps> = ({ board }) => {
    return (
        <div className="flex flex-col gap-1.5 w-full max-w-2xl mx-auto">
            {SUITS.map(suit => {
                const pile = board[suit];
                const { symbol, color } = SUIT_SYMBOLS[suit];
                const hasCards = pile.cards.length > 0;

                // Sort cards by rank for display
                const sortedCards = [...pile.cards].sort((a, b) => {
                    const rankOrder: Record<string, number> = {
                        'A': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7,
                        '8': 8, '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13
                    };
                    return rankOrder[a.rank] - rankOrder[b.rank];
                });

                return (
                    <div
                        key={suit}
                        className="flex items-center gap-2 bg-black/20 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-white/10"
                    >
                        {/* Suit Symbol */}
                        <div className={`text-2xl font-bold ${color} w-8 text-center flex-shrink-0`}>
                            {symbol}
                        </div>

                        {/* Cards Display */}
                        <div className="flex-1 flex items-center justify-center py-0.5 min-h-[48px]">
                            {hasCards ? (
                                <div className="flex items-center gap-0.5">
                                    {sortedCards.map((card, idx) => (
                                        <MiniCard key={`${card.rank}-${card.suit}-${idx}`} rank={card.rank} suit={card.suit} />
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-white/30">
                                    <span className="text-xs">等待 7</span>
                                </div>
                            )}
                        </div>

                        {/* Card count */}
                        <div className="text-white/50 text-xs font-mono w-10 text-right flex-shrink-0">
                            {pile.cards.length} 張
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SevensBoard;
