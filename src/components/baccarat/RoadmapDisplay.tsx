import React, { useMemo, useRef, useEffect } from 'react';
import { BaccaratHistoryItem } from '../../services/baccarat/types';
import { generateBeadPlate, generateBigRoad, BeadPlateItem, BigRoadItem } from '../../services/baccarat/roadmapLogic';

interface RoadmapDisplayProps {
    history: BaccaratHistoryItem[];
}

const BeadCell = ({ item }: { item?: BeadPlateItem }) => {
    if (!item) return <div className="w-6 h-6 border border-white/5 bg-white/5" />;

    const bgColor = item.result === 'BANKER_WIN' ? 'bg-red-500' : item.result === 'PLAYER_WIN' ? 'bg-blue-500' : 'bg-green-500';
    const text = item.result === 'BANKER_WIN' ? '庄' : item.result === 'PLAYER_WIN' ? '闲' : '和';

    return (
        <div className="w-6 h-6 border border-white/10 bg-white/5 flex items-center justify-center relative">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${bgColor}`}>
                {text}
            </div>
            {item.bankerPair && <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white shadow-sm" />}
            {item.playerPair && <div className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white shadow-sm" />}
        </div>
    );
};

const BigRoadCell = ({ item }: { item?: BigRoadItem }) => {
    if (!item) return <div className="w-4 h-4 border border-white/5 bg-white/5" />;

    const borderColor = item.result === 'BANKER_WIN' ? 'border-red-500' : 'border-blue-500';

    return (
        <div className="w-4 h-4 border border-white/10 bg-white/5 flex items-center justify-center relative">
            {/* 空心圓 */}
            <div className={`w-3 h-3 rounded-full border-2 ${borderColor}`} />

            {/* 和局綠條 */}
            {item.tieCount > 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-green-500 transform -rotate-45">
                    {item.tieCount > 1 && (
                        <span className="absolute -top-2 left-1 text-[8px] text-green-500 font-bold">{item.tieCount}</span>
                    )}
                </div>
            )}

            {/* 對子點 */}
            {item.bankerPair && <div className="absolute top-0 left-0 w-1 h-1 bg-red-500 rounded-full" />}
            {item.playerPair && <div className="absolute bottom-0 right-0 w-1 h-1 bg-blue-500 rounded-full" />}
        </div>
    );
};

const RoadmapDisplay: React.FC<RoadmapDisplayProps> = ({ history }) => {
    const beadPlate = useMemo(() => generateBeadPlate(history), [history]);
    const bigRoad = useMemo(() => generateBigRoad(history), [history]);
    const scrollRef = useRef<HTMLDivElement>(null);

    // 自動滾動到最右邊
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
        }
    }, [history]);

    // Bead Plate Grid Construction
    const beadRows = 6;
    const beadCols = Math.max(12, Math.ceil(history.length / beadRows) + 2);
    const beadGrid = useMemo(() => {
        const grid: (BeadPlateItem | undefined)[][] = Array(beadCols).fill(null).map(() => Array(beadRows).fill(undefined));
        beadPlate.forEach(item => {
            if (item.col < beadCols) grid[item.col][item.row] = item;
        });
        return grid;
    }, [beadPlate, beadCols]);

    // Big Road Grid Construction
    const bigRows = 6;
    const maxBigCol = bigRoad.reduce((max, item) => Math.max(max, item.col), 0);
    const bigCols = Math.max(25, maxBigCol + 5);
    const bigGrid = useMemo(() => {
        const grid: (BigRoadItem | undefined)[][] = Array(bigCols).fill(null).map(() => Array(bigRows).fill(undefined));
        bigRoad.forEach(item => {
            if (item.col < bigCols) grid[item.col][item.row] = item;
        });
        return grid;
    }, [bigRoad, bigCols]);

    return (
        <div className="flex flex-col w-full bg-[#0a0a0a] border-t border-white/10">
            <div className="flex overflow-x-auto scrollbar-hide" ref={scrollRef}>
                <div className="flex">
                    {/* Bead Plate Panel */}
                    <div className="flex flex-col border-r border-white/10 bg-white/5">
                        <div className="flex">
                            {beadGrid.map((col, cIdx) => (
                                <div key={cIdx} className="flex flex-col">
                                    {col.map((item, rIdx) => (
                                        <BeadCell key={`${cIdx}-${rIdx}`} item={item} />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="text-[10px] text-center text-white/30 py-1 font-mono uppercase tracking-wider bg-black/20">Bead Plate</div>
                    </div>

                    {/* Big Road Panel */}
                    <div className="flex flex-col bg-white/5">
                        <div className="flex">
                            {bigGrid.map((col, cIdx) => (
                                <div key={cIdx} className="flex flex-col">
                                    {col.map((item, rIdx) => (
                                        <BigRoadCell key={`${cIdx}-${rIdx}`} item={item} />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="text-[10px] text-center text-white/30 py-1 font-mono uppercase tracking-wider bg-black/20">Big Road</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RoadmapDisplay;
