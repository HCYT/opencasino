export type GameType = 'SHOWDOWN' | 'BLACKJACK' | 'BIG_TWO' | 'GATE' | 'SLOTS';
export type BetMode = 'FIXED_LIMIT' | 'NO_LIMIT';
export type BlackjackCutPresetKey = 'DEEP' | 'STANDARD' | 'SHALLOW';

export const BLACKJACK_DECK_OPTIONS = [4, 6, 8];
export const BIG_TWO_BASE_BETS = [5, 50, 1000, 5000];

export const BLACKJACK_CUT_PRESETS = [
    { key: 'DEEP' as BlackjackCutPresetKey, label: '深 (20%)', min: 0.15, max: 0.2 },
    { key: 'STANDARD' as BlackjackCutPresetKey, label: '標準 (25%)', min: 0.2, max: 0.25 },
    { key: 'SHALLOW' as BlackjackCutPresetKey, label: '淺 (30%)', min: 0.25, max: 0.3 }
] as const;

export interface GameInfo {
    type: GameType;
    name: string;
    icon: string;
    desc: string;
    theme: {
        from: string;
        to: string;
        border: string;
        shadow: string;
        text: string;
    };
}

export const GAMES: GameInfo[] = [
    {
        type: 'SHOWDOWN',
        name: '梭哈',
        icon: '♠️',
        desc: '經典五張',
        theme: {
            from: 'from-blue-900',
            to: 'to-slate-900',
            border: 'border-blue-500',
            shadow: 'shadow-[0_0_25px_rgba(59,130,246,0.3)]',
            text: 'text-blue-400'
        }
    },
    {
        type: 'BLACKJACK',
        name: '21 點',
        icon: '🃏',
        desc: '挑戰莊家',
        theme: {
            from: 'from-slate-800',
            to: 'to-slate-900',
            border: 'border-white/20',
            shadow: 'shadow-[0_0_25px_rgba(255,255,255,0.1)]',
            text: 'text-slate-200'
        }
    },
    {
        type: 'BIG_TWO',
        name: '大老二',
        icon: '♣️',
        desc: '台灣玩法',
        theme: {
            from: 'from-emerald-900',
            to: 'to-slate-900',
            border: 'border-emerald-500',
            shadow: 'shadow-[0_0_25px_rgba(16,185,129,0.3)]',
            text: 'text-emerald-400'
        }
    },
    {
        type: 'GATE',
        name: '射龍門',
        icon: '🥅',
        desc: '運氣對決',
        theme: {
            from: 'from-red-900',
            to: 'to-slate-900',
            border: 'border-red-500',
            shadow: 'shadow-[0_0_25px_rgba(239,68,68,0.3)]',
            text: 'text-red-400'
        }
    },
    {
        type: 'SLOTS',
        name: '拉霸機',
        icon: '🎰',
        desc: '累積大獎',
        theme: {
            from: 'from-amber-900',
            to: 'to-yellow-900',
            border: 'border-amber-500',
            shadow: 'shadow-[0_0_25px_rgba(245,158,11,0.3)]',
            text: 'text-amber-400'
        }
    }
];
