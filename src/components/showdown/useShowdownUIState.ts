import { useEffect, useRef, useState } from 'react';
import { ActionType, GamePhase, NPCProfile, Player } from '../../types';

interface UseShowdownUIStateParams {
  phase: GamePhase;
  players: Player[];
  currentPlayer?: Player;
  currentMaxBet: number;
  minBet: number;
  winners: string[];
  betMode: 'FIXED_LIMIT' | 'NO_LIMIT';
  npcProfiles: NPCProfile[];
  playerQuotes: string[];
  handleAction: (action: ActionType, amount?: number) => void;
}

const pickRandom = (items: string[]) => items[Math.floor(Math.random() * items.length)];

export const useShowdownUIState = ({
  phase,
  players,
  currentPlayer,
  currentMaxBet,
  minBet,
  winners,
  betMode,
  npcProfiles,
  playerQuotes,
  handleAction
}: UseShowdownUIStateParams) => {
  const [customRaiseAmount, setCustomRaiseAmount] = useState(minBet);
  const [showChatMenu, setShowChatMenu] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [winnerQuotes, setWinnerQuotes] = useState<Record<string, string>>({});
  const lastResultKeyRef = useRef<string | null>(null);

  const user = players.find(p => p.id === 'player');
  const isUserTurn = phase.startsWith('BETTING') && currentPlayer?.id === 'player';
  const userWon = winners.includes('player');
  const winnerPlayers = winners
    .map(id => players.find(p => p.id === id))
    .filter((p): p is Player => Boolean(p));

  const callNeeded = user ? Math.max(0, currentMaxBet - user.currentBet) : 0;
  const betSize = (phase === GamePhase.BETTING_4 || phase === GamePhase.BETTING_5) ? minBet * 2 : minBet;
  const maxRaise = user ? Math.max(0, user.chips - callNeeded) : 0;
  const fixedRaiseAmount = currentMaxBet > 0 && currentMaxBet < betSize ? (betSize - currentMaxBet) : betSize;
  const fixedRaiseTotal = callNeeded + fixedRaiseAmount;
  const fixedCanRaise = !!user && fixedRaiseAmount > 0 && user.chips >= fixedRaiseTotal;
  const noLimitRaiseAmount = Math.min(customRaiseAmount, maxRaise);
  const noLimitRaiseTotal = callNeeded + noLimitRaiseAmount;
  const noLimitCanRaise = !!user && maxRaise >= minBet && noLimitRaiseAmount >= minBet;
  const raiseAmount = betMode === 'NO_LIMIT' ? noLimitRaiseAmount : fixedRaiseAmount;
  const raiseTotal = betMode === 'NO_LIMIT' ? noLimitRaiseTotal : fixedRaiseTotal;
  const canRaise = betMode === 'NO_LIMIT' ? noLimitCanRaise : fixedCanRaise;

  useEffect(() => {
    if (betMode !== 'NO_LIMIT') return;
    if (!phase.startsWith('BETTING')) return;
     
    setCustomRaiseAmount(minBet);
  }, [phase, betMode, minBet]);

  useEffect(() => {
    if (betMode !== 'NO_LIMIT') return;
    if (maxRaise < minBet) return;
    if (customRaiseAmount > maxRaise) {
       
      setCustomRaiseAmount(maxRaise);
    } else if (customRaiseAmount < minBet) {
      setCustomRaiseAmount(minBet);
    }
  }, [betMode, maxRaise, customRaiseAmount, minBet]);

  useEffect(() => {
    if (!isUserTurn) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return;
      const key = e.key.toLowerCase();
      if (key === 'f') {
        e.preventDefault();
        handleAction('FOLD');
      } else if (key === 'c') {
        e.preventDefault();
        handleAction(callNeeded === 0 ? 'CHECK' : 'CALL');
      } else if (key === 'r') {
        if (!canRaise) return;
        e.preventDefault();
        handleAction('RAISE', raiseAmount);
      } else if (key === 'a') {
        e.preventDefault();
        handleAction('ALL_IN');
      } else if (key === 't') {
        e.preventDefault();
        setShowChatMenu(prev => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isUserTurn, callNeeded, canRaise, raiseAmount, handleAction]);

  useEffect(() => {
    if (phase !== GamePhase.RESULT) return;
    const signature = `${phase}-${winners.join('|')}-${players.map(p => `${p.id}:${p.cards.length}:${p.chips}`).join('|')}`;
    if (signature === lastResultKeyRef.current) return;
    lastResultKeyRef.current = signature;

    const quotes: Record<string, string> = {};
    winners.forEach(id => {
      const p = players.find(pl => pl.id === id);
      if (!p) return;
      if (p.id === 'player') {
        quotes[id] = pickRandom(playerQuotes);
        return;
      }
      const profile = npcProfiles.find(npc => npc.name === p.name);
      const winQuotes = profile?.quotes?.WIN ?? [];
      if (winQuotes.length > 0) {
        quotes[id] = pickRandom(winQuotes);
      } else if (p.currentQuote) {
        quotes[id] = p.currentQuote;
      }
    });
     
    setWinnerQuotes(quotes);
  }, [phase, winners, players, npcProfiles, playerQuotes]);

  return {
    user,
    isUserTurn,
    userWon,
    winnerPlayers,
    winnerQuotes,
    callNeeded,
    canRaise,
    raiseAmount,
    raiseTotal,
    maxRaise,
    customRaiseAmount,
    setCustomRaiseAmount,
    showChatMenu,
    setShowChatMenu,
    chatInput,
    setChatInput
  };
};
