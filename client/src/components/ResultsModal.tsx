import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { GameStats, PlayerHandResult, Player } from '@/types/game';
import { TreasureIcon, TrapIcon, EmptyIcon } from '@/assets/icons';
import { cn } from '@/lib/utils';

interface ResultsModalProps {
  isOpen: boolean;
  stats: GameStats;
  winnerName: string;
  winAmount: number;
  winType: 'treasure' | 'lastStanding' | 'boardExhausted';
  handResults?: PlayerHandResult[];
  players?: Player[];
  onPlayAgain: () => void;
  onExit: () => void;
}

const ResultsModal = ({ 
  isOpen, 
  stats, 
  winnerName, 
  winAmount, 
  winType,
  handResults = [],
  players = [],
  onPlayAgain, 
  onExit 
}: ResultsModalProps) => {
  // Get title and description based on win type
  const getContent = () => {
    switch (winType) {
      case 'treasure':
        return {
          title: 'Treasure Found!',
          description: `${winnerName} found the treasure and won ${winAmount} coins!`,
          icon: <TreasureIcon className="text-6xl text-[hsl(var(--gold))]" />
        };
      case 'lastStanding':
        return {
          title: 'Last Player Standing!',
          description: `${winnerName} is the last player remaining and won ${winAmount} coins!`,
          icon: <TreasureIcon className="text-6xl text-[hsl(var(--gold))]" />
        };
      case 'boardExhausted':
        return {
          title: 'Board Exhausted!',
          description: `The pot of ${winAmount} coins was split among the remaining players!`,
          icon: <EmptyIcon className="text-6xl text-[hsl(var(--light))]" />
        };
      default:
        return {
          title: 'Game Over!',
          description: `${winnerName} won ${winAmount} coins!`,
          icon: <TreasureIcon className="text-6xl text-[hsl(var(--gold))]" />
        };
    }
  };

  const content = getContent();

  // Get player name from playerId
  const getPlayerName = (playerId: number) => {
    const player = players.find(p => p.id === playerId);
    return player ? player.name : `Player ${playerId + 1}`;
  };

  // Display reason in human-readable format
  const getReasonText = (reason: string, playerName: string) => {
    switch (reason) {
      case 'hitTrap':
        return `${playerName} hit a trap and was eliminated`;
      case 'foundTreasure':
        return `${playerName} found the treasure and won the pot`;
      case 'otherFoundTreasure':
        return `Another player found the treasure`;
      case 'lastStanding':
        return `${playerName} was the last player standing`;
      case 'eliminated':
        return `${playerName} was eliminated`;
      case 'folded':
        return `${playerName} folded their hand`;
      case 'boardExhausted':
        return `The board was fully revealed`;
      default:
        return reason;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="bg-[hsl(var(--medium))] max-w-sm w-full rounded-lg p-5 mx-4 border-none">
        <div className="text-center">
          <div className="result-icon mb-3">
            {content.icon}
          </div>
          
          <h2 className="font-display text-2xl mb-2">{content.title}</h2>
          <p className="mb-4">{content.description}</p>
          
          {/* Hand Results */}
          {handResults && handResults.length > 0 && (
            <div className="bg-[hsla(var(--dark)/0.5)] rounded-md p-3 mb-4 text-left">
              <h3 className="font-medium mb-2 text-center">Round Results</h3>
              <div className="space-y-2">
                {handResults.map((result, index) => {
                  const playerName = getPlayerName(result.playerId);
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "flex justify-between items-center p-2 rounded",
                        result.result === 'win' 
                          ? "bg-[hsla(var(--success)/0.2)] border border-[hsla(var(--success)/0.3)]" 
                          : "bg-[hsla(var(--danger)/0.2)] border border-[hsla(var(--danger)/0.3)]"
                      )}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{playerName}</div>
                        <div className="text-xs opacity-80">{getReasonText(result.reason, playerName)}</div>
                      </div>
                      <div 
                        className={cn(
                          "px-2 py-1 rounded text-xs font-medium",
                          result.result === 'win' 
                            ? "bg-[hsl(var(--success))] text-white" 
                            : "bg-[hsl(var(--danger))] text-white"
                        )}
                      >
                        {result.result === 'win' ? 'WIN' : 'LOSE'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Stats */}
          <div className="bg-[hsla(var(--dark)/0.5)] rounded-md p-3 mb-4 text-left">
            <h3 className="font-medium mb-2 text-center">Game Stats</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Rounds played:</div>
              <div className="text-right font-medium">{stats.roundsPlayed}</div>
              <div>Traps triggered:</div>
              <div className="text-right font-medium">{stats.trapsTriggered}</div>
              <div>Cells revealed:</div>
              <div className="text-right font-medium">{stats.cellsRevealed}/25</div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button 
              variant="outline"
              className="bg-[hsla(var(--medium)/0.8)] hover:bg-[hsl(var(--medium))] flex-1 py-2 rounded-md transition text-sm"
              onClick={onExit}
            >
              Exit Game
            </Button>
            <Button 
              variant="default"
              className="bg-[hsl(var(--gold))] text-[hsl(var(--dark))] hover:bg-[hsla(var(--gold)/0.9)] flex-1 py-2 rounded-md transition font-medium text-sm"
              onClick={onPlayAgain}
            >
              Play Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ResultsModal;
