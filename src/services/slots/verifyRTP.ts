/**
 * Slot Machine RTP Verification Script
 * Run with: npx ts-node --esm src/services/slots/verifyRTP.ts
 */

// Direct implementation to avoid module system issues
enum SlotSymbol {
    WILD = 'WILD',
    SCATTER = 'SCATTER',
    BAR = 'BAR',
    BELL = 'BELL',
    GRAPE = 'GRAPE',
    ORANGE = 'ORANGE',
    CHERRY = 'CHERRY',
    LEMON = 'LEMON'
}

const PAYOUT_3_OF_KIND: Record<SlotSymbol, number> = {
    [SlotSymbol.WILD]: 200,
    [SlotSymbol.SCATTER]: 100,
    [SlotSymbol.BAR]: 80,
    [SlotSymbol.BELL]: 50,
    [SlotSymbol.GRAPE]: 30,
    [SlotSymbol.ORANGE]: 20,
    [SlotSymbol.CHERRY]: 10,
    [SlotSymbol.LEMON]: 5
};

const PAYOUT_2_OF_KIND: Partial<Record<SlotSymbol, number>> = {
    [SlotSymbol.CHERRY]: 3
};

const NUM_PAYLINES = 5;

function createReelStrip(): SlotSymbol[] {
    const strip: SlotSymbol[] = [];
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

    // Shuffle
    for (let i = strip.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [strip[i], strip[j]] = [strip[j], strip[i]];
    }

    return strip;
}

const REELS = [createReelStrip(), createReelStrip(), createReelStrip()];

const PAYLINES: [number, number][][] = [
    [[1, 0], [1, 1], [1, 2]],
    [[0, 0], [0, 1], [0, 2]],
    [[2, 0], [2, 1], [2, 2]],
    [[0, 0], [1, 1], [2, 2]],
    [[2, 0], [1, 1], [0, 2]]
];

function isMatch3(s1: SlotSymbol, s2: SlotSymbol, s3: SlotSymbol): boolean {
    if (s1 === SlotSymbol.WILD && s2 === SlotSymbol.WILD && s3 === SlotSymbol.WILD) return true;
    const nonWilds = [s1, s2, s3].filter(s => s !== SlotSymbol.WILD);
    if (nonWilds.length === 0) return true;
    return nonWilds.every(s => s === nonWilds[0]);
}

function getDominantSymbol(s1: SlotSymbol, s2: SlotSymbol, s3: SlotSymbol): SlotSymbol {
    if (s1 === SlotSymbol.WILD && s2 === SlotSymbol.WILD && s3 === SlotSymbol.WILD) return SlotSymbol.WILD;
    return [s1, s2, s3].find(s => s !== SlotSymbol.WILD) || SlotSymbol.WILD;
}

function isMatch2(s1: SlotSymbol, s2: SlotSymbol): boolean {
    if (s1 === SlotSymbol.WILD || s2 === SlotSymbol.WILD) {
        const nonWild = s1 === SlotSymbol.WILD ? s2 : s1;
        return PAYOUT_2_OF_KIND[nonWild] !== undefined;
    }
    return s1 === s2 && PAYOUT_2_OF_KIND[s1] !== undefined;
}

function spin(totalBet: number): { winAmount: number; scatterCount: number; freeSpinsAwarded: number } {
    const betPerLine = totalBet / NUM_PAYLINES;

    const grid: SlotSymbol[][] = [[], [], []];
    for (let col = 0; col < 3; col++) {
        const reel = REELS[col];
        const stopIdx = Math.floor(Math.random() * reel.length);
        grid[0][col] = reel[(stopIdx + reel.length - 1) % reel.length];
        grid[1][col] = reel[stopIdx];
        grid[2][col] = reel[(stopIdx + 1) % reel.length];
    }

    let scatterCount = 0;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
            if (grid[row][col] === SlotSymbol.SCATTER) scatterCount++;
        }
    }

    let freeSpinsAwarded = 0;
    if (scatterCount >= 3) {
        freeSpinsAwarded = scatterCount === 3 ? 10 : (scatterCount === 4 ? 15 : 20);
    }

    let totalWin = 0;

    for (const line of PAYLINES) {
        const symbols = line.map(([row, col]) => grid[row][col]);
        const [s1, s2, s3] = symbols;

        if (s1 === SlotSymbol.SCATTER || s2 === SlotSymbol.SCATTER || s3 === SlotSymbol.SCATTER) continue;

        if (isMatch3(s1, s2, s3)) {
            const symbol = getDominantSymbol(s1, s2, s3);
            totalWin += PAYOUT_3_OF_KIND[symbol] * betPerLine;
        } else if (isMatch2(s1, s2)) {
            const symbol = s1 === SlotSymbol.WILD ? s2 : s1;
            totalWin += (PAYOUT_2_OF_KIND[symbol] || 0) * betPerLine;
        }
    }

    if (scatterCount >= 3) {
        totalWin += PAYOUT_3_OF_KIND[SlotSymbol.SCATTER] * betPerLine * scatterCount;
    }

    return { winAmount: Math.round(totalWin), scatterCount, freeSpinsAwarded };
}

// Run simulation
const SPINS = 500000;
let totalBet = 0;
let totalWin = 0;
let winningSpins = 0;
let totalFreeSpins = 0;

console.log(`\n=== Slot Machine RTP Verification ===`);
console.log(`Running ${SPINS.toLocaleString()} spins...\n`);

const startTime = Date.now();

for (let i = 0; i < SPINS; i++) {
    const bet = 100;
    totalBet += bet;
    const result = spin(bet);
    totalWin += result.winAmount;
    if (result.winAmount > 0) winningSpins++;
    totalFreeSpins += result.freeSpinsAwarded;
}

const elapsed = (Date.now() - startTime) / 1000;
const rtp = (totalWin / totalBet) * 100;
const hitRate = (winningSpins / SPINS) * 100;

console.log(`Results:`);
console.log(`---------`);
console.log(`Total Bet:    $${totalBet.toLocaleString()}`);
console.log(`Total Win:    $${totalWin.toLocaleString()}`);
console.log(`RTP:          ${rtp.toFixed(2)}%`);
console.log(`Hit Rate:     ${hitRate.toFixed(2)}%`);
console.log(`Free Spins Triggered: ${totalFreeSpins.toLocaleString()}`);
console.log(`Time:         ${elapsed.toFixed(2)}s`);
console.log(`\nTarget RTP: 92-96%`);

if (rtp >= 92 && rtp <= 96) {
    console.log(`✅ RTP is within target range!`);
} else if (rtp < 92) {
    console.log(`⚠️ RTP is too LOW. Consider increasing payouts.`);
} else {
    console.log(`⚠️ RTP is too HIGH. Consider decreasing payouts.`);
}
