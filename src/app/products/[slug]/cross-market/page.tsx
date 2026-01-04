"use client";

import { AIInsightCard } from '@/components/ui/AIInsightCard';

export default function ProductCrossMarketPage() {
  return (
    <>
      <AIInsightCard
        title="Cross-Market Intelligence"
        insights={[
          'Onion prices show 0.78 correlation with potato prices in Pakistan with a 2-month lag.',
          'Wheat price movements in Turkey lead Azerbaijan by approximately 3 weeks.',
          'Sunflower oil volatility in Ukraine impacts global edible oil indices within 48 hours.'
        ]}
        className="mb-6"
      />

      <div className="premium-card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Related Product</th>
              <th>Correlation</th>
              <th>Lag</th>
              <th>Confidence</th>
              <th>Region</th>
            </tr>
          </thead>
          <tbody>
            {[
              { product: 'Corn', correlation: 0.85, lag: '2 weeks', confidence: 'High', region: 'Global' },
              { product: 'Soybean', correlation: 0.72, lag: '1 month', confidence: 'Medium', region: 'Americas' },
              { product: 'Barley', correlation: 0.91, lag: '1 week', confidence: 'High', region: 'Black Sea' },
              { product: 'Rice', correlation: 0.45, lag: '3 months', confidence: 'Low', region: 'Asia' },
            ].map((row, i) => (
              <tr key={i}>
                <td className="font-medium">{row.product}</td>
                <td className="tabular-nums">{row.correlation.toFixed(2)}</td>
                <td>{row.lag}</td>
                <td>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    row.confidence === 'High' ? 'bg-market-up/10 text-market-up' :
                    row.confidence === 'Medium' ? 'bg-market-warning/10 text-market-warning' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {row.confidence}
                  </span>
                </td>
                <td className="text-muted-foreground">{row.region}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

