import { useContext, useState, useEffect, useRef } from 'react';
import { GameContext } from '@/contexts/GameContext';
import GameBoard from '@/components/GameBoard';
import PlayerCard from '@/components/PlayerCard';
import BettingControls from '@/components/BettingControls';
import CellRevealModal from '@/components/CellRevealModal';
import ResultsModal from '@/components/ResultsModal';
import { Button } from '@/components/ui/button';
import { GamePhase, CellType, PlayerStatus, CellState } from '@/types/game';
import { TrapIcon } from '@/assets/icons';

const GamePage = () => {
  const { state, dispatch } = useContext(GameContext);
  const [playerCount, setPlayerCount] = useState(3);
  const [placedTraps, setPlacedTraps] = useState<Set<number>>(new Set());
  const [turnTime, setTurnTime] = useState(30);
  const [isRevealModalOpen, setIsRevealModalOpen] = useState(false);
  const [revealedCellIndex, setRevealedCellIndex] = useState<number | null>(null);
  const [revealedCellType, setRevealedCellType] = useState<CellType | null>(null);
  const [revealingPlayerId, setRevealingPlayerId] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Safely destructure state with defaults to prevent undefined errors
  const gamePhase = state?.gamePhase || GamePhase.SETUP;
  const players = state?.players || [];
  const currentPlayer = state?.currentPlayer || 0;
  const board = state?.board || [];
  const pot = state?.pot || 0;
  const roundNumber = state?.roundNumber || 1;
  const cellSelectionPhase = state?.cellSelectionPhase || false;
  const trapsPerPlayer = state?.trapsPerPlayer || 0;
  const stats = state?.stats || { roundsPlayed: 0, trapsTriggered: 0, cellsRevealed: 0 };
  const winInfo = state?.winInfo;
  const revealedCells = state?.revealedCells || [];
  const handResults = state?.handResults || [];
  const playerTraps = state?.playerTraps || {};
  
  // Handle timer countdown
  useEffect(() => {
    if ((gamePhase === GamePhase.TRAP_PLACEMENT || 
        (gamePhase === GamePhase.GAMEPLAY && !isRevealModalOpen)) && 
        turnTime > 0) {
      timerRef.current = setInterval(() => {
        setTurnTime(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            
            // Auto-actions based on phase
            if (gamePhase === GamePhase.TRAP_PLACEMENT) {
              // Auto-place traps if timer runs out
              handleTimeoutTrapPlacement();
            } else if (gamePhase === GamePhase.GAMEPLAY) {
              if (!cellSelectionPhase) {
                handleFold(); // Auto-fold on timeout
              } else {
                // Auto-select first available cell
                const firstAvailableCell = board.findIndex(cell => cell.state === CellState.HIDDEN);
                if (firstAvailableCell !== -1) {
                  handleCellSelection(firstAvailableCell);
                }
              }
            }
            
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [gamePhase, currentPlayer, cellSelectionPhase, isRevealModalOpen]);
  
  // Reset timer when player changes
  useEffect(() => {
    setTurnTime(30);
  }, [currentPlayer, cellSelectionPhase]);
  
  // Check if time to start gameplay
  useEffect(() => {
    // If all players have placed traps, automatically start the gameplay
    if (gamePhase === GamePhase.TRAP_PLACEMENT && 
        Object.keys(playerTraps).length === players.length) {
      // Start gameplay after a brief pause to let players see the last trap placement
      setTimeout(() => {
        dispatch({ type: 'START_GAMEPLAY' });
      }, 1000);
    }
  }, [playerTraps, players.length, gamePhase, dispatch]);
  
  // When a new cell is revealed, show the modal
  useEffect(() => {
    if (revealedCells && revealedCells.length > 0) {
      try {
        const lastReveal = revealedCells[revealedCells.length - 1];
        
        // Only show the modal if it's a new cell reveal and we're not already showing one
        if (!isRevealModalOpen && lastReveal) {
          setRevealedCellIndex(lastReveal.cellIndex);
          setRevealedCellType(lastReveal.cellType);
          setRevealingPlayerId(lastReveal.playerId);
          setIsRevealModalOpen(true);
          
          // Auto-close the modal after 2 seconds to keep the game flowing
          setTimeout(() => {
            setIsRevealModalOpen(false);
          }, 2000);
        }
      } catch (error) {
        console.error("Error handling revealed cells:", error);
      }
    }
  }, [revealedCells]);
  
  // Handle setup phase actions
  const handlePlayerCountChange = (count: number) => {
    setPlayerCount(count);
  };
  
  const handleStartGame = () => {
    dispatch({ 
      type: 'SETUP_GAME', 
      payload: { playerCount } 
    });
  };
  
  // Handle trap placement
  const handleTrapToggle = (cellIndex: number) => {
    const newPlacedTraps = new Set(placedTraps);
    
    if (placedTraps.has(cellIndex)) {
      newPlacedTraps.delete(cellIndex);
    } else if (placedTraps.size < (trapsPerPlayer || 0)) {
      newPlacedTraps.add(cellIndex);
    }
    
    setPlacedTraps(newPlacedTraps);
  };
  
  const handleConfirmTraps = () => {
    if (trapsPerPlayer && placedTraps.size === trapsPerPlayer) {
      dispatch({
        type: 'PLACE_TRAPS',
        payload: {
          playerId: 0, // Current user is always player 0
          playerTraps: Array.from(placedTraps)
        }
      });
      
      setPlacedTraps(new Set());
    }
  };
  
  const handleTimeoutTrapPlacement = () => {
    // Auto place traps if timer runs out
    if (gamePhase === GamePhase.TRAP_PLACEMENT) {
      dispatch({ type: 'START_GAMEPLAY' });
    }
  };
  
  // Handle betting actions
  const handleCheck = () => {
    dispatch({ type: 'PLAYER_CHECK' });
  };
  
  const handleRaise = (amount: number) => {
    dispatch({
      type: 'PLAYER_RAISE',
      payload: { amount }
    });
  };
  
  const handleFold = () => {
    dispatch({ type: 'PLAYER_FOLD' });
  };
  
  // Handle cell selection
  const handleCellSelection = (cellIndex: number) => {
    if (gamePhase === GamePhase.GAMEPLAY && 
        cellSelectionPhase && 
        board[cellIndex] && 
        board[cellIndex].state === CellState.HIDDEN) {
      
      // We now track the cell reveal in the context
      dispatch({
        type: 'SELECT_CELL',
        payload: { cellIndex }
      });
      
      // Close any open reveal modal when selecting a new cell
      setIsRevealModalOpen(false);
    }
  };
  
  // Handle game restart
  const handlePlayAgain = () => {
    dispatch({ type: 'START_NEW_ROUND' });
    setPlacedTraps(new Set());
  };
  
  const handleExitGame = () => {
    dispatch({ type: 'RESTART_GAME' });
    setPlacedTraps(new Set());
  };
  
  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Find a player by ID
  const findPlayer = (id: number) => {
    return players && players.length > 0 ? players.find(p => p.id === id) : undefined;
  };
  
  return (
    <div className="container mx-auto px-4 py-6 max-w-xl min-h-screen">
      {/* Header */}
      <header className="text-center mb-6">
        <h1 className="font-display text-4xl text-[hsl(var(--gold))] mb-2">Treasure Trap</h1>
        <p className="text-sm text-[hsla(var(--light)/0.8)]">A multiplayer wagering game of strategy and luck</p>
        
        {/* Phase Indicator */}
        <div className="flex justify-center items-center mt-4 space-x-1 flex-wrap">
          <div className="bg-[hsl(var(--gold))] text-[hsl(var(--dark))] px-4 py-1 rounded-lg font-medium text-sm m-1">
            {gamePhase === GamePhase.SETUP && 'Game Setup'}
            {gamePhase === GamePhase.TRAP_PLACEMENT && 'Trap Placement Phase'}
            {gamePhase === GamePhase.GAMEPLAY && 'Gameplay Phase'}
            {gamePhase === GamePhase.RESULTS && 'Game Results'}
          </div>
          
          {players.length > 0 && gamePhase !== GamePhase.RESULTS && gamePhase !== GamePhase.TRAP_PLACEMENT && (
            <div className="bg-[hsla(var(--secondary)/0.9)] px-4 py-1 rounded-lg font-medium text-sm m-1">
              {players[currentPlayer]?.name}'s Turn
            </div>
          )}
          
          {gamePhase === GamePhase.GAMEPLAY && (
            <div className="bg-[hsla(var(--gold)/0.9)] text-[hsl(var(--dark))] px-4 py-1 rounded-lg font-medium text-sm m-1">
              {cellSelectionPhase ? 'Cell Selection' : 'Betting Round'}
            </div>
          )}
        </div>
      </header>

      {/* Game Phase Content */}
      <div>
        {/* Setup Phase */}
        {gamePhase === GamePhase.SETUP && (
          <div className="mb-6">
            <div className="bg-[hsla(var(--medium)/0.5)] rounded-lg p-4 mb-4">
              <h2 className="font-display text-xl mb-2">Game Setup</h2>
              <div className="mb-4">
                <label className="block text-sm mb-1">Number of Players:</label>
                <div className="flex space-x-2">
                  <Button
                    className={`px-4 py-2 rounded-md transition ${
                      playerCount === 2 
                        ? 'bg-[hsl(var(--gold))] text-[hsl(var(--dark))]' 
                        : 'bg-[hsl(var(--medium))] hover:bg-[hsla(var(--medium)/0.8)]'
                    }`}
                    onClick={() => handlePlayerCountChange(2)}
                  >
                    2
                  </Button>
                  <Button
                    className={`px-4 py-2 rounded-md transition ${
                      playerCount === 3 
                        ? 'bg-[hsl(var(--gold))] text-[hsl(var(--dark))]' 
                        : 'bg-[hsl(var(--medium))] hover:bg-[hsla(var(--medium)/0.8)]'
                    }`}
                    onClick={() => handlePlayerCountChange(3)}
                  >
                    3
                  </Button>
                  <Button
                    className={`px-4 py-2 rounded-md transition ${
                      playerCount === 4 
                        ? 'bg-[hsl(var(--gold))] text-[hsl(var(--dark))]' 
                        : 'bg-[hsl(var(--medium))] hover:bg-[hsla(var(--medium)/0.8)]'
                    }`}
                    onClick={() => handlePlayerCountChange(4)}
                  >
                    4
                  </Button>
                </div>
              </div>
              <Button 
                className="bg-[hsl(var(--secondary))] hover:bg-[hsla(var(--secondary)/0.9)] text-white py-3 px-6 rounded-md w-full font-medium transition"
                onClick={handleStartGame}
              >
                Start Game
              </Button>
            </div>
          </div>
        )}

        {/* Trap Placement Phase - Parallel for all players */}
        {gamePhase === GamePhase.TRAP_PLACEMENT && (
          <div className="mb-6">
            <div className="bg-[hsla(var(--medium)/0.5)] rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-3">
                <h2 className="font-display text-xl">Place Your Traps</h2>
                <div className="flex items-center bg-[hsla(var(--warning)/0.2)] text-[hsl(var(--warning))] px-3 py-1 rounded-full">
                  <span className="mdi mdi-timer-outline mr-1"></span>
                  <span id="trapTimer">{formatTime(turnTime)}</span>
                </div>
              </div>
              <p className="text-sm mb-3">
                Choose {trapsPerPlayer} cells to place your traps. Other players are placing their traps simultaneously.
              </p>
              
              {/* Trap Placement Instructions */}
              <div className="bg-[hsla(var(--medium)/0.7)] p-3 rounded-md mb-4 text-sm">
                <p>Selected: <span className="font-medium">{placedTraps.size}</span>/{trapsPerPlayer} traps</p>
              </div>
            </div>

            {/* Shared 5x5 Grid for Trap Placement */}
            <GameBoard 
              onCellClick={() => {}}
              showTraps={true}
              placedTraps={placedTraps}
              onTrapToggle={handleTrapToggle}
            />

            <Button 
              className={`py-3 px-6 rounded-md w-full font-medium transition mb-4 ${
                placedTraps.size === trapsPerPlayer
                  ? 'bg-[hsl(var(--gold))] text-[hsl(var(--dark))] hover:bg-[hsla(var(--gold)/0.9)]'
                  : 'bg-[hsla(var(--medium)/0.7)] text-[hsla(var(--light)/0.7)] cursor-not-allowed'
              }`}
              disabled={placedTraps.size !== trapsPerPlayer}
              onClick={handleConfirmTraps}
            >
              {placedTraps.size === trapsPerPlayer ? 'Place Traps' : `Select ${trapsPerPlayer - placedTraps.size} More Trap${trapsPerPlayer - placedTraps.size !== 1 ? 's' : ''}`}
            </Button>
            
            {/* Player trap placement status */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {players.map(player => (
                <div 
                  key={player.id} 
                  className={`bg-[hsla(var(--medium)/0.5)] p-2 rounded-md flex items-center justify-between ${
                    playerTraps[player.id] ? 'border border-[hsl(var(--success))]' : ''
                  }`}
                >
                  <span>{player.name}</span>
                  {playerTraps[player.id] ? (
                    <span className="text-[hsl(var(--success))]">Ready ✓</span>
                  ) : (
                    <span className="text-[hsl(var(--warning))]">Placing traps...</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Gameplay Phase */}
        {gamePhase === GamePhase.GAMEPLAY && (
          <div>
            {/* Game Info Bar */}
            <div className="bg-[hsla(var(--medium)/0.5)] rounded-lg p-3 mb-4 flex justify-between items-center">
              <div>
                <span className="text-xs uppercase tracking-wide opacity-70">Current Pot</span>
                <div className="font-display text-xl text-[hsl(var(--gold))]">
                  <span className="mdi mdi-coin mr-1"></span>
                  <span>{pot}</span> coins
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs uppercase tracking-wide opacity-70">Round</span>
                <div className="font-medium text-lg">{roundNumber}</div>
              </div>
            </div>

            {/* Game Board Grid - Now shows revealed cells */}
            <GameBoard 
              onCellClick={handleCellSelection} 
              revealedCells={revealedCells}
              board={board}
            />

            {/* Player Cards */}
            <div className="player-cards mb-6">
              <h3 className="font-display text-lg mb-2">Players</h3>
              <div className="grid grid-cols-2 gap-3">
                {players.map((player, index) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    isActive={index === currentPlayer}
                    index={index}
                  />
                ))}
              </div>
            </div>

            {/* Betting Controls or Cell Selection Info */}
            {!cellSelectionPhase ? (
              <BettingControls
                onCheck={handleCheck}
                onRaise={handleRaise}
                onFold={handleFold}
                timeRemaining={turnTime}
                isCall={players[currentPlayer]?.currentBet < state.highestBet}
              />
            ) : (
              <div className="mb-4 bg-[hsla(var(--medium)/0.5)] rounded-lg p-4">
                <h3 className="font-display text-lg mb-2">Select a Cell</h3>
                <p className="text-sm mb-3">Choose a cell from the grid above. Be careful to avoid traps!</p>
                
                {/* Timer */}
                <div className="flex justify-between items-center">
                  <span className="text-sm opacity-80">Time remaining:</span>
                  <div className="flex items-center bg-[hsla(var(--warning)/0.2)] text-[hsl(var(--warning))] px-3 py-1 rounded-full">
                    <span className="mdi mdi-timer-outline mr-1"></span>
                    <span>{formatTime(turnTime)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cell Reveal Modal - Updated to use revealed cell data */}
      <CellRevealModal
        isOpen={isRevealModalOpen}
        onClose={() => setIsRevealModalOpen(false)}
        cellType={revealedCellType}
        playerId={revealingPlayerId}
        playerName={findPlayer(revealingPlayerId)?.name || ''}
      />

      {/* Results Modal - Now with hand results */}
      {gamePhase === GamePhase.RESULTS && winInfo && (
        <ResultsModal
          isOpen={true}
          stats={stats}
          winnerName={winInfo.winnerId >= 0 ? players[winInfo.winnerId]?.name : 'All remaining players'}
          winAmount={winInfo.winAmount}
          winType={winInfo.winType}
          handResults={handResults}
          players={players}
          onPlayAgain={handlePlayAgain}
          onExit={handleExitGame}
        />
      )}
    </div>
  );
};

export default GamePage;
