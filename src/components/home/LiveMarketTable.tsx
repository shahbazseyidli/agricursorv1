"use client";

import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { liveMarketData, aiInsights } from '@/data/mockData';
import { SignalBadge } from '@/components/ui/SignalBadge';
import { PriceChange } from '@/components/ui/PriceChange';
import { AIInsightCard } from '@/components/ui/AIInsightCard';

export function LiveMarketTable() {
  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Live Market Intelligence</h2>
            <p className="text-muted-foreground">Real-time prices and AI signals from global markets</p>
          </div>
          <Link 
            href="/products" 
            className="text-sm font-medium text-accent hover:text-accent/80 flex items-center gap-1"
          >
            View all markets
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        
        {/* AI Insight */}
        <AIInsightCard 
          insights={aiInsights.tableView} 
          className="mb-6"
        />
        
        {/* Table */}
        <div className="premium-card overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Country</th>
                  <th>Market</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">WoW</th>
                  <th className="text-right">MoM</th>
                  <th>AI Signal</th>
                </tr>
              </thead>
              <tbody>
                {liveMarketData.map((item) => (
                  <tr key={item.id} className="group">
                    <td>
                      <Link 
                        href={`/products/${item.product.toLowerCase()}`}
                        className="font-medium text-foreground hover:text-accent transition-colors"
                      >
                        {item.product}
                      </Link>
                    </td>
                    <td>
                      <Link 
                        href={`/countries/${item.country.toLowerCase().replace(' ', '-')}`}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {item.country}
                      </Link>
                    </td>
                    <td className="text-muted-foreground">{item.market}</td>
                    <td className="text-right font-medium tabular-nums">
                      {item.price.toLocaleString()} <span className="text-muted-foreground text-xs">{item.currency}/{item.unit}</span>
                    </td>
                    <td className="text-right">
                      <PriceChange value={item.weekChange} />
                    </td>
                    <td className="text-right">
                      <PriceChange value={item.monthChange} />
                    </td>
                    <td>
                      <SignalBadge signal={item.aiSignal} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
}

