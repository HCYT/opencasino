export enum SlotSymbol {
    WILD = 'WILD',
    SEVEN = 'SEVEN',
    BAR = 'BAR',
    BELL = 'BELL',
    GRAPE = 'GRAPE',
    ORANGE = 'ORANGE',
    CHERRY = 'CHERRY',
    LEMON = 'LEMON'
}

export const SYMBOL_VALUES: Record<SlotSymbol, number> = {
    [SlotSymbol.WILD]: 10,
    [SlotSymbol.SEVEN]: 500, // Jackpot trigger if 3
    [SlotSymbol.BAR]: 50,
    [SlotSymbol.BELL]: 20,
    [SlotSymbol.GRAPE]: 15,
    [SlotSymbol.ORANGE]: 10,
    [SlotSymbol.CHERRY]: 5,
    [SlotSymbol.LEMON]: 2
};

// Virtual Reel Strips - Weighted by presence
// More low value symbols, fewer high value ones.
const REEL_STRIP_1 = [
    SlotSymbol.WILD, SlotSymbol.SEVEN, SlotSymbol.BAR, SlotSymbol.BAR,
    SlotSymbol.BELL, SlotSymbol.BELL, SlotSymbol.BELL,
    SlotSymbol.GRAPE, SlotSymbol.GRAPE, SlotSymbol.GRAPE, SlotSymbol.GRAPE,
    SlotSymbol.ORANGE, SlotSymbol.ORANGE, SlotSymbol.ORANGE, SlotSymbol.ORANGE, SlotSymbol.ORANGE,
    SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY,
    SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON
];

const REEL_STRIP_2 = [
    SlotSymbol.WILD, SlotSymbol.SEVEN, SlotSymbol.BAR, SlotSymbol.BAR,
    SlotSymbol.BELL, SlotSymbol.BELL, SlotSymbol.BELL,
    SlotSymbol.GRAPE, SlotSymbol.GRAPE, SlotSymbol.GRAPE, SlotSymbol.GRAPE,
    SlotSymbol.ORANGE, SlotSymbol.ORANGE, SlotSymbol.ORANGE, SlotSymbol.ORANGE, SlotSymbol.ORANGE,
    SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY,
    SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON
];

const REEL_STRIP_3 = [
    SlotSymbol.WILD, SlotSymbol.SEVEN, SlotSymbol.BAR, SlotSymbol.BAR,
    SlotSymbol.BELL, SlotSymbol.BELL, SlotSymbol.BELL,
    SlotSymbol.GRAPE, SlotSymbol.GRAPE, SlotSymbol.GRAPE, SlotSymbol.GRAPE,
    SlotSymbol.ORANGE, SlotSymbol.ORANGE, SlotSymbol.ORANGE, SlotSymbol.ORANGE, SlotSymbol.ORANGE,
    SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY, SlotSymbol.CHERRY,
    SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON, SlotSymbol.LEMON
];

export const REELS = [REEL_STRIP_1, REEL_STRIP_2, REEL_STRIP_3];

export interface SpinResult {
    grid: SlotSymbol[][]; // 3x3 grid
    winAmount: number;
    linesWon: number[]; // Indices of winning lines
    isJackpot: boolean;
}

// 5 Paylines on 3x3 grid
// 0: Middle Row ---
// 1: Top Row    ---
// 2: Bottom Row ---
// 3: Diagonal TL-BR \
// 4: Diagonal TR-BL /
const PAYLINES = [
    [[1, 0], [1, 1], [1, 2]], // Middle
    [[0, 0], [0, 1], [0, 2]], // Top
    [[2, 0], [2, 1], [2, 2]], // Bottom
    [[0, 0], [1, 1], [2, 2]], // TL-BR (Reel 0 Top -> Reel 2 Bottom)
    [[2, 0], [1, 1], [0, 2]]  // TR-BL (Reel 0 Bottom -> Reel 2 Top)
];

export class SlotRules {
    private baseWinRate: number; // For future adjustment, currently implicit in strip weights

    constructor(baseWinRate: number = 1.0) {
        this.baseWinRate = baseWinRate;
    }

    public spin(bet: number): SpinResult {
        // 1. Generate Grid
        const grid: SlotSymbol[][] = [[], [], []];
        const reelIndexes = [0, 0, 0];

        // Select random start point for each reel
        for (let i = 0; i < 3; i++) {
            const reel = REELS[i];
            const StopIdx = Math.floor(Math.random() * reel.length);
            reelIndexes[i] = StopIdx;

            // Populate column i (3 rows)
            // Visual wrap-around
            grid[0][i] = reel[(StopIdx + reel.length - 1) % reel.length]; // Top
            grid[1][i] = reel[StopIdx]; // Center (The "Stop" position)
            grid[2][i] = reel[(StopIdx + 1) % reel.length]; // Bottom
        }

        // 2. Calculate Wins
        let totalWin = 0;
        const linesWon: number[] = [];
        let isJackpot = false;

        PAYLINES.forEach((line, index) => {
            const s1 = grid[line[0][0]][line[0][1]];
            const s2 = grid[line[1][0]][line[1][1]];
            const s3 = grid[line[2][0]][line[2][1]];

            const payout = this.checkLine(s1, s2, s3, bet);
            if (payout > 0) {
                totalWin += payout;
                linesWon.push(index);
                // Jackpot check: 3 SEVENS on any line
                if (s1 === SlotSymbol.SEVEN && s2 === SlotSymbol.SEVEN && s3 === SlotSymbol.SEVEN) {
                    isJackpot = true;
                }
            }
        });

        return {
            grid,
            winAmount: totalWin,
            linesWon,
            isJackpot
        };
    }

    private checkLine(s1: SlotSymbol, s2: SlotSymbol, s3: SlotSymbol, bet: number): number {
        // 3 of a kind (handling Wilds)
        if (this.isMatch(s1, s2) && this.isMatch(s2, s3) && this.isMatch(s1, s3)) {
            // Determine the dominant symbol (non-wild)
            const symbol = [s1, s2, s3].find(s => s !== SlotSymbol.WILD) || SlotSymbol.WILD;
            return this.getPayout(symbol) * bet;
        }

        return 0;
    }

    private isMatch(a: SlotSymbol, b: SlotSymbol): boolean {
        return a === b || a === SlotSymbol.WILD || b === SlotSymbol.WILD;
    }

    private getPayout(symbol: SlotSymbol): number {
        // 3 Wilds
        if (symbol === SlotSymbol.WILD) return 500;
        return SYMBOL_VALUES[symbol] * 5; // Base multiplier for 3-match
    }
}
