import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CellType } from '@/types/game';
import { TreasureIcon, TrapIcon, EmptyIcon } from '@/assets/icons';

interface CellRevealModalProps {
  isOpen: boolean;
  onClose: () => void;
  cellType: CellType | null;
  playerId: number;
  playerName: string;
}

const CellRevealModal = ({ isOpen, onClose, cellType, playerId, playerName }: CellRevealModalProps) => {
  const [revealing, setRevealing] = useState(true);
  
  useEffect(() => {
    if (isOpen) {
      setRevealing(true);
      const timer = setTimeout(() => {
        setRevealing(false);
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Determine content based on cell type
  const getRevealContent = () => {
    if (revealing) {
      return {
        title: "Revealing Cell...",
        description: "Please wait while we reveal the cell's contents.",
        icon: (
          <div className="loading-circle h-16 w-16 border-4 border-[hsla(var(--gold)/0.2)] border-t-[hsl(var(--gold))] rounded-full"></div>
        )
      };
    }
    
    switch (cellType) {
      case CellType.TREASURE:
        return {
          title: "Treasure Found!",
          description: `${playerName} found the treasure and won the pot!`,
          icon: <TreasureIcon className="text-6xl text-[hsl(var(--gold))]" />
        };
      case CellType.TRAP:
        return {
          title: "Trap Triggered!",
          description: `${playerName} hit a trap and was eliminated from this round.`,
          icon: <TrapIcon className="text-6xl text-[hsl(var(--red))]" />
        };
      case CellType.EMPTY:
        return {
          title: "Empty Cell",
          description: `${playerName} found an empty cell and stays in the game.`,
          icon: <EmptyIcon className="text-6xl text-[hsla(var(--light)/0.8)]" />
        };
      default:
        return {
          title: "Error",
          description: "Something went wrong.",
          icon: <EmptyIcon className="text-6xl text-[hsla(var(--light)/0.8)]" />
        };
    }
  };
  
  const content = getRevealContent();
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-[hsl(var(--medium))] max-w-sm w-full rounded-lg p-5 mx-4 border-none">
        <div className="text-center">
          <div className="flex items-center justify-center my-4">
            {content.icon}
          </div>
          
          <h2 className="font-display text-2xl mb-2">{content.title}</h2>
          <p className="mb-4">{content.description}</p>
          
          {!revealing && (
            <Button 
              className="bg-[hsl(var(--gold))] text-[hsl(var(--dark))] hover:bg-[hsla(var(--gold)/0.9)] w-full py-2 rounded-md transition font-medium text-sm"
              onClick={onClose}
            >
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CellRevealModal;
