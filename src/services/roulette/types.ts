export type BetType =
    | 'straight'
    | 'split'
    | 'street'
    | 'corner'
    | 'line'
    | 'column'
    | 'dozen'
    | 'color'
    | 'oddEven'
    | 'highLow'
    | 'basket'
    | 'firstFive';

export type RouletteBet = {
    id: string;
    type: BetType;
    amount: number;
    numbers: string[]; // Using string for '0', '00', '1', etc.
    playerId: string;
};

export type RouletteResult = {
    winningNumber: string;
    color: 'red' | 'black' | 'green';
};

export type RouletteHistoryItem = {
    result: RouletteResult;
    timestamp: number;
};
