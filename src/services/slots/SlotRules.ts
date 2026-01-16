/**
 * Slot Machine Rules - Mathematically Correct Design
 * Target RTP: ~94% (industry standard: 92-96%)
 * 
 * Design Philosophy:
 * - 64-stop virtual reel strips (power of 2)
 * - WILD substitutes for any symbol except SCATTER
 * - SCATTER (3+) triggers Free Spins
 * - 2-of-a-kind payouts for CHERRY
 */

export enum SlotSymbol {
    WILD = 'WILD',       // Substitutes for all except SCATTER
    SCATTER = 'SCATTER', // Free Spins trigger (replaces SEVEN for jackpot)
    BAR = 'BAR',
    BELL = 'BELL',
    GRAPE = 'GRAPE',
    ORANGE = 'ORANGE',
    CHERRY = 'CHERRY',
    LEMON = 'LEMON'
}

export const SYMBOL_EMOJIS: Record<SlotSymbol, string> = {
    [SlotSymbol.WILD]: '🃏',
    [SlotSymbol.SCATTER]: '⭐',
    [SlotSymbol.BAR]: '💎',
    [SlotSymbol.BELL]: '🔔',
    [SlotSymbol.GRAPE]: '🍇',
    [SlotSymbol.ORANGE]: '🍊',
    [SlotSymbol.CHERRY]: '🍒',
    [SlotSymbol.LEMON]: '🍋'
};

export const SYMBOL_COLORS: Record<SlotSymbol, { bg: string; border: string; glow: string }> = {
    [SlotSymbol.WILD]: { bg: 'bg-purple-500/20', border: 'border-purple-400/50', glow: 'shadow-purple-500/30' },
    [SlotSymbol.SCATTER]: { bg: 'bg-yellow-500/20', border: 'border-yellow-400/50', glow: 'shadow-yellow-500/30' },
    [SlotSymbol.BAR]: { bg: 'bg-blue-500/20', border: 'border-blue-400/50', glow: 'shadow-blue-500/30' },
    [SlotSymbol.BELL]: { bg: 'bg-slate-700/30', border: 'border-white/10', glow: 'shadow-yellow-500/10' },
    [SlotSymbol.GRAPE]: { bg: 'bg-slate-700/30', border: 'border-white/10', glow: 'shadow-purple-500/10' },
    [SlotSymbol.ORANGE]: { bg: 'bg-slate-700/30', border: 'border-white/10', glow: 'shadow-orange-500/10' },
    [SlotSymbol.CHERRY]: { bg: 'bg-slate-700/30', border: 'border-white/10', glow: 'shadow-red-500/10' },
    [SlotSymbol.LEMON]: { bg: 'bg-slate-700/30', border: 'border-white/10', glow: 'shadow-yellow-500/10' }
};

// Payout multipliers for 3-of-a-kind (relative to bet-per-line)
// Calibrated for ~94% RTP with 64-stop reels and 5 paylines
export const PAYOUT_3_OF_KIND: Record<SlotSymbol, number> = {
    [SlotSymbol.WILD]: 200,     // 200× for 3 wilds (jackpot trigger)
    [SlotSymbol.SCATTER]: 100,  // 100× (plus triggers free spins)
    [SlotSymbol.BAR]: 80,
    [SlotSymbol.BELL]: 50,
    [SlotSymbol.GRAPE]: 30,
    [SlotSymbol.ORANGE]: 20,
    [SlotSymbol.CHERRY]: 10,
    [SlotSymbol.LEMON]: 5
};

// 2-of-a-kind payout (only CHERRY pays for 2)
export const PAYOUT_2_OF_KIND: Partial<Record<SlotSymbol, number>> = {
    [SlotSymbol.CHERRY]: 3  // 3× for 2 cherries (increased from 2)
};

// Number of paylines
export const NUM_PAYLINES = 5;

/**
 * 64-stop Virtual Reel Strips
 * 
 * Symbol Distribution:
 * - WILD:    2/64 = 3.125%
 * - SCATTER: 2/64 = 3.125% (appears independently on each reel)
 * - BAR:     4/64 = 6.25%
 * - BELL:    6/64 = 9.375%
 * - GRAPE:   10/64 = 15.625%
 * - ORANGE:  12/64 = 18.75%
 * - CHERRY:  12/64 = 18.75%
 * - LEMON:   16/64 = 25%
 */
