import { useCallback, useEffect, useRef, useState } from 'react';
import { Card, NPCProfile } from '../../types';
import { createDeck } from '../pokerLogic';
import { playSound } from '../sound';
import { aiChoosePlay } from './ai';
import { pickAiTactic } from './aiTactics';
import { loadRoundStats, saveRoundStats } from './statsStore';
import {
  THREE_CLUBS_KEY,
  canBeat,
  canSplitDragon,
  cardKey,
  evaluateCombo,
  getFourKindCombos,
  getFullHouseCombos,
  getNextActiveIndex,
  getPlayablePairs,
  getPlayableTriples,
  getStraightCombos,
  getStraightFlushCombos,
  sortCards
} from './rules';
import { BigTwoPlayer, BigTwoSeat, BigTwoResult, RoundStat, TrickState } from './types';

export interface PayoutLine {
  name: string;
  remaining: number;
  amount: number;
  multipliers: string[];
}

export interface PayoutSummary {
  winnerName: string;
  baseBet: number;
  totalGain: number;
  winnerMultipliers: string[];
  lines: PayoutLine[];
}

interface UseBigTwoEngineParams {
  seats: BigTwoSeat[];
  baseBet: number;
  npcProfiles: NPCProfile[];
  onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: BigTwoResult }>) => void;
  nightmareMode: boolean;
}

type Phase = 'PLAYING' | 'RESULT';

