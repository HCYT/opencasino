import React from 'react';

type RangeSliderProps = React.InputHTMLAttributes<HTMLInputElement> & {
  className?: string;
};

const base = 'h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400';

const RangeSlider: React.FC<RangeSliderProps> = ({ className = '', ...props }) => {
  return <input type="range" className={`${base} ${className}`} {...props} />;
};

export default RangeSlider;
