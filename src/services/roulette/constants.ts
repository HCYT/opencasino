import { BetType } from './types';

// American Roulette Wheel Order (Counter-clockwise usually, or clock-wise depending largely on implementation, 
// strictly: 0, 28, 9, 26, 30, 11, 7, 20, 32, 17, 5, 22, 34, 15, 3, 24, 36, 13, 1, 00, 27, 10, 25, 29, 12, 8, 19, 31, 18, 6, 21, 33, 16, 4, 23, 35, 14, 2)
export const WHEEL_ORDER = [
    '0', '28', '9', '26', '30', '11', '7', '20', '32', '17', '5', '22', '34', '15', '3', '24', '36', '13', '1',
    '00', '27', '10', '25', '29', '12', '8', '19', '31', '18', '6', '21', '33', '16', '4', '23', '35', '14', '2'
];

export const PAYOUTS: Record<BetType, number> = {
    straight: 35,
    split: 17,
    street: 11,
    corner: 8,
    line: 5,
    column: 2,
    dozen: 2,
    color: 1,
    oddEven: 1,
    highLow: 1,
    basket: 11,   // 0, 00, 2
    firstFive: 6, // 0, 00, 1, 2, 3
};

// Logical Groups
export const RED_NUMBERS = ['1', '3', '5', '7', '9', '12', '14', '16', '18', '19', '21', '23', '25', '27', '30', '32', '34', '36'];
export const BLACK_NUMBERS = ['2', '4', '6', '8', '10', '11', '13', '15', '17', '20', '22', '24', '26', '28', '29', '31', '33', '35'];

// Helpers
export const getNumberColor = (num: string): 'red' | 'black' | 'green' => {
    if (num === '0' || num === '00') return 'green';
    if (RED_NUMBERS.includes(num)) return 'red';
    return 'black';
};