function createReelStrip(): SlotSymbol[] {
    const strip: SlotSymbol[] = [];

    // Build weighted strip
    const weights: [SlotSymbol, number][] = [
        [SlotSymbol.WILD, 2],
        [SlotSymbol.SCATTER, 2],
        [SlotSymbol.BAR, 4],
        [SlotSymbol.BELL, 6],
        [SlotSymbol.GRAPE, 10],
        [SlotSymbol.ORANGE, 12],
        [SlotSymbol.CHERRY, 12],
        [SlotSymbol.LEMON, 16]
    ];

    for (const [symbol, count] of weights) {
        for (let i = 0; i < count; i++) {
            strip.push(symbol);
        }
    }

    // Shuffle to distribute (Fisher-Yates)
    for (let i = strip.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [strip[i], strip[j]] = [strip[j], strip[i]];
    }

    return strip;
}

// Generate 3 independent reel strips (shuffled differently for variety)
export const REELS = [createReelStrip(), createReelStrip(), createReelStrip()];

export interface SpinResult {
    grid: SlotSymbol[][];      // 3x3 grid [row][col]
    winAmount: number;         // Total win amount
    linesWon: number[];        // Indices of winning lines
    isJackpot: boolean;        // Jackpot triggered
    scatterCount: number;      // Number of scatters (for free spins)
    freeSpinsAwarded: number;  // Free spins won this spin
    linePayouts: { line: number; symbols: SlotSymbol[]; payout: number }[];
}

// 5 Paylines on 3x3 grid
// 0: Middle Row ---
// 1: Top Row    ---
// 2: Bottom Row ---
// 3: Diagonal TL-BR \
// 4: Diagonal TR-BL /
const PAYLINES: [number, number][][] = [
    [[1, 0], [1, 1], [1, 2]], // Middle (center payline)
    [[0, 0], [0, 1], [0, 2]], // Top
    [[2, 0], [2, 1], [2, 2]], // Bottom
    [[0, 0], [1, 1], [2, 2]], // TL-BR
    [[2, 0], [1, 1], [0, 2]]  // TR-BL
];

