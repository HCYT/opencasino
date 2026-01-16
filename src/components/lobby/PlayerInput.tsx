import React from 'react';

interface PlayerInputProps {
  playerName: string;
  setPlayerName: (name: string) => void;
}

const PlayerInput: React.FC<PlayerInputProps> = ({ playerName, setPlayerName }) => {
  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700/50 backdrop-blur-xl rounded-3xl p-6 shadow-2xl shadow-black/50">
      <label className="block text-[11px] font-black uppercase text-amber-400/70 mb-4 tracking-widest">
        輸入您的名號
      </label>
      <input
        type="text"
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        placeholder="例如：發哥、星爺..."
        className="w-full bg-slate-900/50 border-2 border-slate-700/50 rounded-2xl px-6 py-4 text-white text-lg font-bold focus:outline-none focus:border-amber-400 focus:bg-slate-900/70 transition-all placeholder:text-slate-600 placeholder:font-normal"
      />
    </div>
  );
};

export default PlayerInput;
