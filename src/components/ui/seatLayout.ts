import { CSSProperties } from 'react';

type SeatPosition = 'left' | 'right' | 'top' | 'bottom';

type SeatLayout = {
  style: CSSProperties;
  vertical: boolean;
  seatPosition: SeatPosition;
};

export const getSeatLayout = (seatIndex: number, isPlayer: boolean): SeatLayout => {
  if (isPlayer) {
    return {
      style: { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' },
      vertical: false,
      seatPosition: 'bottom'
    };
  }

  if (seatIndex === 1) {
    return {
      style: { left: '4rem', top: '50%', transform: 'translateY(-50%)' },
      vertical: true,
      seatPosition: 'left'
    };
  }

  if (seatIndex === 2) {
    return {
      style: { top: '3rem', left: '50%', transform: 'translateX(-50%)' },
      vertical: false,
      seatPosition: 'top'
    };
  }

  return {
    style: { right: '4rem', top: '50%', transform: 'translateY(-50%)' },
    vertical: true,
    seatPosition: 'right'
  };
};

export type { SeatLayout, SeatPosition };
