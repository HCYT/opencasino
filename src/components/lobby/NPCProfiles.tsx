import React from 'react';
import { NPC_PROFILES } from '@/config/npcProfiles';

const NPCDescriptions: Record<string, string> = {
  '高進': '賭神，傳奇中的傳奇。一手牌定乾坤，眼神就能讀心。',
  '陳小刀': '高進的徒弟，年輕氣盛但實力強勁。喜歡冒險，總能逆風翻盤。',
  '周星祖': '擁有特異功能的賭徒，能夠透視底牌。雖然實力強大，但運氣也不錯。',
  '龍五': '神秘的高手，沉默寡言。出手穩狠，從不輕易暴露實力。',
  '海珊': '傲慢的賭霸，總是要賭最大的。進取極端，絕不放過任何機會。',
  '海棠': '優雅的賭后，冷靜沉著。保守策略為主，但出手精準。',
  '仇笑癡': '笑裡藏刀的高手，最喜歡誘敵深入。欺詐和誘餌是他的拿手好戲。',
  '大軍': '擁有特異功能的一眼高人，喜歡炫耀。雖然有點傲氣，但實力不容小覷。'
};

const NPCProfiles: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-16 relative z-10">
      <div className="text-center mb-12">
        <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 mb-4">
          對手陣容
        </h2>
        <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-amber-500/60 to-transparent mx-auto"></div>
        <p className="text-slate-400 mt-4 text-sm uppercase tracking-widest">
          精英匯聚 · 等你挑戰
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {NPC_PROFILES.map((npc, index) => (
          <div
            key={npc.name}
            className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-3xl p-6 shadow-2xl backdrop-blur-xl hover:border-amber-400/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/10 overflow-hidden"
            style={{
              animationDelay: `${index * 100}ms`,
              animation: 'fadeInUp 0.6s ease-out forwards',
              opacity: 0
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <div className="relative z-10">
              <div className="w-28 h-28 mx-auto mb-4 rounded-full border-4 border-amber-400/30 overflow-hidden shadow-lg group-hover:border-amber-400/60 transition-all duration-300 group-hover:shadow-amber-500/20">
                <img
                  src={npc.avatar}
                  alt={npc.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(`
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
                        <rect width="100" height="100" fill="#1e293b"/>
                        <text x="50" y="55" text-anchor="middle" fill="#fbbf24" font-size="40" font-family="Arial" font-weight="bold">${npc.name[0]}</text>
                      </svg>
                    `)}`;
                  }}
                />
              </div>

              <h3 className="text-2xl font-black text-center text-white mb-2 group-hover:text-amber-300 transition-colors">
                {npc.name}
              </h3>

              <p className="text-slate-400 text-xs text-center leading-relaxed mb-4 h-12">
                {NPCDescriptions[npc.name]}
              </p>

              <div className="space-y-2 text-xs mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-12">保守</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-300"
                      style={{ width: `${npc.tacticWeights.CONSERVATIVE * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-12">欺詐</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${npc.tacticWeights.DECEPTIVE * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-12">誘餌</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-300"
                      style={{ width: `${npc.tacticWeights.BAIT * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 w-12">進取</span>
                  <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full transition-all duration-300"
                      style={{ width: `${npc.tacticWeights.AGGRESSIVE * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              <div className="pt-3">
                <p className="text-amber-200/60 text-xs text-center italic leading-relaxed">
                  "{npc.quotes.WIN[0]}"
                </p>
              </div>
            </div>

            <div className="absolute -top-3 -right-3 w-9 h-9 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center text-slate-900 font-black text-base shadow-lg border-2 border-slate-900">
              {index + 1}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default NPCProfiles;
