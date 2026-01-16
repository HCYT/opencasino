import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../../types';
import { NPCProfile } from '../../types';
import { decideNpcBet, findNextPlayable, updateQuotes } from './engine';
import {
  buildShoe,
  DEFAULT_SHOE_DECKS,
  getCardValue,
  getHandValue,
  getSplitStatus,
  isBlackjack,
  rollCutCardOwner,
  shouldHit,
  shouldSplit
} from './rules';
import {
  BlackjackHand,
  BlackjackPhase,
  BlackjackPlayer,
  BlackjackResult,
  BlackjackSeat,
  CutRatioRange,
  TurnRef
} from './types';

interface UseBlackjackEngineParams {
  seats: BlackjackSeat[];
  minBet: number;
  shoeDecks: number;
  cutRatioRange: CutRatioRange;
  npcProfiles: NPCProfile[];
  resolveChips: (name: string) => number;
  onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: BlackjackResult }>) => void;
}

export const useBlackjackEngine = ({
  seats,
  minBet,
  shoeDecks,
  cutRatioRange,
  npcProfiles,
  resolveChips,
  onProfilesUpdate
}: UseBlackjackEngineParams) => {
  const [players, setPlayers] = useState<BlackjackPlayer[]>(() =>
    seats.map(seat => ({
      ...seat,
      hands: [],
      quote: undefined,
      overallResult: undefined,
      roundStartChips: undefined
    }))
  );
  const [playerBet, setPlayerBet] = useState(minBet);
  const [deck, setDeck] = useState<Card[]>([]);
  const [cutCardRemaining, setCutCardRemaining] = useState(0);
  const cutCardRemainingRef = useRef(cutCardRemaining);
  const [shufflePending, setShufflePending] = useState(false);
  const [cutCardOwner, setCutCardOwner] = useState('');
  const [cutCardRolls, setCutCardRolls] = useState<Record<string, number>>({});
  const [cutRollPending, setCutRollPending] = useState(true);
  const [dealerCards, setDealerCards] = useState<Card[]>([]);
  const [phase, setPhase] = useState<BlackjackPhase>('BETTING');
  const [currentTurn, setCurrentTurn] = useState<TurnRef | null>(null);
  const [message, setMessage] = useState('');
  const npcTimerRef = useRef<number | null>(null);
  const decisionKeyRef = useRef<string | null>(null);

  const playerIndex = players.findIndex(p => !p.isAI);
  const player = players[playerIndex];
  const dealerVisible = dealerCards.filter(card => card.isFaceUp);
  const dealerValue = useMemo(() => getHandValue(dealerVisible), [dealerVisible]);
  const dealerUpCard = dealerVisible[0];
  const dealerUpValue = dealerUpCard ? getCardValue(dealerUpCard.rank) : 10;

  const activePlayer = currentTurn ? players[currentTurn.playerIndex] : undefined;
  const activeHand = currentTurn && activePlayer ? activePlayer.hands[currentTurn.handIndex] : undefined;
  const isPlayerTurn = phase === 'PLAYING' && currentTurn?.playerIndex === playerIndex;

  useEffect(() => {
    if (playerBet > (player?.chips ?? 0)) setPlayerBet(player?.chips ?? 0);
    if (playerBet < minBet) setPlayerBet(minBet);
  }, [playerBet, player?.chips, minBet]);

  useEffect(() => () => {
    if (npcTimerRef.current) window.clearTimeout(npcTimerRef.current);
  }, []);

  useEffect(() => {
    cutCardRemainingRef.current = cutCardRemaining;
  }, [cutCardRemaining]);

  const drawCard = (sourceDeck: Card[], faceUp: boolean) => {
    const next = sourceDeck.pop();
    if (!next) return null;
    if (sourceDeck.length <= cutCardRemainingRef.current) {
      setShufflePending(true);
    }
    return { ...next, isFaceUp: faceUp };
  };

  const rollCutCard = () => {
    const names = players.map(p => p.name);
    const cutInfo = rollCutCardOwner(names);
    const decks = shoeDecks > 0 ? shoeDecks : DEFAULT_SHOE_DECKS;
    const ratioMin = Math.max(0.05, Math.min(cutRatioRange.min, cutRatioRange.max));
    const ratioMax = Math.max(ratioMin, cutRatioRange.max);
    const newShoe = buildShoe(decks, { min: ratioMin, max: ratioMax });
    setDeck(newShoe.deck);
    setCutCardRemaining(newShoe.cutRemaining);
    cutCardRemainingRef.current = newShoe.cutRemaining;
    setCutCardOwner(cutInfo.owner);
    setCutCardRolls(cutInfo.rolls);
    setShufflePending(false);
    setCutRollPending(false);
    setMessage(`擲骰完成：${cutInfo.owner} 插牌`);
  };

  const applyQuotes = (updatedPlayers: BlackjackPlayer[]) => updateQuotes(updatedPlayers, npcProfiles);

  const settleRound = (updatedPlayers: BlackjackPlayer[], updatedDealer: Card[], nextMessage: string) => {
    const withResults = updatedPlayers.map(p => {
      const betPlaced = p.hands.some(hand => hand.bet > 0);
      if (!betPlaced) return { ...p, overallResult: undefined };
      const startChips = p.roundStartChips ?? p.chips;
      const delta = p.chips - startChips;
      const hasBlackjack = p.hands.some(hand => hand.result === 'BLACKJACK');
      const overall: BlackjackResult = delta > 0 ? (hasBlackjack ? 'BLACKJACK' : 'WIN') : delta < 0 ? 'LOSE' : 'PUSH';
      return { ...p, overallResult: overall };
    });

    const resultUpdates = withResults
      .filter(p => p.hands.some(hand => hand.bet > 0) && p.overallResult)
      .map(p => ({ name: p.name, chips: p.chips, result: p.overallResult as BlackjackResult }));

    setPlayers(applyQuotes(withResults));
    setDealerCards(updatedDealer);
    setMessage(nextMessage);
    setPhase('RESULT');
    setCurrentTurn(null);
    onProfilesUpdate(resultUpdates);
  };

  const evaluateRound = (currentPlayers: BlackjackPlayer[], currentDealer: Card[]) => {
    const dealerTotal = getHandValue(currentDealer).total;
    const dealerBlackjack = currentDealer.length === 2 && dealerTotal === 21;

    const updatedPlayers = currentPlayers.map(p => {
      let nextChips = p.chips;
      const updatedHands = p.hands.map(hand => {
        if (hand.bet <= 0) return hand;
        if (hand.status === 'BUST') {
          return { ...hand, result: 'LOSE' as BlackjackResult };
        }
        const total = getHandValue(hand.cards).total;
        const isNatural = hand.status === 'BLACKJACK' && !hand.isSplitHand;

        if (dealerBlackjack) {
          if (isNatural) {
            nextChips += hand.bet;
            return { ...hand, result: 'PUSH' as BlackjackResult };
          }
          return { ...hand, result: 'LOSE' as BlackjackResult };
        }

        if (dealerTotal > 21) {
          if (isNatural) {
            nextChips += Math.floor(hand.bet * 2.5);
            return { ...hand, result: 'BLACKJACK' as BlackjackResult };
          }
          nextChips += hand.bet * 2;
          return { ...hand, result: 'WIN' as BlackjackResult };
        }

        if (isNatural) {
          nextChips += Math.floor(hand.bet * 2.5);
          return { ...hand, result: 'BLACKJACK' as BlackjackResult };
        }

        if (total > dealerTotal) {
          nextChips += hand.bet * 2;
          return { ...hand, result: 'WIN' as BlackjackResult };
        }
        if (total < dealerTotal) {
          return { ...hand, result: 'LOSE' as BlackjackResult };
        }
        nextChips += hand.bet;
        return { ...hand, result: 'PUSH' as BlackjackResult };
      });

      return { ...p, hands: updatedHands, chips: nextChips };
    });

    settleRound(updatedPlayers, currentDealer, '本局結算完成');
  };

  const finishDealerTurn = (currentPlayers: BlackjackPlayer[], deckOverride?: Card[]) => {
    const nextDeck = [...(deckOverride ?? deck)];
    let nextDealer = dealerCards.map(card => ({ ...card, isFaceUp: true }));

    while (getHandValue(nextDealer).total < 17) {
      const card = drawCard(nextDeck, true);
      if (!card) break;
      nextDealer = [...nextDealer, card];
    }

    setDeck(nextDeck);
    evaluateRound(currentPlayers, nextDealer);
  };

  const advanceTurn = (nextPlayers: BlackjackPlayer[], from?: TurnRef | null, deckOverride?: Card[]) => {
    const nextTurn = findNextPlayable(nextPlayers, from ?? currentTurn ?? null);
    if (!nextTurn) {
      setPhase('DEALER');
      finishDealerTurn(nextPlayers, deckOverride);
      return;
    }
    setCurrentTurn(nextTurn);
  };

  const startHand = () => {
    if (!player || player.chips < minBet) {
      setMessage('餘額不足，無法下注');
      return;
    }

    if (cutRollPending) {
      setMessage('請先擲骰決定插牌者');
      return;
    }

    const activeSeats = players.filter(p => p.chips >= minBet);
    const minCardsNeeded = activeSeats.length * 4 + 6;
    const nextDeck = [...deck];

    if (shufflePending || nextDeck.length < minCardsNeeded) {
      setCutRollPending(true);
      setMessage('切牌已到，請擲骰重設牌靴');
      return;
    }
    const initialPlayers = players.map(p => {
      const bet = p.isAI ? decideNpcBet(p.chips, minBet) : Math.min(Math.max(playerBet, minBet), p.chips);
      const canJoin = p.chips >= minBet;
      const cards: Card[] = [];
      if (canJoin) {
        const first = drawCard(nextDeck, true);
        const second = drawCard(nextDeck, true);
        if (first && second) cards.push(first, second);
      }
      const blackjack = cards.length === 2 && isBlackjack(cards);
      const hands: BlackjackHand[] = canJoin
        ? [{
            id: `${p.id}-hand-1`,
            cards,
            bet,
            status: blackjack ? 'BLACKJACK' : 'PLAYING',
            isSplitHand: false
          }]
        : [];

      return {
        ...p,
        chips: canJoin ? p.chips - bet : p.chips,
        hands,
        quote: undefined,
        overallResult: undefined,
        roundStartChips: p.chips
      };
    });

    const dealerFirst = drawCard(nextDeck, false);
    const dealerSecond = drawCard(nextDeck, true);
    if (!dealerFirst || !dealerSecond) return;
    const nextDealer = [dealerFirst, dealerSecond];

    setDeck(nextDeck);
    setPlayers(initialPlayers);
    setDealerCards(nextDealer);
    setMessage('');
    decisionKeyRef.current = null;

    const dealerBJ = isBlackjack(nextDealer.map(card => ({ ...card, isFaceUp: true })));
    if (dealerBJ) {
      const revealed = nextDealer.map(card => ({ ...card, isFaceUp: true }));
      const updatedPlayers = initialPlayers.map(p => {
        const updatedHands = p.hands.map(hand => {
          if (hand.status === 'BLACKJACK') {
            return { ...hand, result: 'PUSH' };
          }
          if (hand.bet > 0) {
            return { ...hand, result: 'LOSE' };
          }
          return hand;
        });
        let chips = p.chips;
        if (p.hands.some(hand => hand.status === 'BLACKJACK')) {
          chips += p.hands.reduce((sum, hand) => sum + (hand.status === 'BLACKJACK' ? hand.bet : 0), 0);
        }
        return { ...p, hands: updatedHands, chips };
      });
      settleRound(updatedPlayers, revealed, '莊家 BlackJack');
      return;
    }

    setPhase('PLAYING');
    const firstPlayable = findNextPlayable(initialPlayers, null);
    if (!firstPlayable) {
      setPhase('DEALER');
      finishDealerTurn(initialPlayers, nextDeck);
    } else {
      setCurrentTurn(firstPlayable);
    }
  };

  const hitAt = (turn: TurnRef) => {
    if (phase !== 'PLAYING') return null;
    const nextDeck = [...deck];
    const card = drawCard(nextDeck, true);
    if (!card) return null;
    const nextPlayers = players.map((p, pIdx) => {
      if (pIdx !== turn.playerIndex) return p;
      const nextHands = p.hands.map((hand, hIdx) => {
        if (hIdx !== turn.handIndex) return hand;
        const nextCards = [...hand.cards, card];
        const total = getHandValue(nextCards).total;
        if (total > 21) return { ...hand, cards: nextCards, status: 'BUST', result: 'LOSE' };
        if (total === 21) return { ...hand, cards: nextCards, status: 'STAND' };
        return { ...hand, cards: nextCards };
      });
      return { ...p, hands: nextHands };
    });
    setPlayers(nextPlayers);
    setDeck(nextDeck);

    return { nextPlayers, nextDeck };
  };

  const standAt = (turn: TurnRef) => {
    if (phase !== 'PLAYING') return null;
    const nextPlayers = players.map((p, pIdx) => {
      if (pIdx !== turn.playerIndex) return p;
      const nextHands = p.hands.map((hand, hIdx) =>
        hIdx === turn.handIndex ? { ...hand, status: 'STAND' } : hand
      );
      return { ...p, hands: nextHands };
    });
    setPlayers(nextPlayers);
    return nextPlayers;
  };

  const splitAt = (turn: TurnRef) => {
    if (phase !== 'PLAYING') return null;
    const current = players[turn.playerIndex];
    const hand = current?.hands[turn.handIndex];
    if (!current || !hand) return null;
    if (hand.cards.length !== 2 || hand.cards[0].rank !== hand.cards[1].rank || hand.isSplitHand) return null;
    if (current.chips < hand.bet) return null;

    const nextDeck = [...deck];
    const firstCard = hand.cards[0];
    const secondCard = hand.cards[1];
    const extra1 = drawCard(nextDeck, true);
    const extra2 = drawCard(nextDeck, true);
    if (!extra1 || !extra2) return null;

    const isAceSplit = firstCard.rank === 'A';
    const hand1Cards = [firstCard, extra1];
    const hand2Cards = [secondCard, extra2];
    const status1 = isAceSplit ? getSplitStatus(hand1Cards) : 'PLAYING';
    const status2 = isAceSplit ? getSplitStatus(hand2Cards) : 'PLAYING';

    const hand1: BlackjackHand = {
      id: `${hand.id}-a`,
      cards: hand1Cards,
      bet: hand.bet,
      status: status1,
      result: status1 === 'BUST' ? 'LOSE' : undefined,
      isSplitHand: true
    };
    const hand2: BlackjackHand = {
      id: `${hand.id}-b`,
      cards: hand2Cards,
      bet: hand.bet,
      status: status2,
      result: status2 === 'BUST' ? 'LOSE' : undefined,
      isSplitHand: true
    };

    const updatedHands = [...current.hands];
    updatedHands.splice(turn.handIndex, 1, hand1, hand2);

    const nextPlayers = players.map((p, pIdx) =>
      pIdx === turn.playerIndex
        ? { ...p, chips: p.chips - hand.bet, hands: updatedHands }
        : p
    );

    setPlayers(nextPlayers);
    setDeck(nextDeck);

    if (status1 !== 'PLAYING') {
      advanceTurn(nextPlayers, turn, nextDeck);
    } else {
      setCurrentTurn(turn);
    }

    return nextPlayers;
  };

  const playerHit = () => {
    if (!isPlayerTurn || !currentTurn) return;
    const result = hitAt(currentTurn);
    if (!result) return;
    const hand = result.nextPlayers[currentTurn.playerIndex]?.hands[currentTurn.handIndex];
    if (hand && hand.status !== 'PLAYING') {
      advanceTurn(result.nextPlayers, currentTurn, result.nextDeck);
    }
  };

  const playerStand = () => {
    if (!isPlayerTurn || !currentTurn) return;
    const nextPlayers = standAt(currentTurn);
    if (nextPlayers) advanceTurn(nextPlayers, currentTurn);
  };

  const playerSplit = () => {
    if (!isPlayerTurn || !currentTurn) return;
    splitAt(currentTurn);
  };

  useEffect(() => {
    if (phase !== 'PLAYING' || !currentTurn) return;
    const current = players[currentTurn.playerIndex];
    const currentHand = current?.hands[currentTurn.handIndex];
    if (!current || !currentHand || !current.isAI || currentHand.status !== 'PLAYING') return;
    if (npcTimerRef.current) window.clearTimeout(npcTimerRef.current);

    const splitEligible =
      currentHand.cards.length === 2 &&
      currentHand.cards[0].rank === currentHand.cards[1].rank &&
      !currentHand.isSplitHand &&
      current.chips >= currentHand.bet;

    const decisionKey = `${phase}|${currentTurn.playerIndex}|${currentTurn.handIndex}|${currentHand.cards.length}|${dealerUpValue}|${splitEligible}`;
    if (decisionKeyRef.current === decisionKey) return;
    decisionKeyRef.current = decisionKey;

    npcTimerRef.current = window.setTimeout(async () => {
      if (splitEligible && shouldSplit(currentHand.cards[0].rank, dealerUpValue)) {
        splitAt(currentTurn);
        return;
      }

      const total = getHandValue(currentHand.cards).total;
      const soft = getHandValue(currentHand.cards).soft;
      const hit = shouldHit(total, dealerUpValue, soft);
      if (hit) {
        const result = hitAt(currentTurn);
        if (!result) return;
        const updatedHand = result.nextPlayers[currentTurn.playerIndex]?.hands[currentTurn.handIndex];
        if (updatedHand && updatedHand.status !== 'PLAYING') {
          advanceTurn(result.nextPlayers, currentTurn, result.nextDeck);
        }
        return;
      }
      const nextPlayers = standAt(currentTurn);
      if (nextPlayers) advanceTurn(nextPlayers, currentTurn);
    }, 650);
  }, [phase, players, currentTurn, deck, dealerUpValue, dealerUpCard]);

  const resetToBetting = () => {
    const activeNames = new Set(players.map(p => p.name));
    const available = npcProfiles.filter(npc => !activeNames.has(npc.name) && resolveChips(npc.name) >= minBet);
    let npcIndex = 0;

    const refreshed = players.map(p => {
      if (!p.isAI) {
        return { ...p, hands: [], quote: undefined, overallResult: undefined, roundStartChips: undefined };
      }
      if (p.chips >= minBet) {
        return { ...p, hands: [], quote: undefined, overallResult: undefined, roundStartChips: undefined };
      }
      const nextNpc = available[npcIndex++];
      if (!nextNpc) {
        return { ...p, hands: [], quote: undefined, overallResult: undefined, roundStartChips: undefined };
      }
      return {
        ...p,
        name: nextNpc.name,
        avatar: nextNpc.avatar,
        chips: resolveChips(nextNpc.name),
        hands: [],
        quote: undefined,
        overallResult: undefined,
        roundStartChips: undefined
      };
    });

    setPlayers(refreshed);
    setDealerCards([]);
    setMessage('');
    setPhase('BETTING');
    setCurrentTurn(null);
  };

  const canSplitHand =
    isPlayerTurn &&
    !!activeHand &&
    activeHand.cards.length === 2 &&
    activeHand.cards[0].rank === activeHand.cards[1].rank &&
    !activeHand.isSplitHand &&
    (activePlayer?.chips ?? 0) >= activeHand.bet &&
    activeHand.status === 'PLAYING';

  return {
    players,
    playerBet,
    setPlayerBet,
    deck,
    cutCardRemaining,
    shufflePending,
    cutCardOwner,
    cutCardRolls,
    cutRollPending,
    dealerCards,
    phase,
    currentTurn,
    message,
    playerIndex,
    player,
    dealerValue,
    dealerUpCard,
    dealerUpValue,
    activePlayer,
    activeHand,
    isPlayerTurn,
    canSplitHand,
    rollCutCard,
    startHand,
    playerHit,
    playerStand,
    playerSplit,
    resetToBetting
  };
};