export const useBigTwoEngine = ({ seats, baseBet, npcProfiles, onProfilesUpdate, nightmareMode }: UseBigTwoEngineParams) => {
  const [players, setPlayers] = useState<BigTwoPlayer[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [currentTrick, setCurrentTrick] = useState<TrickState | null>(null);
  const [finishedOrder, setFinishedOrder] = useState<number[]>([]);
  const [mustIncludeThreeClubs, setMustIncludeThreeClubs] = useState(true);
  const [phase, setPhase] = useState<Phase>('PLAYING');
  const [message, setMessage] = useState('');
  const [playedCards, setPlayedCards] = useState<Card[]>([]);
  const [payoutSettled, setPayoutSettled] = useState(false);
  const [payoutSummary, setPayoutSummary] = useState<PayoutSummary | null>(null);
  const [roundStats, setRoundStats] = useState<RoundStat[]>(() => loadRoundStats());

  const aiTimerRef = useRef<number | null>(null);
  const quoteTimeoutRef = useRef<Record<string, number>>({});
  const idleTimerRef = useRef<number | null>(null);
  const playersRef = useRef(players);

  useEffect(() => {
    playersRef.current = players;
  }, [players]);

  const buildRoundStat = useCallback((snapshotPlayers: BigTwoPlayer[]): RoundStat => {
    return snapshotPlayers.reduce<RoundStat>((acc, p) => {
      acc.twos += p.hand.filter(card => card.rank === '2').length;
      acc.pairs += getPlayablePairs(p.hand, -1).length;
      acc.triples += getPlayableTriples(p.hand, -1).length;
      acc.straights += getStraightCombos(p.hand).length;
      acc.fullHouses += getFullHouseCombos(p.hand, -1).length;
      acc.fourKinds += getFourKindCombos(p.hand, -1).length;
      acc.straightFlushes += getStraightFlushCombos(p.hand).length;
      acc.dragons += canSplitDragon(p.hand) ? 1 : 0;
      return acc;
    }, {
      timestamp: Date.now(),
      baseBet,
      twos: 0,
      pairs: 0,
      triples: 0,
      straights: 0,
      fullHouses: 0,
      fourKinds: 0,
      straightFlushes: 0,
      dragons: 0
    });
  }, [baseBet]);

  const initializeGame = useCallback(() => {
    const deck = createDeck();
    const handBuckets: Card[][] = seats.map(() => []);
    deck.forEach((card, idx) => {
      handBuckets[idx % seats.length].push({ ...card, isFaceUp: true });
    });

    const updatedPlayers: BigTwoPlayer[] = seats.map((seat, idx) => {
      const profile = seat.isAI ? npcProfiles.find(npc => npc.name === seat.name) : undefined;
      return {
        ...seat,
        hand: sortCards(handBuckets[idx]),
        passed: false,
        finished: false,
        quote: undefined,
        tactic: seat.isAI ? pickAiTactic(profile?.tacticWeights) : undefined
      };
    });

    const firstIndex = updatedPlayers.findIndex(p => p.hand.some(card => cardKey(card) === THREE_CLUBS_KEY));
    const startIndex = firstIndex >= 0 ? firstIndex : 0;

    setPlayers(updatedPlayers);
    setCurrentTurnIndex(startIndex);
    setCurrentTrick(null);
    setFinishedOrder([]);
    setMustIncludeThreeClubs(true);
    setPhase('PLAYING');
    setMessage('');
    setPlayedCards([]);
    setPayoutSettled(false);
    setPayoutSummary(null);

    const newStat = buildRoundStat(updatedPlayers);
    setRoundStats(prev => {
      const next = [...prev, newStat].slice(-100);
      saveRoundStats(next);
      return next;
    });
  }, [seats, npcProfiles, buildRoundStat]);


  useEffect(() => {
    initializeGame();
    return () => {
      if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
      Object.values(quoteTimeoutRef.current).forEach(timer => window.clearTimeout(timer as number));
      quoteTimeoutRef.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateFinishedOrder = useCallback((nextPlayers: BigTwoPlayer[], newFinished: number[]) => {
    const completed = [...newFinished];
    nextPlayers.forEach((p, idx) => {
      if (!p.finished && p.hand.length === 0) {
        p.finished = true;
        completed.push(idx);
      }
    });
    return completed;
  }, []);

  const advanceTurn = useCallback((nextPlayers: BigTwoPlayer[], startFrom: number) => {
    const nextIndex = getNextActiveIndex(nextPlayers, startFrom);
    setCurrentTurnIndex(nextIndex);
  }, []);

  const resolveEndIfNeeded = useCallback((nextPlayers: BigTwoPlayer[], newFinished: number[]) => {
    if (newFinished.length >= nextPlayers.length - 1) {
      const remaining = nextPlayers
        .map((p, idx) => ({ p, idx }))
        .filter(({ p, idx }) => !newFinished.includes(idx) && p.hand.length > 0)
        .map(({ idx }) => idx);
      const finalOrder = [...newFinished, ...remaining];
      setFinishedOrder(finalOrder);
      setPhase('RESULT');
      return true;
    }
    return false;
  }, []);

  const hasMonsterInHand = (hand: Card[]) => {
    if (canSplitDragon(hand)) return true;
    if (hand.length >= 5) {
      const counts: Record<string, number> = {};
      hand.forEach(card => { counts[card.rank] = (counts[card.rank] || 0) + 1; });
      if (Object.values(counts).some(count => count >= 4)) return true;
      if (getStraightFlushCombos(hand).length > 0) return true;
    }
    return false;
  };

  const setNpcQuote = useCallback((name: string, type: keyof NPCProfile['quotes']) => {
    const profile = npcProfiles.find(p => p.name === name);
    if (!profile) return;
    const player = playersRef.current.find(p => p.name === name);
    const tactic = player?.tactic;
    const tacticPool = tactic ? profile.tacticQuotes?.[tactic] : undefined;
    const basePool = profile.quotes[type];
    if (!basePool || basePool.length === 0) return;
    const tacticBias: Record<string, number> = {
      BAIT: 0.65,
      CONSERVATIVE: 0.55,
      DECEPTIVE: 0.75,
      AGGRESSIVE: 0.7
    };
    const bias = tactic ? tacticBias[tactic] ?? 0.6 : 0.6;
    const useTactic = tacticPool && tacticPool.length > 0 && Math.random() < bias;
    const pool = useTactic ? tacticPool : basePool;
    const quote = pool[Math.floor(Math.random() * pool.length)];
    setPlayers(prev => prev.map(p => (p.name === name ? { ...p, quote } : p)));
    if (quoteTimeoutRef.current[name]) {
      window.clearTimeout(quoteTimeoutRef.current[name]);
    }
    quoteTimeoutRef.current[name] = window.setTimeout(() => {
      setPlayers(prev => prev.map(p => (p.name === name ? { ...p, quote: undefined } : p)));
      delete quoteTimeoutRef.current[name];
    }, 2600);
  }, [npcProfiles]);

  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const current = playersRef.current[currentTurnIndex];
    if (!current || current.isAI || current.finished) return;

    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      const snapshot = playersRef.current;
      const stillCurrent = snapshot[currentTurnIndex]?.id === current.id;
      if (!stillCurrent) return;
      const tauntCandidates = snapshot.filter(p => p.isAI && !p.finished && p.id !== current.id);
      if (tauntCandidates.length === 0) return;
      tauntCandidates.forEach(p => {
        setNpcQuote(p.name, 'WAITING');
      });
    }, 12000);

    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, [phase, currentTurnIndex, players, setNpcQuote]);

  const settlePayout = useCallback((winnerIdx: number, winningPlay: Card[], snapshotPlayers: BigTwoPlayer[]) => {
    const winningEval = evaluateCombo(winningPlay);
    const winningIsMonster = winningEval?.type === 'FOUR_KIND' || winningEval?.type === 'STRAIGHT_FLUSH' || winningEval?.type === 'DRAGON';
    const winningTwos = winningPlay.filter(card => card.rank === '2').length;
    const winnerMultipliers: string[] = [];
    if (winningIsMonster) winnerMultipliers.push('怪物尾手 x2');
    if (winningTwos > 0) winnerMultipliers.push(`尾手 2 x${Math.pow(2, winningTwos)}`);

    let totalGain = 0;
    const lines: PayoutLine[] = [];

    const updated = snapshotPlayers.map((p, idx) => {
      if (idx === winnerIdx) return p;
      const remainingCount = p.hand.length;
      let countMultiplier = 1;
      if (remainingCount >= 10) countMultiplier = 3;
      else if (remainingCount >= 8) countMultiplier = 2;

      const twosLeft = p.hand.filter(card => card.rank === '2').length;
      const twosMultiplier = Math.pow(2, twosLeft);
      const monsterMultiplier = hasMonsterInHand(p.hand) ? 2 : 1;
      const winningTwosMultiplier = winningTwos > 0 ? Math.pow(2, winningTwos) : 1;
      const winningMonsterMultiplier = winningIsMonster ? 2 : 1;

      const base = baseBet * remainingCount;
      const amount = base * countMultiplier * twosMultiplier * monsterMultiplier * winningTwosMultiplier * winningMonsterMultiplier;
      totalGain += amount;
      const multipliers: string[] = [];
      if (countMultiplier > 1) multipliers.push(`剩牌 ${remainingCount} 張 x${countMultiplier}`);
      if (twosMultiplier > 1) multipliers.push(`未出 2 x${twosMultiplier}`);
      if (monsterMultiplier > 1) multipliers.push('怪物未出 x2');
      if (winningTwosMultiplier > 1) multipliers.push(`尾手 2 x${winningTwosMultiplier}`);
      if (winningMonsterMultiplier > 1) multipliers.push('尾手怪物 x2');
      lines.push({ name: p.name, remaining: remainingCount, amount, multipliers });
      return { ...p, chips: p.chips - amount };
    });

    updated[winnerIdx] = { ...updated[winnerIdx], chips: updated[winnerIdx].chips + totalGain };
    setPlayers(updated);
    setPayoutSettled(true);
    playSound('slot-win');
    setPayoutSummary({
      winnerName: updated[winnerIdx].name,
      baseBet,
      totalGain,
      winnerMultipliers,
      lines
    });

    const updates = updated.map((p, idx) => ({
      name: p.name,
      chips: p.chips,
      result: (idx === winnerIdx ? 'WIN' : 'LOSE') as BigTwoResult
    }));
    onProfilesUpdate(updates);
    if (updated[winnerIdx]?.isAI) {
      setNpcQuote(updated[winnerIdx].name, 'WIN');
    }
  }, [baseBet, onProfilesUpdate, setNpcQuote]);

  const applyPlay = useCallback((playerIdx: number, cards: Card[]) => {
    const wasFirstFinish = finishedOrder.length === 0;
    const combo = evaluateCombo(cards);
    if (!combo) {
      setMessage('牌型不合法');
      return false;
    }

    if (mustIncludeThreeClubs && !cards.some(card => cardKey(card) === THREE_CLUBS_KEY)) {
      setMessage('首家必須包含梅花 3');
      return false;
    }

    if (!canBeat(combo, currentTrick)) {
      setMessage('無法壓過上一手');
      return false;
    }

    const nextPlayers = players.map((p, idx) => {
      if (idx !== playerIdx) return { ...p, passed: false };
      const remaining = p.hand.filter(card => !cards.some(c => cardKey(c) === cardKey(card)));
      return { ...p, hand: sortCards(remaining), passed: false };
    });

    const updatedFinished = updateFinishedOrder(nextPlayers, finishedOrder);
    setFinishedOrder(updatedFinished);

    const trick: TrickState = {
      ...combo,
      cards: sortCards(cards),
      playerIndex: playerIdx
    };

    setCurrentTrick(trick);
    setMustIncludeThreeClubs(false);
    setPlayers(nextPlayers);
    if (nextPlayers[playerIdx]?.isAI) {
      const tactic = nextPlayers[playerIdx].tactic;
      let quoteType: keyof NPCProfile['quotes'];
      if (combo.type === 'FOUR_KIND' || combo.type === 'STRAIGHT_FLUSH' || combo.type === 'DRAGON') {
        quoteType = 'ALL_IN';
      } else if (tactic === 'AGGRESSIVE') {
        quoteType = cards.length >= 5 ? 'RAISE' : 'CALL';
      } else if (tactic === 'CONSERVATIVE') {
        quoteType = cards.length >= 5 ? 'CALL' : 'CHECK';
      } else if (tactic === 'DECEPTIVE') {
        quoteType = cards.length <= 2 ? 'CHECK' : 'RAISE';
      } else {
        quoteType = cards.length >= 5 ? 'RAISE' : 'CALL';
      }
      setNpcQuote(nextPlayers[playerIdx].name, quoteType);
    }
    setPlayedCards(prev => [...prev, ...cards]);
    playSound('card-place');
    setMessage('');

    if (!payoutSettled && wasFirstFinish && nextPlayers[playerIdx].hand.length === 0) {
      settlePayout(playerIdx, cards, nextPlayers);
    }

    const ended = resolveEndIfNeeded(nextPlayers, updatedFinished);
    if (!ended) {
      advanceTurn(nextPlayers, playerIdx);
    }

    return true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    finishedOrder,
    mustIncludeThreeClubs,
    currentTrick,
    players,
    payoutSettled,
    setNpcQuote,
    settlePayout,
    resolveEndIfNeeded,
    advanceTurn
  ]);

  const handlePass = useCallback(() => {
    if (phase !== 'PLAYING') return;
    if (!currentTrick) {
      setMessage('你是首家，不能 Pass');
      return;
    }

    const nextPlayers = players.map((p, idx) =>
      idx === currentTurnIndex ? { ...p, passed: true } : p
    );
    const leaderIdx = currentTrick.playerIndex;
    const activePlayers = nextPlayers.filter(p => !p.finished);
    const othersPassed = activePlayers
      .filter((_, idx) => nextPlayers.findIndex(pl => pl.id === activePlayers[idx].id) !== leaderIdx)
      .every(p => p.passed);

    if (othersPassed) {
      const resetPlayers = nextPlayers.map(p => ({ ...p, passed: false }));
      setPlayers(resetPlayers);
      setCurrentTrick(null);
      const leadIndex = resetPlayers[leaderIdx]?.finished
        ? getNextActiveIndex(resetPlayers, leaderIdx)
        : leaderIdx;
      setCurrentTurnIndex(leadIndex);
      setMessage('新一輪開始');
      if (resetPlayers[leadIndex]?.isAI) {
        setNpcQuote(resetPlayers[leadIndex].name, 'FOLD');
      }
      return;
    }

    setPlayers(nextPlayers);
    setMessage('');
    if (nextPlayers[currentTurnIndex]?.isAI) {
      setNpcQuote(nextPlayers[currentTurnIndex].name, 'FOLD');
    }
    advanceTurn(nextPlayers, currentTurnIndex);
  }, [
    phase,
    currentTrick,
    players,
    currentTurnIndex,
    setNpcQuote,
    advanceTurn
  ]);

  useEffect(() => {
    if (phase !== 'PLAYING') return;
    const current = players[currentTurnIndex];
    if (!current || !current.isAI || current.finished) return;

    if (aiTimerRef.current) window.clearTimeout(aiTimerRef.current);
    aiTimerRef.current = window.setTimeout(() => {
      const aiPlayers = players.map(p => ({ hand: p.hand, tactic: p.tactic }));
      const humanPlayerIdx = players.findIndex(p => p.id === 'player');
      const play = aiChoosePlay(
        current.hand,
        currentTrick,
        mustIncludeThreeClubs,
        currentTurnIndex,
        aiPlayers,
        playedCards,
        nightmareMode,
        humanPlayerIdx,
        300
      );
      if (play && play.length > 0) {
        const success = applyPlay(currentTurnIndex, play);
        if (!success) handlePass();
      } else {
        handlePass();
      }
    }, 950);
  }, [
    phase,
    players,
    currentTurnIndex,
    currentTrick,
    mustIncludeThreeClubs,
    playedCards,
    applyPlay,
    handlePass,
    nightmareMode
  ]);

  return {
    players,
    currentTurnIndex,
    currentTrick,
    finishedOrder,
    mustIncludeThreeClubs,
    phase,
    message,
    setMessage,
    playedCards,
    payoutSummary,
    payoutSettled,
    roundStats,
    initializeGame,
    applyPlay,
    handlePass
  };
};
