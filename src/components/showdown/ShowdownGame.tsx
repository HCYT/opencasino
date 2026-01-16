import React from 'react';
import { ActionType, GamePhase, NPCProfile, Player } from '../../types';
import CardUI from '../CardUI';
import ShowdownControls from './ShowdownControls';
import ShowdownSeat from './ShowdownSeat';
import ShowdownTable from './ShowdownTable';
import { useShowdownUIState } from './useShowdownUIState';

interface ShowdownGameProps {
  phase: GamePhase;
  players: Player[];
  pot: number;
  currentPlayer?: Player;
  currentMaxBet: number;
  minBet: number;
  winners: string[];
  betMode: 'FIXED_LIMIT' | 'NO_LIMIT';
  npcProfiles: NPCProfile[];
  playerQuotes: string[];
  handleAction: (action: ActionType, amount?: number) => void;
  startNewHand: () => void;
  playerSpeak: (text: string) => void;
}

const ShowdownGame: React.FC<ShowdownGameProps> = ({
  phase,
  players,
  pot,
  currentPlayer,
  currentMaxBet,
  minBet,
  winners,
  betMode,
  npcProfiles,
  playerQuotes,
  handleAction,
  startNewHand,
  playerSpeak
}) => {
  const {
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
  } = useShowdownUIState({
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
  });
  const statusText = phase === GamePhase.SHOWDOWN
    ? '最後對決'
    : phase === GamePhase.RESULT
      ? '本局結束'
      : `${currentPlayer?.name || ''} 思考中...`;

  return (
    <div className="game-container bg-[#052c16] relative overflow-visible select-none h-screen w-full">
      <ShowdownTable statusText={statusText} pot={pot}>
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

          const seatPosition = p.id === 'player'
            ? 'bottom'
            : i === 1
              ? 'left'
              : i === 2
                ? 'top'
                : 'right';

          return (
            <div key={p.id} className="absolute flex flex-col items-center" style={style}>
              <ShowdownSeat
                player={p}
                isActive={currentPlayer?.id === p.id}
                isWinner={winners.includes(p.id)}
                phase={phase}
                vertical={vertical}
                isMe={p.id === 'player'}
                seatPosition={seatPosition}
              />
            </div>
          );
        })}
      </ShowdownTable>

      <ShowdownControls
        phase={phase}
        minBet={minBet}
        user={user}
        isUserTurn={isUserTurn}
        callNeeded={callNeeded}
        canRaise={canRaise}
        raiseAmount={raiseAmount}
        raiseTotal={raiseTotal}
        maxRaise={maxRaise}
        betMode={betMode}
        customRaiseAmount={customRaiseAmount}
        setCustomRaiseAmount={setCustomRaiseAmount}
        showChatMenu={showChatMenu}
        setShowChatMenu={setShowChatMenu}
        chatInput={chatInput}
        setChatInput={setChatInput}
        playerSpeak={playerSpeak}
        onAction={handleAction}
        onStartNewHand={startNewHand}
      />

      {phase === GamePhase.RESULT && winners.length > 0 && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[6px] flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center animate-in fade-in zoom-in duration-700">
            <h2 className="text-[7rem] md:text-[10rem] font-black text-yellow-500 drop-shadow-[0_0_60px_rgba(0,0,0,1)] casino-font mb-4 italic tracking-tight text-shadow">慈善撲克王大賽</h2>
            <div className={`text-4xl md:text-5xl font-black mb-6 ${userWon ? 'text-emerald-400' : 'text-red-400'}`}>
              {userWon ? '你贏了' : '你輸了'}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6">
              {winnerPlayers.map(player => (
                <div key={player.id} className="bg-black/60 border border-yellow-400/20 rounded-[2.5rem] px-8 py-6 shadow-2xl max-w-[380px]">
                  <img
                    src={player.avatar}
                    alt={player.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-yellow-400/40 shadow-[0_0_30px_rgba(234,179,8,0.35)] mx-auto"
                  />
                  <div className="text-white text-3xl font-black mt-4 tracking-tight">{player.name}</div>
                  {winnerQuotes[player.id] && (
                    <div className="mt-3 text-amber-200 text-sm font-black bg-black/40 px-4 py-3 rounded-2xl border border-white/10">
                      「{winnerQuotes[player.id]}」
                    </div>
                  )}
                  {player.cards.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap justify-center gap-2">
                        {player.cards.map((card, idx) => (
                          <CardUI key={`${player.id}-win-${idx}`} card={card} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 text-white/60 text-sm font-bold uppercase tracking-widest">本局贏家</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShowdownGame;
