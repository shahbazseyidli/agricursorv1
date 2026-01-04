"use client";

import { TrendingUp, TrendingDown, Minus, AlertTriangle, Eye, ShoppingCart, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';

type SignalType = 'bullish' | 'bearish' | 'neutral' | 'warning' | 'buy' | 'sell' | 'hold' | 'watch';

interface SignalBadgeProps {
  signal: SignalType;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function SignalBadge({ signal, showLabel = true, size = 'md' }: SignalBadgeProps) {
  const config: Record<SignalType, { icon: typeof TrendingUp; label: string; className: string }> = {
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
    buy: {
      icon: ShoppingCart,
      label: 'Al',
      className: 'signal-up',
    },
    sell: {
      icon: DollarSign,
      label: 'Sat',
      className: 'signal-down',
    },
    hold: {
      icon: Minus,
      label: 'Saxla',
      className: 'bg-muted text-muted-foreground',
    },
    watch: {
      icon: Eye,
      label: 'İzlə',
      className: 'signal-warning',
    },
  };

  const signalConfig = config[signal] || config.neutral;
  const { icon: Icon, label, className } = signalConfig;
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2 py-1 text-xs';
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5';

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', className, sizeClasses)}>
      <Icon className={iconSize} />
      {showLabel && <span>{label}</span>}
    </span>
  );
}

