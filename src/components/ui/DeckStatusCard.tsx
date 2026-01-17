import React from 'react';

type DeckStatusCardProps = {
  deckCount: number;
  cutCardOwner: string;
  rollSummary: string;
  shufflePending: boolean;
  shoeSize?: number;
};

const DeckStatusCard: React.FC<DeckStatusCardProps> = ({
  deckCount,
  cutCardOwner,
  rollSummary,
  shufflePending,
  shoeSize = 312,
}) => {
  const progress = (deckCount / shoeSize) * 100;
  const cardStackHeight = Math.max(10, Math.floor((deckCount / shoeSize) * 60));

  return (
    <div className="absolute top-4 right-4 z-20 pointer-events-none">
      <div className="flex flex-col items-center gap-2">
        {/* 牌靴主體 */}
        <div
          className="relative w-16 h-24"
          style={{
            transform: 'perspective(200px) rotateX(5deg)',
          }}
        >
          {/* 牌靴外殼 */}
          <div
            className="absolute inset-0 rounded-lg"
            style={{
              background: 'linear-gradient(145deg, #3a3a4a 0%, #1a1a24 40%, #0a0a12 100%)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {/* 內部凹槽 */}
            <div
              className="absolute top-2 left-1/2 -translate-x-1/2 w-12 rounded"
              style={{
                height: '70px',
                background: 'linear-gradient(180deg, #050508 0%, #0a0a10 100%)',
                boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.9)',
                border: '1px solid rgba(0,0,0,0.5)',
              }}
            >
              {/* 牌堆 */}
              <div
                className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 rounded-sm transition-all duration-500"
                style={{
                  height: `${cardStackHeight}px`,
                  background: 'linear-gradient(90deg, #ddd 0%, #fff 20%, #f8f8f8 50%, #fff 80%, #ddd 100%)',
                  boxShadow: '0 -2px 4px rgba(0,0,0,0.3)',
                }}
              >
                <div
                  className="absolute inset-0 rounded-sm"
                  style={{
                    background: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(180,30,30,0.1) 3px, rgba(180,30,30,0.1) 5px)',
                  }}
                />
              </div>
            </div>

            {/* 發牌口 */}
            <div
              className="absolute bottom-0 left-1/2 -translate-x-1/2 w-10 h-3 rounded-t"
              style={{
                background: '#000',
                boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)',
              }}
            />
          </div>
        </div>

        {/* 進度條 */}
        <div className="w-16 h-1 bg-black/40 rounded-full overflow-hidden border border-white/10">
          <div
            className={`h-full transition-all duration-500 ${progress < 10 ? 'bg-red-500' :
                progress < 25 ? 'bg-yellow-500' :
                  'bg-emerald-500'
              }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* 剩餘牌數 */}
        <div className="text-[10px] text-white/50 font-mono">
          剩餘 {deckCount}
        </div>

        {/* 插牌者 */}
        {cutCardOwner && (
          <div className="text-[10px] text-amber-300/80">
            插牌：{cutCardOwner}
          </div>
        )}

        {/* 擲骰結果 */}
        {rollSummary && (
          <div className="text-[9px] text-white/40 text-center">
            🎲 {rollSummary}
          </div>
        )}

        {/* 洗牌提示 */}
        {shufflePending && (
          <div className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse">
            切牌已到
          </div>
        )}
      </div>
    </div>
  );
};

export default DeckStatusCard;
