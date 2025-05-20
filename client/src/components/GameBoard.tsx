import { useContext } from 'react';
import { GameContext } from '@/contexts/GameContext';
import { cn } from '@/lib/utils';
import { CellType, CellState, RevealedCell } from '@/types/game';
import { QuestionMarkIcon, TreasureIcon, TrapIcon, EmptyIcon } from '@/assets/icons';

interface GameBoardProps {
  onCellClick: (index: number) => void;
  showTraps?: boolean;
  placedTraps?: Set<number>;
  onTrapToggle?: (index: number) => void;
  revealedCells?: RevealedCell[];
  board?: any[];
}

const GameBoard = ({ 
  onCellClick, 
  showTraps = false, 
  placedTraps = new Set(), 
  onTrapToggle,
  revealedCells = []
}: GameBoardProps) => {
  const { state } = useContext(GameContext);
  const { board, gamePhase } = state;

  // Determine if we're in trap placement phase or gameplay phase
  const isTrapPlacement = gamePhase === 'trapPlacement';
  const isGameplay = gamePhase === 'gameplay';

  // Check if a cell is revealed through revealedCells (for gameplay phase)
  const isRevealed = (index: number) => {
    if (board[index].state === CellState.REVEALED) return true;
    return revealedCells.some(cell => cell.cellIndex === index);
  };

  // Get cell type from revealedCells or board
  const getCellType = (index: number) => {
    const revealedCell = revealedCells.find(cell => cell.cellIndex === index);
    if (revealedCell) return revealedCell.cellType;
    return board[index].type;
  };

  // Render cell content based on cell state and phase
  const renderCellContent = (index: number) => {
    // For trap placement phase
    if (isTrapPlacement && onTrapToggle) {
      return (
        <div className="game-board-cell-content">
          <TrapIcon className={cn(
            "w-6 h-6 text-red-500 transition-opacity duration-200",
            placedTraps.has(index) ? "opacity-100" : "opacity-0"
          )} />
        </div>
      );
    }

    // For gameplay phase
    if (isGameplay) {
      // Use the revealed status from either the board state or revealedCells
      if (!isRevealed(index)) {
        return (
          <div className="game-board-cell-content">
            <QuestionMarkIcon className="text-2xl" />
          </div>
        );
      } else {
        // Show the revealed content
        const cellType = getCellType(index);
        
        if (cellType === CellType.TREASURE) {
          return (
            <div className="game-board-cell-content">
              <TreasureIcon className="text-2xl text-[hsl(var(--gold))]" />
            </div>
          );
        } else if (cellType === CellType.TRAP) {
          return (
            <div className="game-board-cell-content">
              <TrapIcon className="text-2xl text-[hsl(var(--red))]" />
            </div>
          );
        } else {
          return (
            <div className="game-board-cell-content">
              <EmptyIcon className="text-2xl text-[hsl(var(--light))]" />
            </div>
          );
        }
      }
    }

    // Default (shouldn't reach here)
    return (
      <div className="game-board-cell-content">
        <QuestionMarkIcon className="text-2xl" />
      </div>
    );
  };

  return (
    <div className={cn(
      "game-grid mb-4",
      isTrapPlacement ? "trap-placement-grid" : ""
    )}>
      <div className="grid grid-cols-5 gap-2 bg-[hsla(var(--medium)/0.3)] p-2 rounded-lg">
        {Array(25).fill(null).map((_, index) => (
          <div 
            key={index}
            className={cn(
              "game-board-cell rounded-md cursor-pointer",
              isTrapPlacement 
                ? placedTraps.has(index)
                  ? "bg-[hsla(var(--medium)/0.7)] hover:bg-[hsl(var(--medium))] trap-selected" 
                  : "bg-[hsla(var(--medium)/0.7)] hover:bg-[hsl(var(--medium))]"
                : isRevealed(index)
                  ? "bg-[hsla(var(--medium)/0.9)]"
                  : "bg-[hsla(var(--medium)/0.7)] hover:bg-[hsla(var(--medium)/0.9)]"
            )}
            onClick={() => isTrapPlacement && onTrapToggle ? onTrapToggle(index) : onCellClick(index)}
          >
            {renderCellContent(index)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GameBoard;
