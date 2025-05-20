import { useState, useContext } from 'react';
import { GameContext } from '@/contexts/GameContext';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface BettingControlsProps {
  onCheck: () => void;
  onRaise: (amount: number) => void;
  onFold: () => void;
  timeRemaining: number;
  isCall?: boolean;
}

const BettingControls = ({ onCheck, onRaise, onFold, timeRemaining, isCall = false }: BettingControlsProps) => {
  const { state } = useContext(GameContext);
  const [showRaiseControls, setShowRaiseControls] = useState(false);
  const [raiseAmount, setRaiseAmount] = useState(1);
  
  const { currentPlayer, players, highestBet } = state;
  const currentPlayerObj = players[currentPlayer];
  
  // Calculate max raise based on player's coins and pot rules
  const maxRaise = Math.min(
    currentPlayerObj.coins,
    Math.max(highestBet * 10, 1) // Ensure minimum of 1
  );

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleRaiseClick = () => {
    setShowRaiseControls(true);
  };

  const handleConfirmRaise = () => {
    onRaise(raiseAmount);
    setShowRaiseControls(false);
    setRaiseAmount(1);
  };

  const handleSliderChange = (value: number[]) => {
    setRaiseAmount(value[0]);
  };

  return (
    <div className="betting-controls mb-4 bg-[hsla(var(--medium)/0.5)] rounded-lg p-4">
      <h3 className="font-display text-lg mb-2">Your Turn</h3>
      
      {/* Timer */}
      <div className="flex justify-between items-center mb-3">
        <span className="text-sm opacity-80">Time remaining:</span>
        <div className="flex items-center bg-[hsla(var(--warning)/0.2)] text-[hsl(var(--warning))] px-3 py-1 rounded-full">
          <span className="mdi mdi-timer-outline mr-1"></span>
          <span id="turnTimer">{formatTime(timeRemaining)}</span>
        </div>
      </div>
      
      {/* Current Bet Info */}
      {highestBet > 0 && (
        <div className="flex justify-between items-center mb-3 bg-[hsla(var(--dark)/0.5)] p-2 rounded">
          <span className="text-sm">Current Bet:</span>
          <span className="font-medium text-[hsl(var(--gold))]">{highestBet} coins</span>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          className={cn(
            "py-2 rounded-md transition text-sm",
            isCall 
              ? "bg-[hsl(var(--secondary))] hover:bg-[hsla(var(--secondary)/0.8)]" 
              : "bg-[hsl(var(--medium))] hover:bg-[hsla(var(--medium)/0.8)]"
          )}
          onClick={onCheck}
        >
          {isCall ? "Call" : "Check"}
        </Button>
        <Button
          variant="default"
          className="bg-[hsl(var(--gold))] text-[hsl(var(--dark))] hover:bg-[hsla(var(--gold)/0.9)] py-2 rounded-md transition font-medium text-sm"
          onClick={handleRaiseClick}
          disabled={maxRaise <= 0}
        >
          Raise
        </Button>
        <Button
          variant="destructive"
          className="bg-[hsl(var(--red))] hover:bg-[hsla(var(--red)/0.9)] py-2 rounded-md transition text-sm"
          onClick={onFold}
        >
          Fold
        </Button>
      </div>
      
      {/* Raise Slider (shown when raise is selected) */}
      {showRaiseControls && (
        <div className="mt-3 bg-[hsla(var(--dark)/0.5)] p-3 rounded-md">
          <div className="flex justify-between text-xs mb-1">
            <span>1</span>
            <span>Max: {maxRaise}</span>
          </div>
          <Slider
            min={1}
            max={maxRaise}
            step={1}
            value={[raiseAmount]}
            onValueChange={handleSliderChange}
            className="w-full mb-2"
          />
          <div className="flex justify-between items-center">
            <span className="text-sm">Raise amount: <span className="font-medium text-[hsl(var(--gold))]">{raiseAmount}</span></span>
            <Button
              variant="default"
              size="sm"
              className="bg-[hsl(var(--gold))] text-[hsl(var(--dark))] px-3 py-1 rounded-md text-sm font-medium"
              onClick={handleConfirmRaise}
            >
              Confirm
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BettingControls;
