export type GameType = 'SHOWDOWN' | 'BLACKJACK' | 'BIG_TWO' | 'GATE' | 'SLOTS' | 'BACCARAT' | 'SICBO' | 'ROULETTE';
export type BetMode = 'FIXED_LIMIT' | 'NO_LIMIT';
export type BlackjackCutPresetKey = 'DEEP' | 'STANDARD' | 'SHALLOW';

export const BLACKJACK_DECK_OPTIONS = [4, 6, 8];
export const BIG_TWO_BASE_BETS = [5, 50, 1000, 5000];
export const BACCARAT_MIN_BETS = [10, 100, 500, 1000];
export const SICBO_MIN_BETS = [10, 50, 100, 500];

export const BLACKJACK_CUT_PRESETS = [
    { key: 'DEEP' as BlackjackCutPresetKey, label: '深 (20%)', min: 0.15, max: 0.2 },
    { key: 'STANDARD' as BlackjackCutPresetKey, label: '標準 (25%)', min: 0.2, max: 0.25 },
    { key: 'SHALLOW' as BlackjackCutPresetKey, label: '淺 (30%)', min: 0.25, max: 0.3 }
] as const;

import { CircleDashed, Spade, Layers, Club, Target, Cherry, Crown, Dice5 } from 'lucide-react';

export interface GameInfo {
    type: GameType;
    name: string;
    icon: React.ReactNode;
    desc: string;
    theme: {
        from: string;
        to: string;
        border: string;
        shadow: string;
        text: string;
    };
}

// Unified gold accent theme for all games
const UNIFIED_THEME = {
    from: 'from-amber-900/40',
    to: 'to-slate-900',
    border: 'border-amber-500/60',
    shadow: 'shadow-[0_0_25px_rgba(202,138,4,0.35)]',
    text: 'text-amber-400'
};

export const GAMES: GameInfo[] = [
    {
        type: 'SHOWDOWN',
        name: '梭哈',
        icon: <Spade size={48} strokeWidth={1.5} className="text-amber-300" />,
        desc: '經典五張',
        theme: UNIFIED_THEME
    },
    {
        type: 'BLACKJACK',
        name: '21 點',
        icon: <Layers size={48} strokeWidth={1.5} className="text-slate-200" />,
        desc: '挑戰莊家',
        theme: {
            ...UNIFIED_THEME,
            from: 'from-slate-800/60',
            text: 'text-slate-200'
        }
    },
    {
        type: 'BIG_TWO',
        name: '大老二',
        icon: <Club size={48} strokeWidth={1.5} className="text-emerald-300" />,
        desc: '台灣玩法',
        theme: {
            ...UNIFIED_THEME,
            from: 'from-emerald-900/40',
            text: 'text-emerald-400'
        }
    },
    {
        type: 'GATE',
        name: '射龍門',
        icon: <Target size={48} strokeWidth={1.5} className="text-red-300" />,
        desc: '運氣對決',
        theme: {
            ...UNIFIED_THEME,
            from: 'from-red-900/40',
            text: 'text-red-400'
        }
    },
    {
        type: 'SLOTS',
        name: '拉霸機',
        icon: <Cherry size={48} strokeWidth={1.5} className="text-amber-300" />,
        desc: '累積大獎',
        theme: UNIFIED_THEME
    },
    {
        type: 'BACCARAT',
        name: '百家樂',
        icon: <Crown size={48} strokeWidth={1.5} className="text-purple-300" />,
        desc: '莊閑對決',
        theme: {
            ...UNIFIED_THEME,
            from: 'from-purple-900/40',
            text: 'text-purple-400'
        }
    },
    {
        type: 'SICBO',
        name: '擲骰子',
        icon: <Dice5 size={48} strokeWidth={1.5} className="text-rose-300" />,
        desc: '賭大小',
        theme: {
            ...UNIFIED_THEME,
            from: 'from-rose-900/40',
            text: 'text-rose-400'
        }
    },
    {
        type: 'ROULETTE',
        name: '輪盤',
        icon: <CircleDashed size={48} strokeWidth={1.5} className="text-green-300" />,
        desc: '運氣旋轉',
        theme: {
            ...UNIFIED_THEME,
            from: 'from-green-900/40',
            text: 'text-green-400'
        }
    }
];

