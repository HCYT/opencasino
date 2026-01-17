import React, { useState, useEffect } from 'react';
import { GameButton } from './GameButton';
import Dice3D from '../sicBo/Dice3D';

type RollPromptProps = {
  onRoll: () => void;
  rollResult?: Record<string, number>; // { playerName: diceValue }
  winner?: string;
  className?: string;
};

const RollPrompt: React.FC<RollPromptProps> = ({
  onRoll,
  rollResult,
  winner,
  className = ''
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [diceValues, setDiceValues] = useState<[number, number, number]>([1, 1, 1]);

  // When roll result comes in, show animation then result
  useEffect(() => {
    if (rollResult && Object.keys(rollResult).length > 0) {
      const values = Object.values(rollResult);
      // Use first 3 values, or repeat if fewer
      const dice: [number, number, number] = [
        values[0] || 1,
        values[1] || values[0] || 1,
        values[2] || values[1] || values[0] || 1
      ];
      setDiceValues(dice);
      setIsRolling(false);
      setShowResult(true);
    }
  }, [rollResult]);

  const handleRoll = () => {
    setIsRolling(true);
    setShowResult(false);
    // Start rolling animation, then call actual roll after delay
    setTimeout(() => {
      onRoll();
    }, 1500); // 1.5s rolling animation
  };

  const hasResult = rollResult && Object.keys(rollResult).length > 0;

  return (
    <div className={`bg-black/90 backdrop-blur-xl border border-amber-500/40 rounded-[2rem] px-10 py-8 shadow-2xl text-center space-y-6 max-w-md ${className}`}>
      <div className="text-amber-300 font-black text-xl tracking-widest">擲骰決定插牌者</div>
      <div className="text-white/50 text-xs uppercase tracking-[0.3em]">21 點牌靴重設</div>

      {/* 3D Dice Display */}
      <div className="h-48 w-full relative">
        <Dice3D
          dice={diceValues}
          isRolling={isRolling}
        />
      </div>

      {/* Roll Results */}
      {showResult && hasResult && (
        <div className="space-y-3 animate-fade-in">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(rollResult).map(([name, value]) => (
              <div
                key={name}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${name === winner
                    ? 'bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30'
                    : 'bg-white/10 text-white/70'
                  }`}
              >
                {name}: <span className="text-lg">{value}</span>
              </div>
            ))}
          </div>
          {winner && (
            <div className="text-amber-400 font-black text-lg animate-pulse">
              🎲 {winner} 獲得插牌權！
            </div>
          )}
        </div>
      )}

      {/* Roll Button */}
      {!showResult && (
        <GameButton
          onClick={handleRoll}
          variant="primary"
          size="pillLg"
          className="text-lg w-full"
          disabled={isRolling}
        >
          {isRolling ? '擲骰中...' : '擲骰'}
        </GameButton>
      )}
    </div>
  );
};

export default RollPrompt;
