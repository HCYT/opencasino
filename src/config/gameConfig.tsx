import { GameType } from './gameConstants';
import { CircleDashed, Spade, Layers, Club, Target, Cherry, Crown, Dice5, Grid3X3, Diamond } from 'lucide-react';

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
        type: 'TEXAS',
        name: '德州撲克',
        icon: <Diamond size={48} strokeWidth={1.5} className="text-rose-400" />,
        desc: '無限注對決',
        theme: {
            ...UNIFIED_THEME,
            from: 'from-rose-900/40',
            text: 'text-rose-400'
        }
    },
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
    },
    {
        type: 'SEVENS',
        name: '牌七',
        icon: <Grid3X3 size={48} strokeWidth={1.5} className="text-sky-300" />,
        desc: '接龍排七',
        theme: {
            ...UNIFIED_THEME,
            from: 'from-sky-900/40',
            text: 'text-sky-400'
        }
    }
];

