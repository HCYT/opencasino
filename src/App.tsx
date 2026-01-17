import React, { useState } from 'react';
import { GamePhase, UserProfile } from './types';
import { MIN_BET, PLAYER_QUOTES } from './constants';
import { NPC_PROFILES } from './config/npcProfiles';
import { BIG_TWO_BASE_BETS, BLACKJACK_CUT_PRESETS, BACCARAT_MIN_BETS, GameType, BetMode, BlackjackCutPresetKey } from './config/gameConfig';
import { saveProfiles } from './services/profileStore';
import { buildBigTwoSeats, buildBlackjackSeats, buildGateSeats, buildShowdownPlayers, buildBaccaratSeats } from './services/lobby/gameStarters';
import { pickNpcTriplet } from './services/lobby/npcPicker';
import { useGameEngine } from './services/showdown/useShowdownEngine';
import { ShowdownRules } from './services/showdown/ShowdownRules';
import BlackjackGame, { BlackjackResult, BlackjackSeat } from './components/BlackjackGame';
import BigTwoGame, { BigTwoResult, BigTwoSeat } from './components/BigTwoGame';
import ShowdownGame from './components/showdown/ShowdownGame';
import ShowdownGateGame from './components/showdownGate/ShowdownGateGame';
import { GateSeat, GateResult } from './services/showdownGate/types';
import SlotMachineGame from './components/slots/SlotMachineGame';
import BaccaratGame from './components/baccarat/BaccaratGame';
import { BaccaratSeat } from './services/baccarat/types';
import { GameButton } from './components/ui/GameButton';
import VolumeControl from './components/ui/VolumeControl';
import Lobby from './components/lobby/Lobby';

