"use client";

import { AIInsightCard } from '@/components/ui/AIInsightCard';

export default function ProductInsightsPage() {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      <AIInsightCard
        title="Price Trend Analysis"
        insights={[
          'Upward trend detected over the past 30 days with 12.5% appreciation.',
          'Current price is 8% above the 90-day moving average.',
          'Volatility has decreased 15% compared to previous quarter.'
        ]}
      />
      <AIInsightCard
        title="Risk Assessment"
        insights={[
          'Weather conditions in key production regions remain favorable.',
          'Geopolitical tensions in Black Sea region may impact supply chains.',
          'Currency fluctuations present moderate hedging opportunities.'
        ]}
      />
      <AIInsightCard
        title="Seasonality Patterns"
        insights={[
          'Historical data shows peak prices in Q1 (January-March).',
          'Harvest season typically brings 15-20% price correction.',
          'Current trajectory aligns with 5-year seasonal pattern.'
        ]}
      />
      <AIInsightCard
        title="Supply & Demand"
        insights={[
          'Global production forecast up 3% YoY.',
          'Export demand from Asia remains strong.',
          'Storage levels at 85% of capacity in major markets.'
        ]}
      />
    </div>
  );
}

