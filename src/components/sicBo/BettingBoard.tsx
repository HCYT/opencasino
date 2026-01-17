import React, { useMemo } from 'react';
import { SicBoBet, SicBoBetType, SICBO_PAYOUTS } from '../../services/sicBo/types';
import './BettingBoard.css';

interface BettingBoardProps {
    totalBets: SicBoBet[]; // 所有人的總下注
    userBets: SicBoBet[];  // 玩家自己的下注
    npcBets: SicBoBet[]; // 新增：所有 NPC 的下注列表
    onPlaceBet: (type: SicBoBetType, amount: number) => void;
    onRemoveBet: (type: SicBoBetType) => void;
    disabled: boolean;
    currentBetAmount: number;
    winningBets?: SicBoBetType[];
}

// 下注區域組件
const BetArea: React.FC<{
    type: SicBoBetType;
    label: string;
    payout: string;
    className?: string;
    totalAmount?: number; // 該區域總下注金額
    myAmount?: number;    // 玩家自己下注金額
    onClick: () => void;
    disabled: boolean;
    isWinning?: boolean;
    npcCount?: number; // 新增：下注的 NPC 數量
}> = ({ type, label, payout, className = '', totalAmount, myAmount, onClick, disabled, isWinning, npcCount }) => {
    const chipOffset = useMemo(() => ({
        x: (Math.random() - 0.5) * 20, // 修正：縮小 X 軸隨機偏移至 +/- 10px，避免溢出
        y: (Math.random() - 0.5) * 10  // 修正：縮小 Y 軸隨機偏移至 +/- 5px
    }), []);

    return (
        <div
            className={`bet-area relative group ${className} ${totalAmount ? 'has-bet' : ''} ${disabled ? 'disabled' : ''} ${isWinning ? 'winning' : ''}`}
            onClick={disabled ? undefined : onClick}
            data-type={type}
        >
            <div className="bet-label">{label}</div>
            <div className="bet-payout">{payout}</div>

            {/* 籌碼顯示 - 居中疊加隨機偏移 */}
            {totalAmount !== undefined && totalAmount > 0 && (() => {
                const displayStr = myAmount ? `$${myAmount.toLocaleString()}` : `$${totalAmount.toLocaleString()}`;
                const len = displayStr.length;
                const fontSizeClass = len > 7 ? 'text-[9px] tracking-tighter' : len > 5 ? 'text-[10px]' : 'text-xs';
                const othersAmount = totalAmount - (myAmount || 0);

                return (
                    <div
                        className={`bet-chip ${myAmount ? 'my-bet' : 'other-bet'} shadow-lg group-hover:z-30 transition-transform hover:scale-110 flex items-center justify-center ${fontSizeClass}`}
                        style={{
                            transform: `translate(calc(-50% + ${chipOffset.x}px), calc(-50% + ${chipOffset.y}px))`
                        }}
                        title={`Total: $${totalAmount.toLocaleString()} (${myAmount ? `You: $${myAmount.toLocaleString()}, ` : ''}${npcCount ? `${npcCount} NPCs: $${othersAmount.toLocaleString()}` : `Others: $${othersAmount.toLocaleString()}`})`}
                    >
                        {displayStr}
                        {myAmount > 0 && totalAmount > myAmount && (
                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-black text-[10px] px-1 rounded-full font-bold shadow-sm z-20">
                                +${(totalAmount - myAmount).toLocaleString()}
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
};

const BettingBoard: React.FC<BettingBoardProps> = ({
    totalBets,
    userBets,
    npcBets,
    onPlaceBet,
    onRemoveBet,
    disabled,
    currentBetAmount,
    winningBets = [],
}) => {
    const getAmounts = (type: SicBoBetType) => {
        const total = totalBets.find(b => b.type === type)?.amount || 0;
        const my = userBets.find(b => b.type === type)?.amount || 0;
        const npcCount = npcBets ? npcBets.filter(b => b.type === type).length : 0;
        return { total, my, npcCount };
    };

    const handleClick = (type: SicBoBetType) => {
        const { my } = getAmounts(type);
        if (my > 0) {
            onRemoveBet(type);
        } else {
            onPlaceBet(type, currentBetAmount);
        }
    };

    const isWinning = (type: SicBoBetType) => winningBets.includes(type);

    // 總點數賠率
    const totalPayouts: Record<number, number> = {
        4: 60, 5: 20, 6: 18, 7: 12, 8: 8, 9: 6,
        10: 6, 11: 6, 12: 6, 13: 8, 14: 12, 15: 18, 16: 20, 17: 60
    };

    // 對子組合
    const pairs: Array<[number, number]> = [
        [1, 2], [1, 3], [1, 4], [1, 5], [1, 6],
        [2, 3], [2, 4], [2, 5], [2, 6],
        [3, 4], [3, 5], [3, 6],
        [4, 5], [4, 6],
        [5, 6]
    ];

    return (
        <div className="betting-board">
            {/* 上方區域：大/小 + 圍骰 */}
            <div className="board-row board-top">
                <BetArea
                    type="SMALL"
                    label="小"
                    payout="1:1"
                    className="bet-small"
                    {...getAmounts('SMALL')}
                    totalAmount={getAmounts('SMALL').total}
                    myAmount={getAmounts('SMALL').my}
                    onClick={() => handleClick('SMALL')}
                    disabled={disabled}
                    isWinning={isWinning('SMALL')}
                />

                <div className="center-section">
                    {/* 雙子行 */}
                    <div className="doubles-row">
                        {[1, 2, 3, 4, 5, 6].map(n => (
                            <BetArea
                                key={`double-${n}`}
                                type={`DOUBLE_${n}` as SicBoBetType}
                                label={`⚀`.repeat(2)}
                                payout="1:10"
                                className="bet-double"
                                {...getAmounts(`DOUBLE_${n}` as SicBoBetType)}
                                totalAmount={getAmounts(`DOUBLE_${n}` as SicBoBetType).total}
                                myAmount={getAmounts(`DOUBLE_${n}` as SicBoBetType).my}
                                onClick={() => handleClick(`DOUBLE_${n}` as SicBoBetType)}
                                disabled={disabled}
                                isWinning={isWinning(`DOUBLE_${n}` as SicBoBetType)}
                            />
                        ))}
                    </div>

                    {/* 圍骰區域 */}
                    <div className="triples-row">
                        {[1, 2, 3].map(n => (
                            <BetArea
                                key={`triple-${n}`}
                                type={`TRIPLE_${n}` as SicBoBetType}
                                label={`${n}${n}${n}`}
                                payout="1:180"
                                className="bet-triple"
                                {...getAmounts(`TRIPLE_${n}` as SicBoBetType)}
                                totalAmount={getAmounts(`TRIPLE_${n}` as SicBoBetType).total}
                                myAmount={getAmounts(`TRIPLE_${n}` as SicBoBetType).my}
                                onClick={() => handleClick(`TRIPLE_${n}` as SicBoBetType)}
                                disabled={disabled}
                                isWinning={isWinning(`TRIPLE_${n}` as SicBoBetType)}
                            />
                        ))}
                        <BetArea
                            type="ANY_TRIPLE"
                            label="全圍"
                            payout="1:30"
                            className="bet-any-triple"
                            {...getAmounts('ANY_TRIPLE')}
                            totalAmount={getAmounts('ANY_TRIPLE').total}
                            myAmount={getAmounts('ANY_TRIPLE').my}
                            onClick={() => handleClick('ANY_TRIPLE')}
                            disabled={disabled}
                            isWinning={isWinning('ANY_TRIPLE')}
                        />
                        {[4, 5, 6].map(n => (
                            <BetArea
                                key={`triple-${n}`}
                                type={`TRIPLE_${n}` as SicBoBetType}
                                label={`${n}${n}${n}`}
                                payout="1:180"
                                className="bet-triple"
                                {...getAmounts(`TRIPLE_${n}` as SicBoBetType)}
                                totalAmount={getAmounts(`TRIPLE_${n}` as SicBoBetType).total}
                                myAmount={getAmounts(`TRIPLE_${n}` as SicBoBetType).my}
                                onClick={() => handleClick(`TRIPLE_${n}` as SicBoBetType)}
                                disabled={disabled}
                                isWinning={isWinning(`TRIPLE_${n}` as SicBoBetType)}
                            />
                        ))}
                    </div>
                </div>

                <BetArea
                    type="BIG"
                    label="大"
                    payout="1:1"
                    className="bet-big"
                    {...getAmounts('BIG')}
                    totalAmount={getAmounts('BIG').total}
                    myAmount={getAmounts('BIG').my}
                    onClick={() => handleClick('BIG')}
                    disabled={disabled}
                    isWinning={isWinning('BIG')}
                />
            </div>

            {/* 總點數行 */}
            <div className="board-row totals-row">
                {[4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map(n => (
                    <BetArea
                        key={`total-${n}`}
                        type={`TOTAL_${n}` as SicBoBetType}
                        label={String(n)}
                        payout={`1:${totalPayouts[n]}`}
                        className="bet-total"
                        {...getAmounts(`TOTAL_${n}` as SicBoBetType)}
                        totalAmount={getAmounts(`TOTAL_${n}` as SicBoBetType).total}
                        myAmount={getAmounts(`TOTAL_${n}` as SicBoBetType).my}
                        onClick={() => handleClick(`TOTAL_${n}` as SicBoBetType)}
                        disabled={disabled}
                        isWinning={isWinning(`TOTAL_${n}` as SicBoBetType)}
                    />
                ))}
            </div>

            {/* 對子行 */}
            <div className="board-row pairs-row">
                {pairs.map(([a, b]) => (
                    <BetArea
                        key={`pair-${a}-${b}`}
                        type={`PAIR_${a}_${b}` as SicBoBetType}
                        label={`${a}+${b}`}
                        payout="1:5"
                        className="bet-pair"
                        {...getAmounts(`PAIR_${a}_${b}` as SicBoBetType)}
                        totalAmount={getAmounts(`PAIR_${a}_${b}` as SicBoBetType).total}
                        myAmount={getAmounts(`PAIR_${a}_${b}` as SicBoBetType).my}
                        onClick={() => handleClick(`PAIR_${a}_${b}` as SicBoBetType)}
                        disabled={disabled}
                        isWinning={isWinning(`PAIR_${a}_${b}` as SicBoBetType)}
                    />
                ))}
            </div>

            {/* 單點行 */}
            <div className="board-row singles-row">
                {[1, 2, 3, 4, 5, 6].map(n => (
                    <BetArea
                        key={`single-${n}`}
                        type={`SINGLE_${n}` as SicBoBetType}
                        label={String(n)}
                        payout="1~3:1"
                        className="bet-single"
                        {...getAmounts(`SINGLE_${n}` as SicBoBetType)}
                        totalAmount={getAmounts(`SINGLE_${n}` as SicBoBetType).total}
                        myAmount={getAmounts(`SINGLE_${n}` as SicBoBetType).my}
                        onClick={() => handleClick(`SINGLE_${n}` as SicBoBetType)}
                        disabled={disabled}
                        isWinning={isWinning(`SINGLE_${n}` as SicBoBetType)}
                    />
                ))}
            </div>
        </div>
    );
};

export default BettingBoard;
