import React from "react";

interface IconProps {
  className?: string;
}

export const QuestionMarkIcon: React.FC<IconProps> = ({ className }) => (
  <span className={`mdi mdi-help-circle-outline ${className}`}></span>
);

export const TreasureIcon: React.FC<IconProps> = ({ className }) => (
  <span className={`mdi mdi-treasure-chest ${className}`}></span>
);

export const TrapIcon: React.FC<IconProps> = ({ className }) => (
  <span className={`mdi mdi-bear-trap ${className}`}></span>
);

export const EmptyIcon: React.FC<IconProps> = ({ className }) => (
  <span className={`mdi mdi-close-circle-outline ${className}`}></span>
);

export const TimerIcon: React.FC<IconProps> = ({ className }) => (
  <span className={`mdi mdi-timer-outline ${className}`}></span>
);

export const CoinIcon: React.FC<IconProps> = ({ className }) => (
  <span className={`mdi mdi-coin ${className}`}></span>
);

export const ChevronIcon: React.FC<IconProps> = ({ className }) => (
  <span className={`mdi mdi-chevron-right ${className}`}></span>
);