const App: React.FC = () => {
  const [profiles, setProfiles] = useState<Record<string, UserProfile>>({});
  const [blackjackActive, setBlackjackActive] = useState(false);
  const [blackjackSessionKey, setBlackjackSessionKey] = useState(0);
  const [blackjackSeats, setBlackjackSeats] = useState<BlackjackSeat[]>([]);
  const [blackjackDecks, setBlackjackDecks] = useState(6);
  const [blackjackCutPreset, setBlackjackCutPreset] = useState<BlackjackCutPresetKey>('STANDARD');
  const [bigTwoActive, setBigTwoActive] = useState(false);
  const [bigTwoSessionKey, setBigTwoSessionKey] = useState(0);
  const [bigTwoSeats, setBigTwoSeats] = useState<BigTwoSeat[]>([]);
  const [bigTwoBaseBet, setBigTwoBaseBet] = useState(BIG_TWO_BASE_BETS[0]);
  const [gateActive, setGateActive] = useState(false);
  const [gateSessionKey, setGateSessionKey] = useState(0);
  const [gateSeats, setGateSeats] = useState<GateSeat[]>([]);
  const [gateAnteBet, setGateAnteBet] = useState(MIN_BET);
  const [slotsActive, setSlotsActive] = useState(false);
  const [slotsSessionKey, setSlotsSessionKey] = useState(0);
  const [baccaratActive, setBaccaratActive] = useState(false);
  const [baccaratSessionKey, setBaccaratSessionKey] = useState(0);
  const [baccaratSeats, setBaccaratSeats] = useState<BaccaratSeat[]>([]);
  const [baccaratMinBet] = useState(BACCARAT_MIN_BETS[1]);
  const [currentActivePlayer, setCurrentActivePlayer] = useState('');
  const playerAvatar = 'https://picsum.photos/seed/me/200/200';

  const { gameState, initGame, handleAction, startNewHand, playerSpeak, returnToLobby } = useGameEngine(new ShowdownRules(), {
    npcProfiles: NPC_PROFILES
  });
  const { phase, players, pot, currentMaxBet, activePlayerIndex, winners } = gameState;
  const currentPlayer = players[activePlayerIndex];
  const user = players.find(p => p.id === 'player');
  const isUserAlive = !!user;

  const handleGameStart = (config: {
    gameType: GameType;
    playerName: string;
    playerChips: number;
    initialChips: number;
    profiles: Record<string, any>;
    betMode: BetMode;
    teamingEnabled: boolean;
    bigTwoBaseBet: number;
    gateAnteBet: number;
    blackjackDecks: number;
    blackjackCutPreset: BlackjackCutPresetKey;
  }) => {
    const {
      gameType,
      playerName,
      playerChips,
      initialChips,
      profiles,
      betMode,
      teamingEnabled,
      bigTwoBaseBet: configBigTwoBaseBet,
      gateAnteBet: configGateAnteBet,
      blackjackDecks: configBlackjackDecks,
      blackjackCutPreset: configBlackjackCutPreset
    } = config;

    // Update state with config values
    setBigTwoBaseBet(configBigTwoBaseBet);
    setGateAnteBet(configGateAnteBet);
    setBlackjackDecks(configBlackjackDecks);
    setBlackjackCutPreset(configBlackjackCutPreset);

    const currentUserProfile = profiles[playerName];
    const dynamicAvatar = currentUserProfile?.avatar || playerAvatar;

    // Set the active player for single-player games like Slots
    setCurrentActivePlayer(playerName);

    const startBlackjack = () => {
      const [ai1, ai2, ai3] = pickNpcTriplet(NPC_PROFILES);
      const { seats, updatedProfiles } = buildBlackjackSeats({
        playerName,
        playerChips,
        playerAvatar: dynamicAvatar,
        initialChips,
        profiles,
        aiProfiles: [ai1, ai2, ai3]
      });
      saveProfiles(updatedProfiles);
      setBlackjackSeats(seats);
      setBlackjackSessionKey(prev => prev + 1);
      setBlackjackActive(true);
    };

    const startBigTwo = () => {
      const [ai1, ai2, ai3] = pickNpcTriplet(NPC_PROFILES);
      const { seats, updatedProfiles } = buildBigTwoSeats({
        playerName,
        playerChips,
        playerAvatar: dynamicAvatar,
        initialChips,
        profiles,
        aiProfiles: [ai1, ai2, ai3]
      });
      saveProfiles(updatedProfiles);
      setBigTwoSeats(seats);
      setBigTwoSessionKey(prev => prev + 1);
      setBigTwoActive(true);
    };

    const startGate = () => {
      const [ai1, ai2, ai3] = pickNpcTriplet(NPC_PROFILES);
      const { seats, updatedProfiles } = buildGateSeats({
        playerName,
        playerChips,
        playerAvatar: dynamicAvatar,
        initialChips,
        profiles,
        aiProfiles: [ai1, ai2, ai3]
      });
      saveProfiles(updatedProfiles);
      setGateSeats(seats);
      setGateSessionKey(prev => prev + 1);
      setGateActive(true);
    };

    const startSlots = () => {
      setSlotsSessionKey(prev => prev + 1);
      setSlotsActive(true);
    };

    const startBaccarat = () => {
      const [ai1, ai2, ai3] = pickNpcTriplet(NPC_PROFILES);
      const { seats, updatedProfiles } = buildBaccaratSeats({
        playerName,
        playerChips,
        playerAvatar: dynamicAvatar,
        initialChips,
        profiles,
        aiProfiles: [ai1, ai2, ai3]
      });
      saveProfiles(updatedProfiles);
      setBaccaratSeats(seats);
      setBaccaratSessionKey(prev => prev + 1);
      setBaccaratActive(true);
    };

    if (gameType === 'BLACKJACK') {
      startBlackjack();
      return;
    }

    if (gameType === 'BIG_TWO') {
      startBigTwo();
      return;
    }

    if (gameType === 'GATE') {
      startGate();
      return;
    }

    if (gameType === 'SLOTS') {
      startSlots();
      return;
    }

    if (gameType === 'BACCARAT') {
      startBaccarat();
      return;
    }

    const [ai1, ai2, ai3] = pickNpcTriplet(NPC_PROFILES);
    const initialPlayers = buildShowdownPlayers({
      playerName,
      playerAvatar: dynamicAvatar,
      initialChips,
      profiles,
      aiProfiles: [ai1, ai2, ai3]
    });
    initGame(initialPlayers, teamingEnabled, betMode);
  };

  const handleBlackjackProfileUpdate = (updates: Array<{ name: string; chips: number; result: BlackjackResult }>) => {
    const updated = { ...profiles };
    updates.forEach(payload => {
      const prev = updated[payload.name];
      const wins = prev?.wins ?? 0;
      const losses = prev?.losses ?? 0;
      const games = prev?.games ?? 0;
      const debt = prev?.debt ?? 0;
      const win = payload.result === 'WIN' || payload.result === 'BLACKJACK';
      const loss = payload.result === 'LOSE';
      updated[payload.name] = {
        name: payload.name,
        chips: payload.chips,
        wins: wins + (win ? 1 : 0),
        losses: losses + (loss ? 1 : 0),
        games: games + 1,
        debt
      };
    });
    saveProfiles(updated);
    setProfiles(updated);
  };

  const handleBigTwoProfileUpdate = (updates: Array<{ name: string; chips: number; result: BigTwoResult }>) => {
    const updated = { ...profiles };
    updates.forEach(payload => {
      const prev = updated[payload.name];
      const wins = prev?.wins ?? 0;
      const losses = prev?.losses ?? 0;
      const games = prev?.games ?? 0;
      const debt = prev?.debt ?? 0;
      updated[payload.name] = {
        name: payload.name,
        chips: payload.chips,
        wins: wins + (payload.result === 'WIN' ? 1 : 0),
        losses: losses + (payload.result === 'LOSE' ? 1 : 0),
        games: games + 1,
        debt
      };
    });
    saveProfiles(updated);
    setProfiles(updated);
  };

  const handleGateProfileUpdate = (updates: Array<{ name: string; chips: number; result: GateResult }>) => {
    const updated = { ...profiles };
    updates.forEach(payload => {
      const prev = updated[payload.name];
      const wins = prev?.wins ?? 0;
      const losses = prev?.losses ?? 0;
      const games = prev?.games ?? 0;
      const debt = prev?.debt ?? 0;
      const win = payload.result === 'WIN';
      const loss = payload.result === 'LOSE' || payload.result === 'POST' || payload.result === 'TRIPLE_POST';
      updated[payload.name] = {
        name: payload.name,
        chips: payload.chips,
        wins: wins + (win ? 1 : 0),
        losses: losses + (loss ? 1 : 0),
        games: games + 1,
        debt
      };
    });
    saveProfiles(updated);
    setProfiles(updated);
  };

  const blackjackCutRange = BLACKJACK_CUT_PRESETS.find(preset => preset.key === blackjackCutPreset) ?? BLACKJACK_CUT_PRESETS[1];

  if (bigTwoActive) {
    return (
      <>
        <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
          <VolumeControl />
        </div>
        <BigTwoGame
          key={`big-two-${bigTwoSessionKey}`}
          seats={bigTwoSeats}
          baseBet={bigTwoBaseBet}
          npcProfiles={NPC_PROFILES}
          onExit={() => setBigTwoActive(false)}
          onProfilesUpdate={handleBigTwoProfileUpdate}
          nightmareMode={false}
        />
      </>
    );
  }

  if (blackjackActive) {
    return (
      <>
        <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
          <VolumeControl />
        </div>
        <BlackjackGame
          key={`blackjack-${blackjackSessionKey}`}
          seats={blackjackSeats}
          minBet={MIN_BET}
          shoeDecks={blackjackDecks}
          cutRatioRange={{ min: blackjackCutRange.min, max: blackjackCutRange.max }}
          npcProfiles={NPC_PROFILES}
          resolveChips={(name) => blackjackSeats.find(s => s.name === name)?.chips ?? 0}
          onExit={() => setBlackjackActive(false)}
          onProfilesUpdate={handleBlackjackProfileUpdate}
        />
      </>
    );
  }

  if (gateActive) {
    return (
      <>
        <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
          <VolumeControl />
        </div>
        <ShowdownGateGame
          key={`gate-${gateSessionKey}`}
          seats={gateSeats}
          anteBet={gateAnteBet}
          npcProfiles={NPC_PROFILES}
          resolveChips={(name) => gateSeats.find(s => s.name === name)?.chips ?? 0}
          onExit={() => setGateActive(false)}
          onProfilesUpdate={handleGateProfileUpdate}
        />
      </>
    );
  }

  if (slotsActive) {
    return (
      <>
        <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
          <VolumeControl />
        </div>
        <SlotMachineGame
          key={`slots-${slotsSessionKey}`}
          playerName={currentActivePlayer}
          onExit={() => setSlotsActive(false)}
        />
      </>
    );
  }

  if (baccaratActive) {
    return (
      <>
        <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
          <VolumeControl />
        </div>
        <BaccaratGame
          key={`baccarat-${baccaratSessionKey}`}
          seats={baccaratSeats}
          minBet={baccaratMinBet}
          npcProfiles={NPC_PROFILES}
          onExit={() => setBaccaratActive(false)}
          onProfilesUpdate={(updates) => {
            const updated = { ...profiles };
            updates.forEach(payload => {
              const prev = updated[payload.name];
              const wins = prev?.wins ?? 0;
              const losses = prev?.losses ?? 0;
              const games = prev?.games ?? 0;
              const debt = prev?.debt ?? 0;
              updated[payload.name] = {
                name: payload.name,
                chips: payload.chips,
                wins: wins + (payload.result === 'WIN' ? 1 : 0),
                losses: losses + (payload.result === 'LOSE' ? 1 : 0),
                games: games + 1,
                debt
              };
            });
            saveProfiles(updated);
            setProfiles(updated);
          }}
        />
      </>
    );
  }

  if (phase === GamePhase.SETTING || (!isUserAlive && phase !== GamePhase.RESULT)) {
    if (players.length > 0 && !isUserAlive) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-green-950 text-white p-4">
          <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
            <VolumeControl />
          </div>
          <h1 className="text-5xl text-yellow-500 font-black mb-4">慈善撲克王大賽</h1>
          <div className="text-red-300 font-black mb-8 text-2xl">你已破產</div>
          <GameButton
            onClick={() => window.location.reload()}
            variant="primary"
            size="pillLg"
            className="text-2xl"
          >
            重新載入
          </GameButton>
        </div>
      );
    }

    return <Lobby onGameStart={handleGameStart} />;
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-[100] md:top-6 md:right-6">
        <VolumeControl />
      </div>
      <ShowdownGame
        phase={phase}
        players={players}
        pot={pot}
        currentPlayer={currentPlayer}
        currentMaxBet={currentMaxBet}
        minBet={MIN_BET}
        winners={winners}
        betMode={gameState.betMode || 'FIXED_LIMIT'}
        npcProfiles={NPC_PROFILES}
        playerQuotes={PLAYER_QUOTES}
        handleAction={handleAction}
        startNewHand={startNewHand}
        playerSpeak={playerSpeak}
        onExit={returnToLobby}
      />
    </>
  );
};

export default App;
