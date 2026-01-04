"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Loader2, RefreshCw } from 'lucide-react';
import { SignalBadge } from '@/components/ui/SignalBadge';
import { PriceChange } from '@/components/ui/PriceChange';
import { AIInsightCard } from '@/components/ui/AIInsightCard';
import { Button } from '@/components/ui/button';
import { aiInsights } from '@/data/mockData';

interface PriceSignal {
  id: string;
  product: {
    id: string;
    slug: string;
    nameAz: string | null;
    nameEn: string;
    image: string | null;
  };
  variety: {
    id: string | null;
    slug: string;
    nameAz: string;
    nameEn: string;
  };
  country: {
    id: string;
    iso2: string;
    nameAz: string | null;
    nameEn: string;
    flagEmoji: string | null;
  };
  market: {
    id: string;
    name: string;
    nameEn: string;
    isNationalAvg: boolean;
  };
  priceStage: {
    id: string;
    code: string;
    nameAz: string | null;
    nameEn: string;
  } | null;
  currentPrice: number;
  currentPriceDate: string;
  mom: number | null;
  threeMonthChange: number | null;
  sixMonthChange: number | null;
  momStatus: 'INCREASED' | 'DECREASED' | 'STABLE';
  threeMonthStatus: 'INCREASED' | 'DECREASED' | 'STABLE';
  sixMonthStatus: 'INCREASED' | 'DECREASED' | 'STABLE';
  dataSource: string;
}

// Convert status to AI signal
function getAiSignal(
  momStatus: string, 
  threeMonthStatus: string, 
  sixMonthStatus: string,
  mom: number | null, 
  threeMonthChange: number | null,
  sixMonthChange: number | null
): 'buy' | 'sell' | 'hold' | 'watch' {
  // Count how many periods show decrease/increase
  const statuses = [momStatus, threeMonthStatus, sixMonthStatus];
  const decreaseCount = statuses.filter(s => s === 'DECREASED').length;
  const increaseCount = statuses.filter(s => s === 'INCREASED').length;
  
  // Strong buy signal - multiple periods decreasing
  if (decreaseCount >= 2) {
    return 'buy';
  }
  // Strong sell signal - multiple periods increasing
  if (increaseCount >= 2) {
    return 'sell';
  }
  // High volatility - watch closely
  const changes = [mom, threeMonthChange, sixMonthChange].filter(c => c !== null) as number[];
  if (changes.some(c => Math.abs(c) > 15)) {
    return 'watch';
  }
  return 'hold';
}

export function LiveMarketTable() {
  const [signals, setSignals] = useState<PriceSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSignals = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/price-signals?limit=9&random=true&status=changed');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      if (data.success) {
        setSignals(data.data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching price signals:', err);
      setError('Məlumatlar yüklənmədi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, []);

  return (
    <section className="py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold mb-1">Live Market Intelligence</h2>
            <p className="text-muted-foreground">Real-time prices and AI signals from global markets</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchSignals}
              disabled={loading}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Yenilə
            </Button>
            <Link 
              href="/products" 
              className="text-sm font-medium text-accent hover:text-accent/80 flex items-center gap-1"
            >
              View all markets
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
        
        {/* AI Insight */}
        <AIInsightCard 
          insights={aiInsights.tableView} 
          className="mb-6"
        />
        
        {/* Table */}
        <div className="premium-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>{error}</p>
              <Button variant="outline" size="sm" onClick={fetchSignals} className="mt-4">
                Yenidən cəhd et
              </Button>
            </div>
          ) : signals.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <p>Heç bir dəyişiklik tapılmadı</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Məhsul</th>
                    <th>Növ</th>
                    <th>Ölkə</th>
                    <th>Bazar</th>
                    <th>Qiymət Növü</th>
                    <th className="text-center">Qiymət (USD/kg)</th>
                    <th className="text-center">Tarix</th>
                    <th className="text-center">1M</th>
                    <th className="text-center">3M</th>
                    <th className="text-center">6M</th>
                    <th>AI Signal</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((signal) => (
                    <tr key={signal.id} className="group">
                      <td>
                        <Link 
                          href={`/products/${signal.product.slug}`}
                          className="font-medium text-foreground hover:text-accent transition-colors"
                        >
                          {signal.product.nameAz || signal.product.nameEn}
                        </Link>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {signal.variety.nameAz || signal.variety.nameEn}
                      </td>
                      <td>
                        <Link 
                          href={`/countries/${signal.country.iso2.toLowerCase()}`}
                          className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                        >
                          {signal.country.flagEmoji && <span>{signal.country.flagEmoji}</span>}
                          {signal.country.nameAz || signal.country.nameEn}
                        </Link>
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {signal.market.name}
                      </td>
                      <td className="text-muted-foreground text-sm">
                        {signal.priceStage?.nameAz || signal.priceStage?.nameEn || '-'}
                      </td>
                      <td className="text-center font-medium tabular-nums">
                        {signal.currentPrice.toFixed(2)}
                      </td>
                      <td className="text-center text-muted-foreground text-sm tabular-nums">
                        {signal.currentPriceDate}
                      </td>
                      <td className="text-center">
                        <PriceChange value={signal.mom} />
                      </td>
                      <td className="text-center">
                        <PriceChange value={signal.threeMonthChange} />
                      </td>
                      <td className="text-center">
                        <PriceChange value={signal.sixMonthChange} />
                      </td>
                      <td>
                        <SignalBadge 
                          signal={getAiSignal(
                            signal.momStatus, 
                            signal.threeMonthStatus, 
                            signal.sixMonthStatus,
                            signal.mom, 
                            signal.threeMonthChange,
                            signal.sixMonthChange
                          )} 
                          size="sm" 
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {/* Data Source Info */}
        {!loading && signals.length > 0 && (
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Məlumatlar: Agro.gov.az (AZ), FAO FPMA • Son yenilənmə: {new Date().toLocaleDateString('az-AZ')}
          </p>
        )}
      </div>
    </section>
  );
}
