import { Cell, CellState, CellType } from '@/types/game';

// Initialize an empty game board
export const initializeBoard = (): Cell[] => {
  return Array(25).fill(null).map(() => ({
    type: CellType.EMPTY,
    state: CellState.HIDDEN
  }));
};

// Calculate number of traps per player based on player count
export const calculateTrapsPerPlayer = (playerCount: number): number => {
  // X = floor(25 / (2 × number of players))
  return Math.floor(25 / (2 * playerCount));
};

// Check if game is over
export const isGameOver = (board: Cell[], activePlayers: number): boolean => {
  // Game is over if treasure is found
  const treasureFound = board.some(
    cell => cell.type === CellType.TREASURE && cell.state === CellState.REVEALED
  );
  
  // Game is over if only one player remains
  const onlyOnePlayerLeft = activePlayers === 1;
  
  // Game is over if all cells are revealed
  const allCellsRevealed = board.every(cell => cell.state === CellState.REVEALED);
  
  return treasureFound || onlyOnePlayerLeft || allCellsRevealed;
};

// Format coins with appropriate suffix
export const formatCoins = (coins: number): string => {
  if (coins >= 1000000) {
    return `${(coins / 1000000).toFixed(1)}M`;
  } else if (coins >= 1000) {
    return `${(coins / 1000).toFixed(1)}K`;
  } else {
    return coins.toString();
  }
};

// Auto-place traps randomly
export const autoPlaceTraps = (
  board: Cell[],
  trapsPerPlayer: number
): number[] => {
  const availableCells = Array.from({ length: 25 }, (_, i) => i);
  const traps: number[] = [];
  
  for (let i = 0; i < trapsPerPlayer; i++) {
    if (availableCells.length === 0) break;
    
    const randomIndex = Math.floor(Math.random() * availableCells.length);
    const cellIndex = availableCells[randomIndex];
    
    traps.push(cellIndex);
    availableCells.splice(randomIndex, 1);
  }
  
  return traps;
};
