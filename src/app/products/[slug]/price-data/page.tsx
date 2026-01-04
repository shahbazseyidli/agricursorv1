"use client";

import { useState, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Table, LineChart, Circle, Filter, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AIInsightCard } from '@/components/ui/AIInsightCard';
import { useAuth } from '@/contexts/AuthContext';
import { products, generatePriceHistory, aiInsights } from '@/data/mockData';

type ViewMode = 'table' | 'line' | 'scatter';

export default function ProductPriceDataPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const product = products.find(p => p.id === slug) || products[0];
  
  // Get view mode from URL or default to 'table'
  const viewModeParam = searchParams.get('view') as ViewMode | null;
  const viewMode: ViewMode = viewModeParam && ['table', 'line', 'scatter'].includes(viewModeParam) 
    ? viewModeParam 
    : 'table';
  
  const [selectedCountry, setSelectedCountry] = useState('Azerbaijan');
  const [selectedStage, setSelectedStage] = useState('all');
  const { isAuthenticated, openLoginModal } = useAuth();

  const priceData = useMemo(() => generatePriceHistory(product.name, 90), [product.name]);

  const filteredData = useMemo(() => {
    return priceData.filter(d => {
      if (selectedStage !== 'all' && d.stage !== selectedStage) return false;
      return true;
    });
  }, [priceData, selectedStage]);

  const tableData = filteredData.slice(-50).reverse();
  const previewTableData = tableData.slice(0, 5);
  const displayTableData = isAuthenticated ? tableData : previewTableData;

  const currentInsights = viewMode === 'table' 
    ? aiInsights.tableView 
    : viewMode === 'line' 
      ? aiInsights.lineView 
      : aiInsights.scatterView;

  // Update URL when view mode changes
  const setViewMode = (mode: ViewMode) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', mode);
    router.push(`/products/${slug}/price-data?${params.toString()}`, { scroll: false });
  };

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 items-center">
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Country" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Azerbaijan">Azerbaijan</SelectItem>
            <SelectItem value="Turkey">Turkey</SelectItem>
            <SelectItem value="Georgia">Georgia</SelectItem>
          </SelectContent>
        </Select>

        <Select value={selectedStage} onValueChange={setSelectedStage}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            <SelectItem value="producer">Producer</SelectItem>
            <SelectItem value="wholesale">Wholesale</SelectItem>
            <SelectItem value="retail">Retail</SelectItem>
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          More Filters
        </Button>

        <div className="ml-auto flex items-center gap-1 bg-muted rounded-lg p-1">
          <Button
            variant={viewMode === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <Table className="h-4 w-4 mr-1" />
            Table
          </Button>
          <Button
            variant={viewMode === 'line' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('line')}
          >
            <LineChart className="h-4 w-4 mr-1" />
            Line
          </Button>
          <Button
            variant={viewMode === 'scatter' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('scatter')}
          >
            <Circle className="h-4 w-4 mr-1" />
            Scatter
          </Button>
        </div>
      </div>

      {/* AI Insight */}
      <AIInsightCard insights={currentInsights} className="mb-6" />

      {/* View Content */}
      {viewMode === 'table' && (
        <div className="relative">
          <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
              <table className="data-table">
                <thead className="sticky top-0 bg-card z-10">
                  <tr>
                    <th>Date</th>
                    <th>Market</th>
                    <th>Stage</th>
                    <th className="text-right">Min</th>
                    <th className="text-right">Avg</th>
                    <th className="text-right">Max</th>
                    <th>Currency</th>
                    <th>Unit</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {displayTableData.map((row, index) => (
                    <tr key={index} className={!isAuthenticated && index >= 3 ? 'blur-sm' : ''}>
                      <td className="tabular-nums">{row.date}</td>
                      <td>{row.market}</td>
                      <td>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          row.stage === 'producer' ? 'bg-chart-3/10 text-chart-3' :
                          row.stage === 'wholesale' ? 'bg-chart-1/10 text-chart-1' :
                          'bg-chart-2/10 text-chart-2'
                        }`}>
                          {row.stage}
                        </span>
                      </td>
                      <td className="text-right tabular-nums">{row.min.toFixed(2)}</td>
                      <td className="text-right tabular-nums font-medium">{row.avg.toFixed(2)}</td>
                      <td className="text-right tabular-nums">{row.max.toFixed(2)}</td>
                      <td>{row.currency}</td>
                      <td>{row.unit}</td>
                      <td className="text-muted-foreground">{row.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {!isAuthenticated && (
            <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/90 to-transparent flex items-end justify-center pb-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  Bütün {tableData.length} sətir datanı görmək üçün daxil olun
                </p>
                <Button onClick={openLoginModal} className="bg-accent hover:bg-accent/90">
                  <Lock className="h-4 w-4 mr-2" />
                  Tam datanı aç
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'line' && (
        <div className="premium-card p-6">
          <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center">
              <LineChart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Line Chart View</p>
              <p className="text-sm text-muted-foreground/70">
                Interactive price trend visualization
              </p>
            </div>
          </div>
        </div>
      )}

      {viewMode === 'scatter' && (
        <div className="premium-card p-6">
          <div className="h-[400px] flex items-center justify-center bg-muted/30 rounded-lg">
            <div className="text-center">
              <Circle className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Scatter Plot View</p>
              <p className="text-sm text-muted-foreground/70">
                Price distribution analysis
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

