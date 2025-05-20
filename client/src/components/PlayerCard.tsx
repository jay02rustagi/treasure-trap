import { cn } from '@/lib/utils';
import { Player } from '@/types/game';

interface PlayerCardProps {
  player: Player;
  isActive: boolean;
  index: number;
}

const PlayerCard = ({ player, isActive, index }: PlayerCardProps) => {
  return (
    <div 
      className={cn(
        "player-card rounded-lg bg-[hsla(var(--medium)/0.6)] p-3 relative",
        isActive && "active border-2 border-[hsl(var(--gold))]"
      )}
      data-player-index={index}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium">{player.name}</div>
        <div className="flex items-center text-[hsl(var(--gold))]">
          <span className="mdi mdi-coin mr-1 text-sm"></span>
          <span>{player.coins}</span>
        </div>
      </div>
      
      <div className="text-xs">
        <span className="opacity-70">Status: </span>
        <span className={cn(
          "font-medium",
          player.status === 'Active' && "text-[hsl(var(--success))]",
          player.status === 'Folded' && "text-[hsl(var(--muted-foreground))]",
          player.status === 'Eliminated' && "text-[hsl(var(--danger))]"
        )}>
          {player.status}
        </span>
      </div>
      
      {/* Current Bet */}
      <div className="absolute bottom-2 right-2 text-xs bg-[hsla(var(--dark)/0.7)] rounded px-2 py-1">
        Bet: {player.currentBet}
      </div>
      
      {/* Active Player Indicator */}
      {isActive && (
        <div className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-[hsl(var(--gold))] flex items-center justify-center">
          <span className="mdi mdi-chevron-right text-[hsl(var(--dark))]"></span>
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
