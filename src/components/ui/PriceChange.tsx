"use client";

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PriceChangeProps {
  value: number | null | undefined;
  showIcon?: boolean;
  className?: string;
}

export function PriceChange({ value, showIcon = true, className }: PriceChangeProps) {
  // Handle null/undefined values
  if (value === null || value === undefined) {
    return (
      <span className={cn('inline-flex items-center gap-1 text-muted-foreground', className)}>
        {showIcon && <Minus className="h-3.5 w-3.5" />}
        <span>N/A</span>
      </span>
    );
  }

  const isPositive = value > 0;
  const isNeutral = value === 0;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-medium tabular-nums',
        isPositive && 'text-market-up',
        !isPositive && !isNeutral && 'text-market-down',
        isNeutral && 'text-muted-foreground',
        className
      )}
    >
      {showIcon && !isNeutral && (
        isPositive ? (
          <TrendingUp className="h-3.5 w-3.5" />
        ) : (
          <TrendingDown className="h-3.5 w-3.5" />
        )
      )}
      <span>
        {isPositive && '+'}
        {value.toFixed(1)}%
      </span>
    </span>
  );
}

