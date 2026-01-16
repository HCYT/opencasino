import React from 'react';
import { GameButton } from './GameButton';

type RollPromptProps = {
  onRoll: () => void;
  className?: string;
};

const RollPrompt: React.FC<RollPromptProps> = ({ onRoll, className = '' }) => {
  return (
    <div className={`bg-black/80 border border-yellow-500/40 rounded-[28px] px-8 py-6 shadow-2xl text-center space-y-4 ${className}`}>
      <div className="text-yellow-300 font-black text-lg tracking-widest">擲骰決定插牌者</div>
      <div className="text-white/50 text-xs uppercase tracking-[0.3em]">21 點牌靴重設</div>
      <GameButton onClick={onRoll} variant="warning" size="pillLg" className="text-lg">
        擲骰
      </GameButton>
    </div>
  );
};

export default RollPrompt;
