import React from 'react';
import { getHandValue } from '../services/blackjack/rules';
import BlackjackControls from './blackjack/BlackjackControls';
import BlackjackSeat from './blackjack/BlackjackSeat';
import BlackjackTable from './blackjack/BlackjackTable';
import {
  BlackjackHand,
  BlackjackResult,
  BlackjackSeat as BlackjackSeatType,
  CutRatioRange
} from '../services/blackjack/types';
import { useBlackjackEngine } from '../services/blackjack/useBlackjackEngine';
import { NPCProfile } from '../types';

export type { BlackjackResult, BlackjackSeat } from '../services/blackjack/types';

interface BlackjackGameProps {
  seats: BlackjackSeatType[];
  minBet: number;
  shoeDecks: number;
  cutRatioRange: CutRatioRange;
  npcProfiles: NPCProfile[];
  resolveChips: (name: string) => number;
  onExit: () => void;
  onProfilesUpdate: (updates: Array<{ name: string; chips: number; result: BlackjackResult }>) => void;
}


const BlackjackGame: React.FC<BlackjackGameProps> = ({
  seats,
  minBet,
  shoeDecks,
  cutRatioRange,
  npcProfiles,
  resolveChips,
  onExit,
  onProfilesUpdate
}) => {
  const {
    players,
    playerBet,
    setPlayerBet,
    deck,
    shufflePending,
    cutCardOwner,
    cutCardRolls,
    cutRollPending,
    dealerCards,
    phase,
    currentTurn,
    message,
    player,
    dealerValue,
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
  } = useBlackjackEngine({
    seats,
    minBet,
    shoeDecks,
    cutRatioRange,
    npcProfiles,
    resolveChips,
    onProfilesUpdate
  });
  const canBet = (player?.chips ?? 0) >= minBet;

  const renderHandStatus = (hand: BlackjackHand, isActive: boolean) => {
    if (phase === 'RESULT' && hand.result) {
      if (hand.result === 'BLACKJACK') return 'Blackjack';
      if (hand.result === 'WIN') return '勝';
      if (hand.result === 'LOSE') return '敗';
      if (hand.result === 'PUSH') return '和局';
    }
    if (hand.status === 'BLACKJACK') return 'Blackjack';
    if (hand.status === 'BUST') return '爆牌';
    if (hand.status === 'STAND') return '停牌';
    if (hand.status === 'PLAYING' && isActive) return '行動中';
    if (hand.status === 'PLAYING') return '等待';
    return '等待';
  };

  const dealerTotal = phase === 'PLAYING' ? dealerValue.total : getHandValue(dealerCards).total;
  const statusText = phase === 'RESULT'
    ? '本局結算'
    : phase === 'DEALER'
      ? '莊家補牌中'
      : activePlayer
        ? `${activePlayer.name} 行動中...`
        : '等待發牌';
  const rollSummary = Object.entries(cutCardRolls)
    .map(([name, roll]) => `${name} ${roll}`)
    .join(' / ');

  return (
    <div className="game-container premium-table-bg relative overflow-visible select-none h-screen w-full">
      <BlackjackTable
        statusText={statusText}
        dealerCards={dealerCards}
        dealerTotal={dealerTotal}
        cutRollPending={cutRollPending}
        onRollCutCard={rollCutCard}
        shufflePending={shufflePending}
        deckCount={deck.length}
        cutCardOwner={cutCardOwner}
        rollSummary={rollSummary}
      >
        {players.map((p, i) => (
          <BlackjackSeat
            key={p.id}
            player={p}
            seatIndex={i}
            phase={phase}
            currentTurn={currentTurn}
            renderHandStatus={renderHandStatus}
          />
        ))}
      </BlackjackTable>

      <BlackjackControls
        phase={phase}
        message={message}
        minBet={minBet}
        playerBet={playerBet}
        canBet={canBet}
        setPlayerBet={setPlayerBet}
        onStartHand={startHand}
        onHit={playerHit}
        onStand={playerStand}
        onSplit={playerSplit}
        canSplitHand={canSplitHand}
        isPlayerTurn={isPlayerTurn}
        player={player}
        activeHand={activeHand}
        onReset={resetToBetting}
        onExit={onExit}
      />
    </div>
  );
};

export default BlackjackGame;
