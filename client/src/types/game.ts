// Game state enums
export enum GamePhase {
  SETUP = 'setup',
  TRAP_PLACEMENT = 'trapPlacement',
  GAMEPLAY = 'gameplay',
  RESULTS = 'results'
}

export enum CellType {
  EMPTY = 0,
  TRAP = 1,
  TREASURE = 2
}

export enum CellState {
  HIDDEN = 0,
  REVEALED = 1
}

export enum PlayerStatus {
  ACTIVE = 'Active',
  FOLDED = 'Folded',
  ELIMINATED = 'Eliminated'
}

// Result types
export type HandResult = 'win' | 'lose';
export type HandReason = 
  | 'lastStanding' 
  | 'hitTrap' 
  | 'foundTreasure' 
  | 'otherFoundTreasure' 
  | 'eliminated' 
  | 'boardExhausted'
  | 'folded';

// Cell interface
export interface Cell {
  type: CellType;
  state: CellState;
}

// Player interface
export interface Player {
  id: number;
  name: string;
  coins: number;
  status: PlayerStatus;
  currentBet: number;
}

// Revealed cell info for display
export interface RevealedCell {
  cellIndex: number;
  playerId: number;
  cellType: CellType;
}

// Player hand result
export interface PlayerHandResult {
  playerId: number;
  result: HandResult;
  reason: HandReason;
}

// Game statistics
export interface GameStats {
  roundsPlayed: number;
  trapsTriggered: number;
  cellsRevealed: number;
}

// Win information
export interface WinInfo {
  winnerId: number;
  winType: 'treasure' | 'lastStanding' | 'boardExhausted';
  winAmount: number;
}

// Game state interface
export interface GameState {
  gamePhase: GamePhase;
  players: Player[];
  currentPlayer: number;
  board: Cell[];
  highestBet: number;
  pot: number;
  roundNumber: number;
  cellSelectionPhase: boolean;
  trapsPerPlayer?: number;
  // New fields
  playerTraps: Record<number, number[]>;
  trapPlacementComplete: boolean;
  revealedCells: RevealedCell[];
  handResults: PlayerHandResult[];
  stats: GameStats;
  winInfo?: WinInfo;
}

// Game actions
export type GameAction =
  | { type: 'SETUP_GAME'; payload: { playerCount: number } }
  | { type: 'PLACE_TRAPS'; payload: { playerId: number; playerTraps: number[] } }
  | { type: 'START_GAMEPLAY' }
  | { type: 'PLAYER_CHECK' }
  | { type: 'PLAYER_RAISE'; payload: { amount: number } }
  | { type: 'PLAYER_FOLD' }
  | { type: 'SELECT_CELL'; payload: { cellIndex: number } }
  | { type: 'START_NEW_ROUND' }
  | { type: 'RESTART_GAME' };
