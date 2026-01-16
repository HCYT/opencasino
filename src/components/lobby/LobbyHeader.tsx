import React from 'react';

const LobbyHeader: React.FC = () => {
  return (
    <div className="w-full text-center pt-10 pb-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 to-transparent blur-3xl"></div>
      <h1 className="casino-font text-6xl md:text-8xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 drop-shadow-[0_0_50px_rgba(251,191,36,0.5)] tracking-tight italic relative">
        慈善撲克王大賽
      </h1>
      <div className="flex items-center justify-center gap-4 mb-6 relative">
        <div className="h-px w-24 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent"></div>
        <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse shadow-[0_0_12px_rgba(251,191,36,0.8)]"></div>
        <div className="h-px w-24 bg-gradient-to-l from-transparent via-amber-500/60 to-transparent"></div>
      </div>
      <p className="text-lg md:text-xl text-slate-300 font-light tracking-[0.3em] uppercase opacity-90 relative">
        創 造 傳 奇 · 支 配 牌 桌
      </p>
    </div>
  );
};

export default LobbyHeader;
