"use client";

import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AIInsightCardProps {
  insights: string[];
  title?: string;
  variant?: 'default' | 'inline' | 'compact';
  className?: string;
}

export function AIInsightCard({ 
  insights, 
  title = 'AI Insight', 
  variant = 'default',
  className 
}: AIInsightCardProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-start gap-2 p-3 rounded-lg bg-ai/5 border border-ai/10', className)}>
        <Sparkles className="h-4 w-4 text-ai-accent mt-0.5 shrink-0" />
        <p className="text-sm text-foreground">{insights[0]}</p>
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={cn('flex items-center gap-2 text-sm', className)}>
        <Sparkles className="h-3.5 w-3.5 text-ai-accent" />
        <span className="text-muted-foreground">{insights[0]}</span>
      </div>
    );
  }

  return (
    <div className={cn('ai-zone rounded-lg p-4', className)}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-ai-accent/20 flex items-center justify-center">
          <Sparkles className="h-3.5 w-3.5 text-ai-accent" />
        </div>
        <span className="font-semibold text-ai-accent">{title}</span>
      </div>
      <ul className="space-y-2">
        {insights.map((insight, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-ai-foreground/80">
            <span className="text-ai-accent mt-1">•</span>
            <span>{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

