import React from 'react';

const LobbyHeader: React.FC = () => {
  return (
    <div className="w-full text-center pt-8 pb-4 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent blur-3xl"></div>
      <h1 className="casino-font text-5xl md:text-7xl font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 drop-shadow-[0_0_35px_rgba(251,191,36,0.5)] tracking-tight italic relative">
        慈善撲克王大賽
      </h1>
      <div className="flex items-center justify-center gap-4 mb-4 relative">
        <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"></div>
        <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.8)]"></div>
        <div className="h-px w-16 bg-gradient-to-l from-transparent via-amber-500/60 to-transparent"></div>
      </div>
      <p className="text-sm md:text-base text-slate-300 font-light tracking-[0.5em] uppercase opacity-80 relative">
        創 造 傳 奇 · 支 配 牌 桌
      </p>
    </div>
  );
};

export default LobbyHeader;
