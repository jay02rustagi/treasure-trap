import { createContext, useEffect, useReducer, ReactNode } from 'react';
import { 
  GameState, 
  GameAction, 
  Player, 
  CellType, 
  CellState,
  GamePhase,
  PlayerStatus
} from '@/types/game';
import { initializeBoard, calculateTrapsPerPlayer, autoPlaceTraps } from '@/utils/gameUtils';

// Initial game state
const initialState: GameState = {
  gamePhase: GamePhase.SETUP,
  players: [],
  currentPlayer: 0,
  board: initializeBoard(),
  highestBet: 0,
  pot: 0,
  roundNumber: 1,
  cellSelectionPhase: false,
  playerTraps: {} as Record<number, number[]>,
  trapPlacementComplete: false,
  revealedCells: [],
  handResults: [],
  stats: {
    roundsPlayed: 0,
    trapsTriggered: 0,
    cellsRevealed: 0
  }
};

// Load game state from localStorage if available
const loadGameState = (): GameState => {
  const savedState = localStorage.getItem('treasureTrapGameState');
  if (savedState) {
    try {
      return JSON.parse(savedState);
    } catch (e) {
      console.error('Failed to parse saved game state:', e);
    }
  }
  return initialState;
};

// Game reducer
const gameReducer = (state: GameState, action: GameAction): GameState => {
  let newState: GameState;

  switch (action.type) {
    case 'SETUP_GAME':
      const { playerCount: numPlayers } = action.payload;
      const players: Player[] = [];
      
      // Create players with starting coins
      for (let i = 0; i < numPlayers; i++) {
        // Check if player exists in localStorage
        const storedCoins = localStorage.getItem(`player_${i}_coins`);
        const coins = storedCoins ? parseInt(storedCoins) : 500; // Default 500 coins
        
        players.push({
          id: i,
          name: `Player ${i + 1}`,
          coins: coins - 10, // Deduct buy-in
          status: PlayerStatus.ACTIVE,
          currentBet: 0
        });
      }
      
      // Initialize board
      const freshBoard = initializeBoard();
      
      newState = {
        ...initialState,
        gamePhase: GamePhase.TRAP_PLACEMENT,
        players,
        board: freshBoard,
        pot: numPlayers * 10, // Buy-in amount to pot
        trapsPerPlayer: calculateTrapsPerPlayer(numPlayers),
        playerTraps: {} as Record<number, number[]>,
        trapPlacementComplete: false,
        revealedCells: [],
        handResults: []
      };
      break;
      
    case 'PLACE_TRAPS':
      // Place traps for the current player in parallel mode
      const { playerId, playerTraps } = action.payload;
      
      // Store player's trap selection
      const updatedPlayerTraps = {
        ...state.playerTraps,
        [playerId]: playerTraps
      };
      
      // Check if all players have placed their traps
      const allTrapsPlaced = Object.keys(updatedPlayerTraps).length === state.players.length;
      
      if (allTrapsPlaced) {
        // Combine all players' traps into a single board
        const newBoard = [...state.board];
        
        // Apply all players' traps to the board
        Object.values(updatedPlayerTraps).forEach(trapArray => {
          if (Array.isArray(trapArray)) {
            trapArray.forEach(cellIndex => {
              if (newBoard[cellIndex] && newBoard[cellIndex].type !== CellType.TRAP) {
                newBoard[cellIndex].type = CellType.TRAP;
              }
            });
          }
        });
        
        // Find cells without traps
        const availableCells = newBoard
          .map((cell, index) => ({ index, type: cell.type }))
          .filter(cell => cell.type !== CellType.TRAP);
        
        // Randomly place treasure in one of the available cells
        if (availableCells.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableCells.length);
          const treasureCellIndex = availableCells[randomIndex].index;
          newBoard[treasureCellIndex].type = CellType.TREASURE;
        }
        
        // Move to gameplay phase
        newState = {
          ...state,
          board: newBoard,
          gamePhase: GamePhase.GAMEPLAY,
          currentPlayer: 0, // Reset to first player
          playerTraps: updatedPlayerTraps,
          trapPlacementComplete: true
        };
      } else {
        // Just update the playerTraps object
        newState = {
          ...state,
          playerTraps: updatedPlayerTraps
        };
      }
      break;
      
    case 'START_GAMEPLAY':
      // Transition to gameplay phase after all traps are placed
      if (state.trapPlacementComplete) {
        newState = {
          ...state,
          gamePhase: GamePhase.GAMEPLAY
        };
      } else {
        // First combine all existing traps
        const combinedBoard = [...state.board];

        // Apply all existing player traps
        Object.entries(state.playerTraps).forEach(([_, trapArray]) => {
          if (Array.isArray(trapArray)) {
            trapArray.forEach(cellIndex => {
              if (combinedBoard[cellIndex] && combinedBoard[cellIndex].type !== CellType.TRAP) {
                combinedBoard[cellIndex].type = CellType.TRAP;
              }
            });
          }
        });

        // Auto-place traps for players who haven't placed them
        const remainingPlayers = state.players
          .filter(player => !state.playerTraps[player.id])
          .map(player => player.id);

        const autoPlayerTraps = { ...state.playerTraps };
        
        remainingPlayers.forEach(playerId => {
          if (state.trapsPerPlayer) {
            const autoPlacements = autoPlaceTraps(combinedBoard, state.trapsPerPlayer);
            autoPlayerTraps[playerId] = autoPlacements;
            
            // Also update the board with these traps
            autoPlacements.forEach(cellIndex => {
              if (combinedBoard[cellIndex] && combinedBoard[cellIndex].type !== CellType.TRAP) {
                combinedBoard[cellIndex].type = CellType.TRAP;
              }
            });
          }
        });

        // Find cells without traps for treasure
        const availableCells = combinedBoard
          .map((cell, index) => ({ index, type: cell.type }))
          .filter(cell => cell.type !== CellType.TRAP);
        
        // Randomly place treasure in one of the available cells
        if (availableCells.length > 0) {
          const randomIndex = Math.floor(Math.random() * availableCells.length);
          const treasureCellIndex = availableCells[randomIndex].index;
          combinedBoard[treasureCellIndex].type = CellType.TREASURE;
        }

        newState = {
          ...state,
          board: combinedBoard,
          gamePhase: GamePhase.GAMEPLAY,
          currentPlayer: 0,
          playerTraps: autoPlayerTraps,
          trapPlacementComplete: true
        };
      }
      break;

    case 'PLAYER_CHECK':
      // If highest bet matches current bet, do nothing (true check)
      // If highest bet > current bet, match the bet (call)
      const player = state.players[state.currentPlayer];
      const betDifference = state.highestBet - player.currentBet;
      
      if (betDifference > 0) {
        // This is actually a "call"
        const updatedPlayers = [...state.players];
        
        // Deduct the bet difference from player's coins
        updatedPlayers[state.currentPlayer] = {
          ...player,
          coins: player.coins - betDifference,
          currentBet: state.highestBet
        };
        
        newState = {
          ...state,
          players: updatedPlayers,
          pot: state.pot + betDifference,
          cellSelectionPhase: true // Move to cell selection phase
        };
      } else {
        // Just a check, move to cell selection
        newState = {
          ...state,
          cellSelectionPhase: true
        };
      }
      
      console.log(`Player ${state.currentPlayer} checked/called, moving to cell selection phase`);
      break;
      
    case 'PLAYER_RAISE':
      const { amount } = action.payload;
      const raisingPlayer = state.players[state.currentPlayer];
      const updatedPlayers = [...state.players];
      
      // Update player's bet and coins
      updatedPlayers[state.currentPlayer] = {
        ...raisingPlayer,
        coins: raisingPlayer.coins - amount,
        currentBet: raisingPlayer.currentBet + amount
      };
      
      newState = {
        ...state,
        players: updatedPlayers,
        highestBet: Math.max(state.highestBet, raisingPlayer.currentBet + amount),
        pot: state.pot + amount,
        cellSelectionPhase: true // Move to cell selection
      };
      break;
      
    case 'PLAYER_FOLD':
      const foldingPlayer = state.players[state.currentPlayer];
      const playersAfterFold = [...state.players];
      
      // Mark player as folded
      playersAfterFold[state.currentPlayer] = {
        ...foldingPlayer,
        status: PlayerStatus.FOLDED
      };
      
      // Check if only one player remains active
      const activePlayers = playersAfterFold.filter(p => p.status === PlayerStatus.ACTIVE);
      
      if (activePlayers.length === 1) {
        // Last player standing wins the pot
        const winner = activePlayers[0];
        const updatedPlayersEndGame = playersAfterFold.map(p => 
          p.id === winner.id 
            ? { ...p, coins: p.coins + state.pot }
            : p
        );
        
        // Save winner's coins to localStorage
        localStorage.setItem(`player_${winner.id}_coins`, (winner.coins + state.pot).toString());
        
        // Create hand results
        const handResults = state.players.map(p => ({
          playerId: p.id,
          result: p.id === winner.id ? 'win' as const : 'lose' as const,
          reason: 'lastStanding' as const
        }));
        
        newState = {
          ...state,
          players: updatedPlayersEndGame,
          gamePhase: GamePhase.RESULTS,
          pot: 0,
          stats: {
            ...state.stats,
            roundsPlayed: state.roundNumber
          },
          winInfo: {
            winnerId: winner.id,
            winType: 'lastStanding',
            winAmount: state.pot
          },
          handResults
        };
      } else {
        // Find next active player
        let nextPlayer = (state.currentPlayer + 1) % state.players.length;
        while (playersAfterFold[nextPlayer].status !== PlayerStatus.ACTIVE) {
          nextPlayer = (nextPlayer + 1) % state.players.length;
        }
        
        newState = {
          ...state,
          players: playersAfterFold,
          currentPlayer: nextPlayer,
          cellSelectionPhase: false // Next player's turn
        };
      }
      break;
      
    case 'SELECT_CELL':
      const { cellIndex } = action.payload;
      const selectingPlayer = state.players[state.currentPlayer];
      const updatedBoard = [...state.board];
      const selectedCell = updatedBoard[cellIndex];
      
      // Reveal the cell
      selectedCell.state = CellState.REVEALED;
      
      // Track revealed cells for all players to see
      const updatedRevealedCells = [...state.revealedCells, {
        cellIndex,
        playerId: selectingPlayer.id,
        cellType: selectedCell.type
      }];
      
      let updatedStats = {
        ...state.stats,
        cellsRevealed: state.stats.cellsRevealed + 1
      };
      
      let updatedPlayersAfterSelection = [...state.players];
      
      // Calculate the next player more carefully
      let nextPlayerIndex = (state.currentPlayer + 1) % state.players.length;
      
      // Make sure we find an active player for the next turn
      let safetyCounter = 0;
      const totalPlayers = state.players.length;
      
      while (updatedPlayersAfterSelection[nextPlayerIndex].status !== PlayerStatus.ACTIVE && safetyCounter < totalPlayers) {
        nextPlayerIndex = (nextPlayerIndex + 1) % totalPlayers;
        safetyCounter++;
      }
      
      // Handle cell selection result
      if (selectedCell.type === CellType.TRAP) {
        // Player hit a trap
        updatedPlayersAfterSelection[state.currentPlayer] = {
          ...selectingPlayer,
          status: PlayerStatus.ELIMINATED
        };
        
        updatedStats.trapsTriggered++;
        
        // Find next active player after elimination
        let nextActiveIndex = (state.currentPlayer + 1) % state.players.length;
        while (nextActiveIndex !== state.currentPlayer && 
               updatedPlayersAfterSelection[nextActiveIndex].status !== PlayerStatus.ACTIVE) {
          nextActiveIndex = (nextActiveIndex + 1) % state.players.length;
        }
        
        // Check if only one player remains active
        const remainingActivePlayers = updatedPlayersAfterSelection.filter(
          p => p.status === PlayerStatus.ACTIVE
        );
        
        if (remainingActivePlayers.length === 1) {
          // Last player standing wins the pot
          const winner = remainingActivePlayers[0];
          updatedPlayersAfterSelection = updatedPlayersAfterSelection.map(p => 
            p.id === winner.id 
              ? { ...p, coins: p.coins + state.pot }
              : p
          );
          
          // Save winner's coins to localStorage
          localStorage.setItem(`player_${winner.id}_coins`, (winner.coins + state.pot).toString());
          
          // Create hand results
          const handResults = state.players.map(p => ({
            playerId: p.id,
            result: p.id === winner.id ? 'win' as const : 'lose' as const,
            reason: p.id === selectingPlayer.id ? 'hitTrap' as const : 
                   (p.status === PlayerStatus.ACTIVE ? 'lastStanding' as const : 'eliminated' as const)
          }));
          
          newState = {
            ...state,
            board: updatedBoard,
            players: updatedPlayersAfterSelection,
            gamePhase: GamePhase.RESULTS,
            pot: 0,
            stats: {
              ...updatedStats,
              roundsPlayed: state.roundNumber
            },
            winInfo: {
              winnerId: winner.id,
              winType: 'lastStanding',
              winAmount: state.pot
            },
            revealedCells: updatedRevealedCells,
            handResults
          };
          break;
        }
        
        // Find next active player
        while (
          updatedPlayersAfterSelection[nextPlayerIndex].status !== PlayerStatus.ACTIVE
        ) {
          nextPlayerIndex = (nextPlayerIndex + 1) % state.players.length;
        }
      } else if (selectedCell.type === CellType.TREASURE) {
        // Player found the treasure and wins the pot
        updatedPlayersAfterSelection[state.currentPlayer] = {
          ...selectingPlayer,
          coins: selectingPlayer.coins + state.pot
        };
        
        // Save winner's coins to localStorage
        localStorage.setItem(
          `player_${selectingPlayer.id}_coins`, 
          (selectingPlayer.coins + state.pot).toString()
        );
        
        // Create hand results
        const handResults = state.players.map(p => ({
          playerId: p.id,
          result: p.id === selectingPlayer.id ? 'win' as const : 'lose' as const,
          reason: p.id === selectingPlayer.id ? 'foundTreasure' as const : 'otherFoundTreasure' as const
        }));
        
        newState = {
          ...state,
          board: updatedBoard,
          players: updatedPlayersAfterSelection,
          gamePhase: GamePhase.RESULTS,
          pot: 0,
          stats: {
            ...updatedStats,
            roundsPlayed: state.roundNumber
          },
          winInfo: {
            winnerId: selectingPlayer.id,
            winType: 'treasure',
            winAmount: state.pot
          },
          revealedCells: updatedRevealedCells,
          handResults
        };
        break;
      } else {
        // Empty cell, continue to next player
        let activePlayerFound = false;
        let attemptCount = 0;
        
        // Safely find the next active player
        while (!activePlayerFound && attemptCount < updatedPlayersAfterSelection.length) {
          if (updatedPlayersAfterSelection[nextPlayerIndex].status === PlayerStatus.ACTIVE) {
            activePlayerFound = true;
          } else {
            nextPlayerIndex = (nextPlayerIndex + 1) % updatedPlayersAfterSelection.length;
            attemptCount++;
          }
        }
        
        // If no active player found, do nothing (this should not happen in normal gameplay)
        if (!activePlayerFound) {
          console.warn("No active players found to continue the game!");
        }
      }
      
      // For empty cells, finalize state and move to next player
      if (selectedCell.type === CellType.EMPTY) {
        newState = {
          ...state,
          board: updatedBoard,
          revealedCells: updatedRevealedCells,
          stats: updatedStats,
          currentPlayer: nextPlayerIndex,
          cellSelectionPhase: false // Reset to betting phase for next player
        };
        console.log(`Moving to next player: ${nextPlayerIndex}`);
        break;
      }

      // Check if all cells have been revealed
      const allCellsRevealed = updatedBoard.every(cell => cell.state === CellState.REVEALED);
      if (allCellsRevealed) {
        // Split pot among remaining active players
        const activePlayers = updatedPlayersAfterSelection.filter(
          p => p.status === PlayerStatus.ACTIVE
        );
        
        const splitAmount = Math.floor(state.pot / activePlayers.length);
        
        updatedPlayersAfterSelection = updatedPlayersAfterSelection.map(p => 
          p.status === PlayerStatus.ACTIVE
            ? { ...p, coins: p.coins + splitAmount }
            : p
        );
        
        // Save players' coins to localStorage
        activePlayers.forEach(player => {
          localStorage.setItem(
            `player_${player.id}_coins`, 
            (player.coins + splitAmount).toString()
          );
        });
        
        // Create hand results
        const handResults = state.players.map(p => ({
          playerId: p.id,
          result: p.status === PlayerStatus.ACTIVE ? 'win' as const : 'lose' as const,
          reason: p.status === PlayerStatus.ACTIVE ? 'boardExhausted' as const : 
                 (p.status === PlayerStatus.FOLDED ? 'folded' as const : 'eliminated' as const)
        }));
        
        newState = {
          ...state,
          board: updatedBoard,
          players: updatedPlayersAfterSelection,
          gamePhase: GamePhase.RESULTS,
          pot: 0,
          stats: {
            ...updatedStats,
            roundsPlayed: state.roundNumber
          },
          winInfo: {
            winnerId: -1, // No single winner
            winType: 'boardExhausted',
            winAmount: state.pot
          },
          revealedCells: updatedRevealedCells,
          handResults
        };
      } else {
        // Continue to next player
        newState = {
          ...state,
          board: updatedBoard,
          players: updatedPlayersAfterSelection,
          currentPlayer: nextPlayerIndex,
          cellSelectionPhase: false,
          stats: updatedStats,
          revealedCells: updatedRevealedCells
        };
      }
      break;
      
    case 'START_NEW_ROUND':
      // Reset the board, keep player coins, increment round
      newState = {
        ...initialState,
        players: state.players.map(p => ({
          ...p,
          currentBet: 0,
          status: PlayerStatus.ACTIVE
        })),
        gamePhase: GamePhase.TRAP_PLACEMENT,
        currentPlayer: 0,
        board: initializeBoard(),
        roundNumber: state.roundNumber + 1,
        pot: 0,
        stats: {
          ...state.stats,
          roundsPlayed: state.roundNumber
        },
        trapsPerPlayer: calculateTrapsPerPlayer(state.players.length),
        playerTraps: {},
        trapPlacementComplete: false,
        revealedCells: []
      };
      break;
      
    case 'RESTART_GAME':
      // Complete game restart
      newState = initialState;
      
      // Clear localStorage (just the game state, not player coins)
      localStorage.removeItem('treasureTrapGameState');
      break;
      
    default:
      newState = state;
  }
  
  // Save game state to localStorage
  localStorage.setItem('treasureTrapGameState', JSON.stringify(newState));
  
  return newState;
};

// Create context
export const GameContext = createContext<{
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

// Provider component
export const GameProvider = ({ children }: { children: ReactNode }) => {
  // Use initialState directly to ensure we always have a valid state
  const [state, dispatch] = useReducer(gameReducer, initialState);
  
  useEffect(() => {
    // Save game state to localStorage when it changes
    localStorage.setItem('treasureTrapGameState', JSON.stringify(state));
  }, [state]);
  
  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
};
