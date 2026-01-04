"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Search, 
  ArrowRight, 
  TrendingUp, 
  TrendingDown,
  BarChart3, 
  Globe,
  Leaf,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Calendar,
  Loader2,
  X,
  Brain,
  MessageCircle,
  BarChart2,
  FileText,
  AlertTriangle,
  Zap,
  Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Flag emoji helper
function getFlagEmoji(countryCode: string): string {
  if (!countryCode || countryCode.length !== 2) return "🏳️";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Category icons
const categoryIcons: Record<string, string> = {
  "Fruits": "🍎",
  "Vegetables": "🥬",
  "Grains": "🌾",
  "Nuts": "🥜",
  "Cereals": "🌾",
  "Other": "📦",
  "Meyvələr": "🍎",
  "Tərəvəzlər": "🥬",
};

// Mock data for Live Market Intelligence
const mockLiveMarketData = [
  { product: "Apple", productAz: "Alma", country: "AZ", market: "Retail", price: 1.45, currency: "USD", wow: 2.3, mom: 5.1, signal: "stable" },
  { product: "Tomato", productAz: "Pomidor", country: "TR", market: "Wholesale", price: 0.85, currency: "USD", wow: -1.2, mom: -8.4, signal: "watch" },
  { product: "Potato", productAz: "Kartof", country: "DE", market: "Producer", price: 0.32, currency: "USD", wow: 0.5, mom: 2.1, signal: "stable" },
  { product: "Wheat", productAz: "Buğda", country: "UA", market: "Wholesale", price: 245, currency: "USD", wow: -3.1, mom: -12.5, signal: "alert" },
  { product: "Onion", productAz: "Soğan", country: "IN", market: "Retail", price: 0.55, currency: "USD", wow: 8.2, mom: 15.3, signal: "alert" },
  { product: "Rice", productAz: "Düyü", country: "PK", market: "Wholesale", price: 0.78, currency: "USD", wow: 1.5, mom: 4.2, signal: "stable" },
];

// Mock weekly briefs
const mockWeeklyBriefs = [
  { title: "Global Grain Weekly", subtitle: "Jan 4 - Jan 11, 2026", icon: "🌾", type: "grain" },
  { title: "Caucasus Agri Watch", subtitle: "Weekly Regional Report", icon: "🏔️", type: "regional" },
  { title: "Top 5 Price Anomalies", subtitle: "This Week's Alerts", icon: "⚠️", type: "alert" },
];

// Mock trending data
const mockTrendingProducts = [
  { name: "Wheat", change: 12, direction: "up" },
  { name: "Rice", change: 8, direction: "up" },
  { name: "Corn", change: 5, direction: "up" },
  { name: "Soybean", change: 3, direction: "up" },
];

const mockMostSearched = [
  { query: "Apple + Germany" },
  { query: "Wheat + Ukraine" },
  { query: "Potato + Poland" },
  { query: "Tomato + Turkey" },
];

const mockVolatility = [
  { name: "Onion", level: "high" },
  { name: "Tomato", level: "medium" },
  { name: "Pepper", level: "medium" },
  { name: "Garlic", level: "low" },
];

interface MarketBriefClientProps {
  stats: {
    products: number;
    markets: number;
    euCountries: number;
    faoCountries: number;
    prices: number;
  };
  categories: { name: string; count: number }[];
  trendingProducts: {
    id: string;
    slug: string;
    nameAz: string | null;
    nameEn: string;
    category: string | null;
    image: string | null;
    dataCount: number;
  }[];
  latestAzPrices: {
    id: string;
    productName: string;
    productSlug: string;
    marketName: string;
    marketType: string;
    price: number;
    date: string;
  }[];
  latestEuPrices: {
    id: string;
    productName: string;
    productSlug: string | null;
    countryName: string;
    countryCode: string;
    price: number;
    year: number;
    period: number | null;
  }[];
  latestFaoPrices: {
    id: string;
    productName: string;
    productSlug: string | null;
    countryName: string;
    countryCode: string;
    price: number;
    year: number;
    currency: string;
    unit: string;
  }[];
  countriesWithData: {
    code: string;
    name: string;
    nameAz: string;
    euPrices: number;
    faoPrices: number;
  }[];
}

export function MarketBriefClient({
  stats,
  categories,
  trendingProducts,
  latestAzPrices,
  latestEuPrices,
  latestFaoPrices,
  countriesWithData,
}: MarketBriefClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [streamingAnswer, setStreamingAnswer] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);
  const [responseMode, setResponseMode] = useState<"text" | "chart">("text");
  const [chartData, setChartData] = useState<{
    product?: { name: string; slug: string };
    chartData: Array<{
      source: string;
      sourceUrl: string;
      priceType: string;
      country: string;
      price: number;
      unit: string;
      currency: string;
      year: number;
      period?: number;
      priceInAZN: number;
    }>;
  } | null>(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    setStreamingAnswer("");
    setChartData(null);

    try {
      if (responseMode === "chart") {
        const response = await fetch("/api/ai/chart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || "Xəta baş verdi");
        }

        setChartData(data);
      } else {
        const response = await fetch("/api/ai/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: searchQuery }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Xəta baş verdi");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("Stream reader unavailable");
        }

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.startsWith("data: "));

          for (const line of lines) {
            const data = line.replace("data: ", "").trim();
            if (data === "[DONE]") continue;
            
            try {
              const parsed = JSON.parse(data);
              if (parsed.content) {
                setStreamingAnswer((prev) => prev + parsed.content);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Bilinməyən xəta");
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSearching && searchQuery.trim()) {
      e.preventDefault();
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setStreamingAnswer("");
    setSearchError(null);
    setChartData(null);
  };

  const maxPrice = chartData?.chartData.length 
    ? Math.max(...chartData.chartData.map(d => d.priceInAZN))
    : 0;

  // Signal badge component
  const SignalBadge = ({ signal }: { signal: string }) => {
    const colors = {
      stable: "bg-emerald-500",
      watch: "bg-amber-500",
      alert: "bg-red-500",
    };
    return (
      <div className={`w-3 h-3 rounded-full ${colors[signal as keyof typeof colors] || colors.stable}`} />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900">Agrai</span>
            </Link>

            <nav className="hidden md:flex items-center gap-8">
              <Link
                href="/products"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Products
              </Link>
              <Link
                href="/countries"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Countries
              </Link>
              <Link
                href="/data-sources"
                className="text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors"
              >
                Data Sources
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/login">Login</Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* AI HERO SECTION - SAXLANILIR */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="pt-24 pb-16 min-h-[70vh] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0f0d] via-[#0d1210] to-[#0a0a0a]" />
        
        <div className="absolute inset-0">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-emerald-600/8 rounded-full blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-teal-600/6 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center py-8 md:py-16">
            
            {/* Agrai Logo & Brand */}
            <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-full border border-emerald-500/20 backdrop-blur-sm">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full animate-ping" />
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Agrai
              </span>
              <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-white/5 rounded-full">
                BETA
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="text-white">Kənd təsərrüfatı üçün</span>
              <br />
              <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent animate-gradient">
                süni intellekt
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed">
              Real-time bazar qiymətləri, trend analizləri və 
              <span className="text-emerald-400 font-semibold"> 50+ ölkənin</span> məlumatları bir sorğuda
            </p>

            {/* Premium AI Search Box */}
            <div className="max-w-3xl mx-auto">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/50 via-teal-500/50 to-cyan-500/50 rounded-2xl blur-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-500" />
                
                <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-emerald-500/5">
                  <div className="flex items-center">
                    <div className="pl-5 pr-3 py-4">
                      <div className="relative">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 ${
                          isSearching 
                            ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/40" 
                            : "bg-gradient-to-br from-emerald-500/20 to-teal-500/20 group-hover:from-emerald-500/30 group-hover:to-teal-500/30"
                        }`}>
                          {isSearching ? (
                            <Loader2 className="w-5 h-5 text-white animate-spin" />
                          ) : (
                            <Brain className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                          )}
                        </div>
                        {isSearching && (
                          <div className="absolute inset-0 rounded-xl bg-emerald-500/50 animate-ping" />
                        )}
                      </div>
                    </div>
                    
                    <input
                      type="text"
                      className="flex-1 bg-transparent py-5 text-white text-lg placeholder-slate-500 focus:outline-none"
                      placeholder="Agrai-dən soruşun..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleKeyDown}
                      disabled={isSearching}
                    />
                    
                    <div className="pr-3 flex items-center gap-2">
                      {searchQuery && !isSearching && (
                        <button 
                          className="p-2 text-slate-500 hover:text-white rounded-lg hover:bg-white/5 transition-all"
                          onClick={clearSearch}
                        >
                          <X className="w-5 h-5" />
                        </button>
                      )}
                      
                      <div className="flex items-center gap-0.5 p-1 bg-white/5 rounded-lg">
                        <button
                          onClick={() => setResponseMode("text")}
                          className={`p-2 rounded-md transition-all ${
                            responseMode === "text"
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                          title="Mətn cavabı"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setResponseMode("chart")}
                          className={`p-2 rounded-md transition-all ${
                            responseMode === "chart"
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                              : "text-slate-400 hover:text-white hover:bg-white/5"
                          }`}
                          title="Qrafik cavabı"
                        >
                          <BarChart2 className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <button 
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium transition-all ${
                          isSearching || !searchQuery.trim()
                            ? "bg-slate-700 text-slate-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/25 hover:scale-105 active:scale-95"
                        }`}
                        onClick={handleSearch}
                        disabled={isSearching || !searchQuery.trim()}
                      >
                        {isSearching ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Analiz...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Search</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick suggestions */}
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <span className="text-xs text-slate-400">Popular:</span>
                {["Alma", "Buğda", "Pomidor", "Kartof", "Düyü"].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => setSearchQuery(suggestion + " qiymətləri")}
                    className="px-3 py-1.5 text-xs text-slate-300 hover:text-emerald-300 bg-white/5 hover:bg-emerald-500/15 rounded-full border border-white/10 hover:border-emerald-500/30 transition-all"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              {/* AI Search Result */}
              {(streamingAnswer || searchError || isSearching || chartData) && (
                <div className="mt-8 text-left">
                  <div className="relative">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-2xl blur opacity-75" />
                    
                    <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-gradient-to-r from-emerald-500/5 to-transparent">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                            <Sparkles className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-white">Agrai</span>
                            <span className="text-slate-500 text-sm ml-2">
                              {isSearching ? "analyzing..." : "response"}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        {isSearching && !streamingAnswer && !chartData && (
                          <div className="flex items-center gap-4 py-4">
                            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                            <span className="text-white">Agrai analyzing data...</span>
                          </div>
                        )}
                      
                        {searchError && (
                          <div className="flex items-start gap-4 p-4 bg-red-500/10 rounded-xl border border-red-500/20">
                            <X className="w-5 h-5 text-red-400" />
                            <p className="text-red-400">{searchError}</p>
                          </div>
                        )}
                        
                        {streamingAnswer && (
                          <div 
                            className="text-slate-200 text-[15px] leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ 
                              __html: streamingAnswer
                                .replace(/\*\*([^*]+)\*\*/g, '<span class="font-semibold text-emerald-400">$1</span>')
                                .replace(/\n/g, '<br />')
                            }}
                          />
                        )}

                        {chartData && chartData.chartData.length > 0 && (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-white">
                              {chartData.product?.name} - Price Comparison
                            </h3>
                            <div className="space-y-2">
                              {chartData.chartData.map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                  <div className="w-32 text-xs text-slate-300 truncate">
                                    {item.country} ({item.year})
                                  </div>
                                  <div className="flex-1 relative h-8 bg-slate-800 rounded overflow-hidden">
                                    <div
                                      className="absolute inset-y-0 left-0 rounded bg-gradient-to-r from-emerald-600 to-emerald-500"
                                      style={{ width: `${(item.priceInAZN / maxPrice) * 100}%` }}
                                    />
                                    <div className="absolute inset-0 flex items-center px-2">
                                      <span className="text-xs font-bold text-white drop-shadow">
                                        {item.priceInAZN.toFixed(2)} AZN/kg
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* LIVE MARKET INTELLIGENCE - YENİ TABLE-FIRST DİZAYN */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Live Market Intelligence</h2>
                <p className="text-sm text-slate-500">Real-time price monitoring across 50+ countries</p>
              </div>
            </div>
            <Link href="/products" className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1">
              View All <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Main Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-6 py-4">Product</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">Country</th>
                    <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">Market</th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">Price</th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">WoW</th>
                    <th className="text-right text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">MoM</th>
                    <th className="text-center text-xs font-semibold text-slate-600 uppercase tracking-wider px-4 py-4">AI Signal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mockLiveMarketData.map((row, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors cursor-pointer">
                      <td className="px-6 py-4">
                        <Link href={`/products/${row.product.toLowerCase()}`} className="flex items-center gap-3">
                          <span className="text-lg">{categoryIcons[row.product === "Wheat" ? "Grains" : "Fruits"]}</span>
                          <div>
                            <div className="font-medium text-slate-900">{row.product}</div>
                            <div className="text-xs text-slate-500">{row.productAz}</div>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getFlagEmoji(row.country)}</span>
                          <span className="text-sm text-slate-700">{row.country}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="outline" className="text-xs">{row.market}</Badge>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-mono font-semibold text-slate-900">
                          ${row.price.toFixed(2)}
                          <span className="text-xs text-slate-500 font-normal">/kg</span>
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-mono text-sm ${row.wow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.wow >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {row.wow >= 0 ? '+' : ''}{row.wow.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className={`inline-flex items-center gap-1 font-mono text-sm ${row.mom >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                          {row.mom >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {row.mom >= 0 ? '+' : ''}{row.mom.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-center">
                          <SignalBadge signal={row.signal} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Legend */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center gap-6 text-xs text-slate-500">
              <span className="font-medium">AI Signal:</span>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Stable</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /> Watch</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500" /> Alert</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* WEEKLY AI BRIEFS + TRENDING TABLES */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-6">
            
            {/* Weekly AI Briefs */}
            <Card className="lg:col-span-1">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg">Weekly AI Briefs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {mockWeeklyBriefs.map((brief, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                    <span className="text-2xl">{brief.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 text-sm">{brief.title}</div>
                      <div className="text-xs text-slate-500">{brief.subtitle}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Trending Products */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  <CardTitle className="text-lg">Trending Products</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockTrendingProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500 w-4">{index + 1}.</span>
                        <span className="text-sm font-medium text-slate-900">{product.name}</span>
                      </div>
                      <span className="text-sm font-mono text-emerald-600">▲ {product.change}%</span>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Most Searched</div>
                  <div className="space-y-2">
                    {mockMostSearched.map((item, index) => (
                      <div key={index} className="text-sm text-slate-600">{index + 1}. {item.query}</div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Volatility Index */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <CardTitle className="text-lg">Volatility Index</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockVolatility.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-900">{item.name}</span>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${
                          item.level === 'high' ? 'bg-red-50 text-red-700 border-red-200' :
                          item.level === 'medium' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                          'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}
                      >
                        {item.level === 'high' ? '🔴' : item.level === 'medium' ? '🟡' : '🟢'} {item.level}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* STATS BAR */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-8 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{stats.products}+</div>
              <div className="text-sm text-slate-500">Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">136</div>
              <div className="text-sm text-slate-500">Countries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{stats.markets}+</div>
              <div className="text-sm text-slate-500">Markets</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">4</div>
              <div className="text-sm text-slate-500">Data Sources</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-600">{(stats.prices / 1000).toFixed(0)}K+</div>
              <div className="text-sm text-slate-500">Price Records</div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* QUICK ACCESS CARDS */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <section className="py-12 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-6">
            <Link href="/products">
              <Card className="h-full hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                    <Database className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Browse Products</h3>
                  <p className="text-sm text-slate-600">Explore {stats.products}+ agricultural commodities with global price data</p>
                  <div className="mt-4 text-emerald-600 text-sm font-medium flex items-center gap-1">
                    View Products <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/countries">
              <Card className="h-full hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                    <Globe className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Browse Countries</h3>
                  <p className="text-sm text-slate-600">136 countries with agricultural market intelligence</p>
                  <div className="mt-4 text-blue-600 text-sm font-medium flex items-center gap-1">
                    View Countries <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/data-sources">
              <Card className="h-full hover:shadow-lg hover:border-emerald-200 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                    <BarChart3 className="w-6 h-6 text-amber-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Data Sources</h3>
                  <p className="text-sm text-slate-600">FAO FPMA, Eurostat, FAOSTAT, and local market data</p>
                  <div className="mt-4 text-amber-600 text-sm font-medium flex items-center gap-1">
                    View Sources <ArrowRight className="w-4 h-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* FOOTER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Leaf className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-lg text-white">Agrai</span>
              </div>
              <p className="text-sm text-slate-400">
                AI-powered agricultural price intelligence platform
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/products" className="hover:text-white transition-colors">Products</Link></li>
                <li><Link href="/countries" className="hover:text-white transition-colors">Countries</Link></li>
                <li><Link href="/data-sources" className="hover:text-white transition-colors">Data Sources</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Sources</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="https://agro.gov.az" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">Agro.gov.az <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://www.fao.org/giews/food-prices" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">FAO FPMA <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://ec.europa.eu/eurostat" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">Eurostat <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://www.fao.org/faostat" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors flex items-center gap-1">FAOSTAT <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-sm text-slate-500">
              © 2026 Agrai. All rights reserved.
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <span>Powered by FAO FPMA, Eurostat, FAOSTAT, Agro.gov.az</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
