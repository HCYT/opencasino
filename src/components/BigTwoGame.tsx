import React, { useMemo, useState } from 'react';
import { Card, Rank } from '../types';
import CardUI from './CardUI';
import {
  RANK_ORDER,
  canSplitDragon,
  cardKey,
  evaluateCombo,
  getFourKindCombos,
  getFullHouseCombos,
  getPlayablePairs,
  getPlayableTriples,
  getStraightCombos,
  getStraightFlushCombos,
  rankValue,
  setStrength,
  sortCards
} from '../services/bigTwo/rules';
import { BigTwoResult, BigTwoSeat } from '../services/bigTwo/types';
import { useBigTwoEngine } from '../services/bigTwo/useBigTwoEngine';

export type { BigTwoResult, BigTwoSeat } from '../services/bigTwo/types';

interface Suggestion {
  label: string;
  cards: Card[];
}

interface BigTwoGameProps {
  seats: BigTwoSeat[];
  baseBet: number;
  onExit: () => void;
  onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: BigTwoResult }>) => void;
}

const BigTwoGame: React.FC<BigTwoGameProps> = ({ seats, baseBet, onExit, onProfilesUpdate }) => {
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [statsOpen, setStatsOpen] = useState(false);
  const {
    players,
    currentTurnIndex,
    currentTrick,
    finishedOrder,
    mustIncludeThreeClubs,
    phase,
    message,
    setMessage,
    payoutSummary,
    roundStats,
    initializeGame,
    applyPlay,
    handlePass
  } = useBigTwoEngine({ seats, baseBet, onProfilesUpdate });

  const playerIndex = players.findIndex(p => !p.isAI);
  const player = players[playerIndex];
  const isPlayerTurn = phase === 'PLAYING' && playerIndex >= 0 && currentTurnIndex === playerIndex;

  const selectCards = (cards: Card[]) => setSelectedKeys(new Set(cards.map(cardKey)));

  const selectedCards = useMemo(() => {
    if (!player) return [];
    return player.hand.filter(card => selectedKeys.has(cardKey(card)));
  }, [player, selectedKeys]);

  const isSameSelection = (cards: Card[]) => {
    if (selectedKeys.size !== cards.length) return false;
    return cards.every(card => selectedKeys.has(cardKey(card)));
  };

  const suggestedCombos = useMemo(() => {
    if (!player || phase !== 'PLAYING') return [];
    const hand = player.hand;
    const bestByType: Record<string, { label: string; cards: Card[]; strength: number }> = {};

    const updateBest = (type: string, label: string, cards: Card[], strength: number) => {
      if (!bestByType[type] || strength > bestByType[type].strength) {
        bestByType[type] = { label, cards: sortCards(cards), strength };
      }
    };

    getPlayablePairs(hand, -1).forEach(cards => {
      const evalResult = evaluateCombo(cards);
      if (!evalResult || evalResult.type !== 'PAIR') return;
      updateBest('PAIR', `對子 ${cards[0].rank}`, cards, evalResult.strength);
    });

    getPlayableTriples(hand, -1).forEach(cards => {
      const evalResult = evaluateCombo(cards);
      if (!evalResult || evalResult.type !== 'TRIPLE') return;
      updateBest('TRIPLE', `三條 ${cards[0].rank}`, cards, evalResult.strength);
    });

    getFullHouseCombos(hand, -1).forEach(cards => {
      const evalResult = evaluateCombo(cards);
      if (!evalResult || evalResult.type !== 'FULL_HOUSE') return;
      const counts: Record<string, number> = {};
      cards.forEach(card => { counts[card.rank] = (counts[card.rank] || 0) + 1; });
      const tripleRank = Object.keys(counts).find(rank => counts[rank] === 3) as Rank;
      const pairRank = Object.keys(counts).find(rank => counts[rank] === 2) as Rank;
      updateBest('FULL_HOUSE', `葫蘆 ${tripleRank}滿${pairRank}`, cards, evalResult.strength);
    });

    getStraightCombos(hand).forEach(cards => {
      const evalResult = evaluateCombo(cards);
      if (!evalResult || evalResult.type !== 'STRAIGHT') return;
      const highRankValue = Math.max(...cards.map(card => rankValue(card.rank)));
      const highRank = RANK_ORDER[highRankValue];
      updateBest('STRAIGHT', `順子 ${highRank}`, cards, evalResult.strength);
    });

    getFourKindCombos(hand, -1).forEach(cards => {
      const evalResult = evaluateCombo(cards);
      if (!evalResult || evalResult.type !== 'FOUR_KIND') return;
      const quadRank = cards.find(card => cards.filter(c => c.rank === card.rank).length === 4)?.rank;
      if (quadRank) updateBest('FOUR_KIND', `鐵支 ${quadRank}`, cards, evalResult.strength);
    });

    getStraightFlushCombos(hand).forEach(cards => {
      const evalResult = evaluateCombo(cards);
      if (!evalResult || evalResult.type !== 'STRAIGHT_FLUSH') return;
      const highRankValue = Math.max(...cards.map(card => rankValue(card.rank)));
      const highRank = RANK_ORDER[highRankValue];
      updateBest('STRAIGHT_FLUSH', `同花順 ${highRank}`, cards, evalResult.strength);
    });

    if (canSplitDragon(hand)) {
      updateBest('DRAGON', '一條龍', hand, 0);
    }

    return [
      bestByType.PAIR,
      bestByType.TRIPLE,
      bestByType.FULL_HOUSE,
      bestByType.STRAIGHT,
      bestByType.FOUR_KIND,
      bestByType.STRAIGHT_FLUSH,
      bestByType.DRAGON
    ].filter((item): item is { label: string; cards: Card[]; strength: number } => Boolean(item));
  }, [player, phase]);

  const toggleSelect = (card: Card) => {
    if (phase !== 'PLAYING') return;
    if (!player || currentTurnIndex !== playerIndex) return;
    const key = cardKey(card);
    setSelectedKeys(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handlePlay = () => {
    if (!player || currentTurnIndex !== playerIndex) return;
    if (selectedCards.length === 0) {
      setMessage('請先選牌');
      return;
    }
    const success = applyPlay(playerIndex, selectedCards);
    if (success) {
      setSelectedKeys(new Set());
    }
  };

  // Big Two engine handles AI turns and payouts.

  const ranking = finishedOrder.map(idx => players[idx]).filter(Boolean);
  const statsSummary = roundStats.reduce((acc, stat) => {
    acc.rounds += 1;
    acc.twos += stat.twos;
    acc.pairs += stat.pairs;
    acc.triples += stat.triples;
    acc.straights += stat.straights;
    acc.fullHouses += stat.fullHouses;
    acc.fourKinds += stat.fourKinds;
    acc.straightFlushes += stat.straightFlushes;
    acc.dragons += stat.dragons;
    return acc;
  }, {
    rounds: 0,
    twos: 0,
    pairs: 0,
    triples: 0,
    straights: 0,
    fullHouses: 0,
    fourKinds: 0,
    straightFlushes: 0,
    dragons: 0
  });
  const averagePerRound = (value: number) => statsSummary.rounds > 0 ? (value / statsSummary.rounds).toFixed(2) : '0.00';

  return (
    <div className="game-container bg-[#052c16] relative overflow-visible select-none h-screen w-full">
      <div className="table-area relative w-full h-full">
        <div className="absolute inset-8 rounded-[120px] border-[20px] border-[#3d2414] shadow-[inset_0_0_120px_rgba(0,0,0,0.9),0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="w-full h-full bg-[#0a4a27] relative flex items-center justify-center">
            <div className="absolute inset-20 border-[2px] border-white/5 rounded-[80px]"></div>

            <div className="absolute top-6 left-10 text-yellow-500/80 font-black uppercase tracking-[0.3em] text-xs">慈善撲克王大賽 · 大老二</div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-48 z-[40]">
              <div className="bg-black/60 backdrop-blur-xl px-10 py-3 rounded-full border border-yellow-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                <span className="text-yellow-400 font-black tracking-widest text-lg uppercase whitespace-nowrap drop-shadow-md">
                  {phase === 'RESULT'
                    ? '本局結束'
                    : `${players[currentTurnIndex]?.name || ''} 出牌中...`}
                </span>
              </div>
            </div>

            <div className="text-center z-10">
              <div className="text-yellow-500/40 font-black text-[10px] tracking-[0.5em] casino-font uppercase mb-2">桌面</div>
              {currentTrick ? (
                <div className="flex flex-wrap items-center justify-center gap-2">
                  {currentTrick.cards.map((card, idx) => (
                    <CardUI key={`trick-${idx}`} card={card} className="deal-card" />
                  ))}
                </div>
              ) : (
                <div className="text-white/30 text-sm">等待出牌</div>
              )}
              {currentTrick && (
                <div className="text-emerald-200 font-black text-xs uppercase tracking-widest mt-3">
                  {currentTrick.type}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="absolute inset-0 p-12 pointer-events-none">
          {players.map((p, i) => {
            let style: React.CSSProperties = {};
            let vertical = false;

            if (p.id === 'player') {
              style = { bottom: '2rem', left: '50%', transform: 'translateX(-50%)' };
            } else if (i === 1) {
              style = { left: '4rem', top: '50%', transform: 'translateY(-50%)' };
              vertical = true;
            } else if (i === 2) {
              style = { top: '3rem', left: '50%', transform: 'translateX(-50%)' };
            } else {
              style = { right: '4rem', top: '50%', transform: 'translateY(-50%)' };
              vertical = true;
            }

            const isActiveSeat = phase === 'PLAYING' && currentTurnIndex === i;

            return (
              <div key={p.id} className="absolute flex flex-col items-center" style={style}>
                <div className={`bg-black/70 border ${isActiveSeat ? 'border-emerald-400/60' : 'border-white/10'} rounded-[24px] px-5 py-4 shadow-2xl min-w-[220px] max-w-[260px] ${vertical ? 'scale-95' : ''}`}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full border-2 border-yellow-400/40 object-cover" />
                      <div>
                        <div className="text-lg font-black text-white">{p.name}</div>
                        <div className="text-[10px] text-white/40 uppercase tracking-widest">{p.isAI ? 'NPC' : '玩家'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-300 font-black text-lg">{p.hand.length} 張</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest">剩餘</div>
                    </div>
                  </div>
                  {p.quote && (
                    <div className="mt-3 bg-white text-slate-900 text-xs font-black rounded-xl px-3 py-2 shadow-lg">
                      {p.quote}
                    </div>
                  )}
                  {p.passed && !p.finished && (
                    <div className="mt-2 text-xs text-red-300 font-black uppercase tracking-widest">PASS</div>
                  )}
                  {p.finished && (
                    <div className="mt-2 text-xs text-yellow-300 font-black uppercase tracking-widest">已出完</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-6 z-[60] pointer-events-none">
        <div className="max-w-[1400px] mx-auto w-full h-full relative flex items-end justify-between">
          <div className="flex flex-row items-end gap-3 pointer-events-auto">
            <div className="bg-black/80 backdrop-blur-xl px-6 py-4 rounded-[2rem] border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col gap-1 min-w-[220px]">
              <div className="text-white/40 text-[10px] uppercase font-black tracking-[0.2em] flex items-center gap-2">
                <span>My Hand</span>
                {isPlayerTurn && <span className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></span>}
              </div>
              <div className="text-yellow-500 font-mono font-black text-2xl">{player?.hand.length || 0} 張</div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest">每張 ${baseBet.toLocaleString()}</div>
              {mustIncludeThreeClubs && (
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest mt-1">
                  首家必含梅花 3
                </div>
              )}
            </div>
          </div>

          <div className="pointer-events-auto flex items-end gap-4 h-[180px]">
            {phase === 'PLAYING' && (
              <div className="flex items-end gap-3">
                {isPlayerTurn ? (
                  <div className="flex items-end gap-3">
                    <button
                      onClick={handlePlay}
                      className="w-24 h-24 rounded-[1.5rem] bg-emerald-600 text-white font-black uppercase tracking-widest shadow-lg hover:brightness-110"
                    >
                      出牌
                    </button>
                    <button
                      onClick={handlePass}
                      disabled={!currentTrick}
                      className="w-24 h-24 rounded-[1.5rem] bg-red-600 text-white font-black uppercase tracking-widest shadow-lg hover:brightness-110 disabled:opacity-50"
                    >
                      過
                    </button>
                  </div>
                ) : (
                  <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/10 text-white/60 font-black uppercase tracking-widest">
                    NPC 行動中
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => setStatsOpen(true)}
              className="ml-2 bg-black/50 border border-white/10 text-white/70 font-black px-6 py-4 rounded-2xl uppercase tracking-widest hover:text-white hover:border-white/40"
            >
              牌局統計
            </button>

            {phase === 'RESULT' && (
              <div className="flex items-end gap-3">
                <div className="bg-black/60 backdrop-blur-md px-6 py-4 rounded-[1.5rem] border border-white/10 text-yellow-300 font-black">
                  本局結束
                </div>
                <button
                  onClick={initializeGame}
                  className="bg-white text-slate-900 font-black px-10 py-5 rounded-2xl shadow-xl"
                >
                  再來一局
                </button>
              </div>
            )}

            <button
              onClick={onExit}
              className="ml-4 bg-black/50 border border-white/10 text-white/70 font-black px-6 py-4 rounded-2xl uppercase tracking-widest hover:text-white hover:border-white/40"
            >
              返回大廳
            </button>
          </div>
        </div>
      </div>

      {phase === 'RESULT' && ranking.length > 0 && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[6px] flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center animate-in fade-in zoom-in duration-700">
            <h2 className="text-[6rem] md:text-[8rem] font-black text-yellow-500 drop-shadow-[0_0_60px_rgba(0,0,0,1)] casino-font mb-4 italic tracking-tight text-shadow">慈善撲克王大賽</h2>
            <div className="text-2xl md:text-3xl font-black mb-6 text-emerald-400">大老二名次</div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {ranking.map((p, idx) => (
                <div key={p.id} className="bg-black/60 border border-yellow-400/20 rounded-[2.5rem] px-8 py-6 shadow-2xl max-w-[340px]">
                  <div className="text-yellow-300 text-sm font-black uppercase tracking-widest">第 {idx + 1} 名</div>
                  <img
                    src={p.avatar}
                    alt={p.name}
                    className="w-24 h-24 rounded-full object-cover border-4 border-yellow-400/40 shadow-[0_0_30px_rgba(234,179,8,0.35)] mx-auto mt-3"
                  />
                  <div className="text-white text-2xl font-black mt-4 tracking-tight">{p.name}</div>
                </div>
              ))}
            </div>
            {payoutSummary && (
              <div className="mt-8 bg-black/60 border border-white/10 rounded-[2rem] px-6 py-5 max-w-[720px] mx-auto text-left">
                <div className="text-emerald-200 font-black text-sm uppercase tracking-widest">結算金額（每張 ${payoutSummary.baseBet.toLocaleString()}）</div>
                <div className="text-yellow-300 font-black text-xl mt-2">
                  {payoutSummary.winnerName} 獲得 +${payoutSummary.totalGain.toLocaleString()}
                </div>
                {payoutSummary.winnerMultipliers.length > 0 && (
                  <div className="text-[11px] text-white/50 font-black uppercase tracking-widest mt-2">
                    {payoutSummary.winnerMultipliers.join(' · ')}
                  </div>
                )}
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2">
                  {payoutSummary.lines.map(line => (
                    <div key={line.name} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2">
                      <div className="text-white/80 font-black text-sm">{line.name}</div>
                      <div className="text-xs text-white/50">剩 {line.remaining} 張</div>
                      <div className="text-red-300 font-black text-sm">-${line.amount.toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {message && phase === 'PLAYING' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[80] bg-black/70 border border-white/10 px-6 py-3 rounded-full text-sm text-white/80 font-black">
          {message}
        </div>
      )}

      {player && phase === 'PLAYING' && (
        <>
          {player && suggestedCombos.length > 0 && (
            <div className="absolute bottom-[9.5rem] left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-2 px-6 pl-[220px] pr-[260px] w-[92vw] max-w-[1400px] pointer-events-auto z-[85]">
              {suggestedCombos.map(combo => (
                <button
                  key={combo.label}
                  onClick={() => {
                    if (!isPlayerTurn) return;
                    if (isSameSelection(combo.cards)) {
                      setSelectedKeys(new Set());
                    } else {
                      selectCards(combo.cards);
                    }
                  }}
                  className={`px-4 py-2 rounded-full bg-black/60 border text-white/80 text-xs font-black uppercase tracking-widest transition-all ${isPlayerTurn ? 'border-white/10 hover:border-yellow-400/60 hover:text-yellow-200' : 'border-white/5 opacity-50 cursor-not-allowed'}`}
                >
                  {combo.label}
                </button>
              ))}
            </div>
          )}
          <div className="absolute bottom-[12.5rem] left-1/2 -translate-x-1/2 flex flex-nowrap justify-center px-4 pl-[220px] pr-[260px] w-[92vw] max-w-[1400px] pointer-events-auto z-[80]">
            {player.hand.map((card, idx) => {
              const key = cardKey(card);
              const selected = selectedKeys.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleSelect(card)}
                  className={`relative transition-transform ${idx > 0 ? '-ml-6 md:-ml-5' : ''} ${selected ? '-translate-y-4 scale-105' : ''}`}
                  style={{ zIndex: idx + 1 }}
                >
                  <CardUI card={card} className={selected ? 'ring-2 ring-yellow-400' : ''} />
                </button>
              );
            })}
          </div>
        </>
      )}

      {statsOpen && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[4px] flex items-center justify-center z-[90] pointer-events-auto">
          <div className="bg-black/80 border border-white/10 rounded-[2rem] p-8 w-[92vw] max-w-3xl text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-yellow-400 font-black text-sm uppercase tracking-[0.3em]">發牌統計</div>
                <div className="text-white/50 text-xs mt-1">最近 {roundStats.length} 局</div>
              </div>
              <button
                onClick={() => setStatsOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white/80 font-black text-xs hover:bg-white/20"
              >
                關閉
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs font-black">
              <div className="bg-white/5 rounded-xl px-4 py-3">2 點總數 <span className="text-emerald-300 ml-2">{statsSummary.twos}</span></div>
              <div className="bg-white/5 rounded-xl px-4 py-3">對子總數 <span className="text-emerald-300 ml-2">{statsSummary.pairs}</span></div>
              <div className="bg-white/5 rounded-xl px-4 py-3">三條總數 <span className="text-emerald-300 ml-2">{statsSummary.triples}</span></div>
              <div className="bg-white/5 rounded-xl px-4 py-3">順子總數 <span className="text-emerald-300 ml-2">{statsSummary.straights}</span></div>
              <div className="bg-white/5 rounded-xl px-4 py-3">葫蘆總數 <span className="text-emerald-300 ml-2">{statsSummary.fullHouses}</span></div>
              <div className="bg-white/5 rounded-xl px-4 py-3">鐵支總數 <span className="text-emerald-300 ml-2">{statsSummary.fourKinds}</span></div>
              <div className="bg-white/5 rounded-xl px-4 py-3">同花順總數 <span className="text-emerald-300 ml-2">{statsSummary.straightFlushes}</span></div>
              <div className="bg-white/5 rounded-xl px-4 py-3">一條龍總數 <span className="text-emerald-300 ml-2">{statsSummary.dragons}</span></div>
              <div className="bg-white/5 rounded-xl px-4 py-3">平均 2 點/局 <span className="text-emerald-300 ml-2">{averagePerRound(statsSummary.twos)}</span></div>
            </div>

            <div className="mt-6 text-[11px] font-black text-white/60 uppercase tracking-widest">最近局數</div>
            <div className="mt-3 max-h-56 overflow-y-auto pr-2 space-y-2">
              {roundStats.slice().reverse().slice(0, 12).map(stat => (
                <div key={stat.timestamp} className="flex items-center justify-between bg-white/5 rounded-xl px-4 py-2 text-xs">
                  <div className="text-white/70">{new Date(stat.timestamp).toLocaleTimeString()}</div>
                  <div className="text-white/50">2 點 {stat.twos}</div>
                  <div className="text-white/50">對 {stat.pairs}</div>
                  <div className="text-white/50">三 {stat.triples}</div>
                  <div className="text-white/50">順 {stat.straights}</div>
                  <div className="text-white/50">葫 {stat.fullHouses}</div>
                  <div className="text-white/50">鐵 {stat.fourKinds}</div>
                  <div className="text-white/50">同花順 {stat.straightFlushes}</div>
                  <div className="text-white/50">龍 {stat.dragons}</div>
                </div>
              ))}
              {roundStats.length === 0 && (
                <div className="text-xs text-white/40">尚無資料</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BigTwoGame;