export class SlotRules {
    /**
     * Perform a spin
     * @param totalBet Total bet amount (will be divided across paylines)
     * @returns SpinResult with grid, wins, and bonus info
     */
    public spin(totalBet: number): SpinResult {
        const betPerLine = totalBet / NUM_PAYLINES;

        // 1. Generate Grid
        const grid: SlotSymbol[][] = [[], [], []];

        for (let col = 0; col < 3; col++) {
            const reel = REELS[col];
            const stopIdx = Math.floor(Math.random() * reel.length);

            // 3 visible rows: stopIdx-1 (top), stopIdx (center), stopIdx+1 (bottom)
            grid[0][col] = reel[(stopIdx + reel.length - 1) % reel.length];
            grid[1][col] = reel[stopIdx];
            grid[2][col] = reel[(stopIdx + 1) % reel.length];
        }

        // 2. Count Scatters (anywhere on grid)
        let scatterCount = 0;
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                if (grid[row][col] === SlotSymbol.SCATTER) {
                    scatterCount++;
                }
            }
        }

        // 3. Calculate Free Spins
        let freeSpinsAwarded = 0;
        if (scatterCount >= 3) {
            freeSpinsAwarded = scatterCount === 3 ? 10 : (scatterCount === 4 ? 15 : 20);
        }

        // 4. Calculate Line Wins
        let totalWin = 0;
        const linesWon: number[] = [];
        const linePayouts: { line: number; symbols: SlotSymbol[]; payout: number }[] = [];
        let isJackpot = false;

        PAYLINES.forEach((line, lineIndex) => {
            const symbols = line.map(([row, col]) => grid[row][col]);
            const [s1, s2, s3] = symbols;

            const payout = this.checkLine(s1, s2, s3, betPerLine);
            if (payout > 0) {
                totalWin += payout;
                linesWon.push(lineIndex);
                linePayouts.push({ line: lineIndex, symbols, payout });

                // Jackpot: 3× WILD on center payline (line 0)
                if (lineIndex === 0 && s1 === SlotSymbol.WILD && s2 === SlotSymbol.WILD && s3 === SlotSymbol.WILD) {
                    isJackpot = true;
                }
            }
        });

        // 5. Scatter pays (anywhere, not on lines)
        if (scatterCount >= 3) {
            const scatterPay = PAYOUT_3_OF_KIND[SlotSymbol.SCATTER] * betPerLine * scatterCount;
            totalWin += scatterPay;
        }

        return {
            grid,
            winAmount: Math.round(totalWin),
            linesWon,
            isJackpot,
            scatterCount,
            freeSpinsAwarded,
            linePayouts
        };
    }

    /**
     * Check a single payline for wins
     */
    private checkLine(s1: SlotSymbol, s2: SlotSymbol, s3: SlotSymbol, betPerLine: number): number {
        // SCATTER doesn't count on lines (only pays via scatter count)
        if (s1 === SlotSymbol.SCATTER || s2 === SlotSymbol.SCATTER || s3 === SlotSymbol.SCATTER) {
            return 0;
        }

        // Check 3-of-a-kind (with WILD substitution)
        if (this.isMatch3(s1, s2, s3)) {
            const symbol = this.getDominantSymbol(s1, s2, s3);
            return PAYOUT_3_OF_KIND[symbol] * betPerLine;
        }

        // Check 2-of-a-kind (first 2 symbols, CHERRY only)
        if (this.isMatch2(s1, s2)) {
            const symbol = s1 === SlotSymbol.WILD ? s2 : s1;
            const payout2 = PAYOUT_2_OF_KIND[symbol];
            if (payout2) {
                return payout2 * betPerLine;
            }
        }

        return 0;
    }

    /**
     * Check if 3 symbols match (counting WILDs)
     */
    private isMatch3(s1: SlotSymbol, s2: SlotSymbol, s3: SlotSymbol): boolean {
        // All wilds
        if (s1 === SlotSymbol.WILD && s2 === SlotSymbol.WILD && s3 === SlotSymbol.WILD) {
            return true;
        }

        // Get non-wild symbols
        const nonWilds = [s1, s2, s3].filter(s => s !== SlotSymbol.WILD);

        // All remaining must be the same
        if (nonWilds.length === 0) return true;
        return nonWilds.every(s => s === nonWilds[0]);
    }

    /**
     * Check if first 2 symbols match
     */
    private isMatch2(s1: SlotSymbol, s2: SlotSymbol): boolean {
        if (s1 === SlotSymbol.WILD || s2 === SlotSymbol.WILD) {
            // Need at least one non-wild that qualifies for 2-of-a-kind payout
            const nonWild = s1 === SlotSymbol.WILD ? s2 : s1;
            return PAYOUT_2_OF_KIND[nonWild] !== undefined;
        }
        return s1 === s2 && PAYOUT_2_OF_KIND[s1] !== undefined;
    }

    /**
     * Get the dominant (paying) symbol from a match
     */
    private getDominantSymbol(s1: SlotSymbol, s2: SlotSymbol, s3: SlotSymbol): SlotSymbol {
        // If all wilds, pay as WILD
        if (s1 === SlotSymbol.WILD && s2 === SlotSymbol.WILD && s3 === SlotSymbol.WILD) {
            return SlotSymbol.WILD;
        }

        // Otherwise, return the first non-wild
        return [s1, s2, s3].find(s => s !== SlotSymbol.WILD) || SlotSymbol.WILD;
    }
}

/**
 * Monte Carlo RTP Simulation
 * Run this to verify the algorithm produces expected RTP
 */
export function simulateRTP(spins: number = 100000): { rtp: number; hitRate: number; details: Record<string, number> } {
    const rules = new SlotRules();
    let totalBet = 0;
    let totalWin = 0;
    let winningSpins = 0;
    const symbolWins: Record<string, number> = {};

    for (let i = 0; i < spins; i++) {
        const bet = 100;
        totalBet += bet;
        const result = rules.spin(bet);
        totalWin += result.winAmount;

        if (result.winAmount > 0) {
            winningSpins++;
        }

        // Track which symbols won
        for (const lp of result.linePayouts) {
            const dominant = lp.symbols.find(s => s !== SlotSymbol.WILD) || SlotSymbol.WILD;
            symbolWins[dominant] = (symbolWins[dominant] || 0) + lp.payout;
        }

        if (result.scatterCount >= 3) {
            symbolWins['SCATTER'] = (symbolWins['SCATTER'] || 0) +
                PAYOUT_3_OF_KIND[SlotSymbol.SCATTER] * (bet / NUM_PAYLINES) * result.scatterCount;
        }
    }

    return {
        rtp: totalWin / totalBet,
        hitRate: winningSpins / spins,
        details: symbolWins
    };
}
