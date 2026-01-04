"use client";

import { TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SignalBadgeProps {
  signal: 'bullish' | 'bearish' | 'neutral' | 'warning';
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function SignalBadge({ signal, showLabel = true, size = 'md' }: SignalBadgeProps) {
  const config = {
    bullish: {
      icon: TrendingUp,
      label: 'Bullish',
      className: 'signal-up',
    },
    bearish: {
      icon: TrendingDown,
      label: 'Bearish',
      className: 'signal-down',
    },
    neutral: {
      icon: Minus,
      label: 'Neutral',
      className: 'bg-muted text-muted-foreground',
    },
    warning: {
      icon: AlertTriangle,
      label: 'Warning',
      className: 'signal-warning',
    },
  };

  const { icon: Icon, label, className } = config[signal];
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', className, sizeClasses)}>
      <Icon className={iconSize} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

