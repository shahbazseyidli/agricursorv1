"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriceChart } from "@/components/charts/price-chart";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  MapPin,
  Calendar,
  Package,
  ArrowUpRight,
  BarChart3,
  X,
  Store,
  Building2,
  Warehouse,
  Tractor,
  ArrowDown,
  ArrowUp,
  GitCompare,
  Lock,
  Globe,
  DollarSign,
  ChevronDown,
} from "lucide-react";
import { formatPrice, formatDate, formatShortDate } from "@/lib/utils";
import { EuComparison } from "@/components/products/eu-comparison";
import { MultiSourceComparison } from "@/components/products/multi-source-comparison";

interface Currency {
  code: string;
  symbol: string;
  nameAz: string;
  rateToAZN: number;
}

interface ProductInfo {
  descriptionAz?: string | null;
  descriptionEn?: string | null;
  history?: string | null;
  uses?: string | null;
  nutrition?: string | null;
  varieties?: string | null;
  storage?: string | null;
  seasonality?: string | null;
  image?: string | null;
  faoCode?: string | null;
  hsCode?: string | null;
  eurostatCode?: string | null;
}

interface ProductPageClientProps {
  product: any;
  markets: any[];
  latestPrices: any[];
  relatedProducts: any[];
  allProducts: any[];
  allCategories: any[];
  allCountries: { id: string; name: string; iso2: string; type: "local" | "eu" }[];
  selectedCountry?: string;
  hasAzData?: boolean;
  hasEuData?: boolean;
  productInfo?: ProductInfo | null;
}

// Market type icons
const marketTypeIcons: Record<string, any> = {
  RETAIL: Store,
  WHOLESALE: Warehouse,
  PROCESSING: Building2,
  FIELD: Tractor,
};

// Market type colors
const marketTypeColors: Record<string, string> = {
  RETAIL: "bg-blue-50 text-blue-700 border-blue-200",
  WHOLESALE: "bg-purple-50 text-purple-700 border-purple-200",
  PROCESSING: "bg-orange-50 text-orange-700 border-orange-200",
  FIELD: "bg-green-50 text-green-700 border-green-200",
};

export function ProductPageClient({
  product,
  markets,
  latestPrices,
  relatedProducts,
  allProducts,
  allCategories,
  allCountries,
  selectedCountry = "AZ",
  hasAzData = true,
  hasEuData = false,
  productInfo,
}: ProductPageClientProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isGuest = status === "unauthenticated";
  const isLoading = status === "loading";
  
  const [currentCountry, setCurrentCountry] = useState<string>(selectedCountry);
  const [selectedMarketType, setSelectedMarketType] = useState<string>("");
  const [selectedMarket, setSelectedMarket] = useState<string>("");
  const [selectedProductType, setSelectedProductType] = useState<string>("");
  const [dateRange, setDateRange] = useState("6m");
  
  // Data source state
  const [selectedDataSource, setSelectedDataSource] = useState<string>("AGRO_AZ");
  
  // Data source options
  const DATA_SOURCES = [
    { code: "AGRO_AZ", name: "Agro.gov.az", icon: "🇦🇿" },
    { code: "EUROSTAT", name: "Eurostat", icon: "🇪🇺" },
    { code: "FAOSTAT", name: "FAOSTAT", icon: "🌍" },
    { code: "FAO_FPMA", name: "FAO FPMA", icon: "📊" },
  ];
  
  // Only show markets filter for Azerbaijan with AGRO_AZ source
  const showMarketsFilter = currentCountry === "AZ" && markets.length > 0 && selectedDataSource === "AGRO_AZ";
  
  // Currency state
  const [selectedCurrency, setSelectedCurrency] = useState<string>("AZN");
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [currencyInfo, setCurrencyInfo] = useState<{code: string; symbol: string; fxRate: number} | null>(null);
  
  // Unit selector state
  const [selectedUnit, setSelectedUnit] = useState<string>("kg");
  const [units, setUnits] = useState<any[]>([]);
  
  // Country comparison state
  const [compareCountry, setCompareCountry] = useState<string>("");
  const [comparisonResult, setComparisonResult] = useState<any>(null);
  const [availableEuCountries, setAvailableEuCountries] = useState<{code: string; name: string}[]>([]);
  
  // Custom date range state
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStartYear, setCustomStartYear] = useState<string>("");
  const [customStartMonth, setCustomStartMonth] = useState<string>("");
  const [customEndYear, setCustomEndYear] = useState<string>("");
  const [customEndMonth, setCustomEndMonth] = useState<string>("");
  
  // Format price using backend-provided currency info
  const formatConvertedPrice = (price: number): string => {
    const code = currencyInfo?.code || "AZN";
    return `${price.toFixed(2)} ${code}`;
  };
  
  // Get products for the same category for dropdown
  const productsInCategory = allProducts.filter(
    (p: any) => p.categoryId === product.categoryId
  );
  
  // Handle country change
  const handleCountryChange = (countryCode: string) => {
    setCurrentCountry(countryCode);
    // Reset market-related filters when country changes
    setSelectedMarket("");
    setSelectedMarketType("");
    // Navigate to same product with new country
    router.push(`/products/${product.slug}?country=${countryCode.toLowerCase()}`);
  };
  
  // Fetch currencies and units on mount
  useEffect(() => {
    async function fetchCurrencies() {
      try {
        const res = await fetch("/api/currencies");
        const data = await res.json();
        setCurrencies(data.data || []);
      } catch (error) {
        console.error("Error fetching currencies:", error);
      }
    }
    
    async function fetchUnits() {
      try {
        const res = await fetch("/api/units");
        const data = await res.json();
        // Filter to show only weight units for simplicity
        const weightUnits = (data.data || []).filter((u: any) => u.category === "weight");
        setUnits(weightUnits);
      } catch (error) {
        console.error("Error fetching units:", error);
      }
    }
    
    fetchCurrencies();
    fetchUnits();
  }, []);
  const [chartData, setChartData] = useState<any[]>([]);
  const [comparisonData, setComparisonData] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filters, setFilters] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Müqayisə üçün ikinci bazar seçimi (filter kimi)
  const [compareMarket, setCompareMarket] = useState<string>("");

  // Fetch data with all filters
  useEffect(() => {
    async function fetchPrices() {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        
        // Handle custom date range
        if (dateRange === "custom" && customStartYear && customStartMonth && customEndYear && customEndMonth) {
          params.append("range", "custom");
          params.append("startDate", `${customStartYear}-${customStartMonth}-01`);
          params.append("endDate", `${customEndYear}-${customEndMonth}-28`);
        } else {
          params.append("range", dateRange);
        }
        
        if (selectedMarket) {
          params.append("market", selectedMarket);
        }
        if (selectedMarketType) {
          params.append("marketType", selectedMarketType);
        }
        if (selectedProductType) {
          params.append("productType", selectedProductType);
        }
        // Müqayisə bazarı filter kimi
        if (compareMarket) {
          params.append("compareMarkets", compareMarket);
        }
        
        // Add currency parameter
        if (selectedCurrency) {
          params.append("currency", selectedCurrency);
        }
        
        // Add unit parameter
        if (selectedUnit && selectedUnit !== "kg") {
          params.append("unit", selectedUnit);
        }
        
        // Add guest parameter for limited data
        if (isGuest) {
          params.append("guest", "true");
        }
        
        // Add country parameter
        if (currentCountry) {
          params.append("country", currentCountry);
        }

        const res = await fetch(
          `/api/products/${product.slug}/prices?${params.toString()}`
        );
        const data = await res.json();
        setChartData(data.data || []);
        setComparisonData(data.comparisonData || []);
        
        // Store currency info from response
        if (data.stats?.currency) {
          setCurrencyInfo(data.stats.currency);
        }
        setStats(data.stats);
        setFilters(data.filters);

        // Auto-select first available market type and market
        if (!selectedMarketType && data.filters?.marketTypes) {
          const retailType = data.filters.marketTypes.find(
            (mt: any) => mt.code === "RETAIL" && mt.hasData
          );
          const firstAvailable = data.filters.marketTypes.find(
            (mt: any) => mt.hasData
          );
          const typeToSelect = retailType || firstAvailable;
          
          if (typeToSelect) {
            setSelectedMarketType(typeToSelect.id);
          }
        }

        // Auto-select product type with most data (son 1 ayda ən çox qiymət olan)
        if (!selectedProductType && data.filters?.productTypes?.length > 0) {
          const typesWithData = data.filters.productTypes.filter((pt: any) => pt.hasData);
          if (typesWithData.length > 0) {
            // İlk data olan növü seç
            setSelectedProductType(typesWithData[0].id);
          }
        }
      } catch (error) {
        console.error("Error fetching prices:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPrices();
  }, [product.slug, selectedMarket, selectedMarketType, selectedProductType, dateRange, compareMarket, customStartYear, customStartMonth, customEndYear, customEndMonth, selectedCurrency, selectedUnit, isGuest, currentCountry]);

  // Auto-select first market when market type changes
  useEffect(() => {
    if (selectedMarketType && filters?.markets) {
      const marketsOfType = filters.markets.filter(
        (m: any) => m.marketTypeId === selectedMarketType && m.hasData
      );
      if (marketsOfType.length > 0 && !selectedMarket) {
        setSelectedMarket(marketsOfType[0].id);
      } else if (marketsOfType.length > 0 && !marketsOfType.find((m: any) => m.id === selectedMarket)) {
        setSelectedMarket(marketsOfType[0].id);
      }
    }
  }, [selectedMarketType, filters?.markets]);
  
  // Fetch country comparison data
  useEffect(() => {
    async function fetchComparisonData() {
      if (!compareCountry || !selectedMarketType) return;
      
      try {
        const params = new URLSearchParams({
          productSlug: product.slug,
          marketType: selectedMarketType,
          euCountry: compareCountry,
          currency: selectedCurrency
        });
        
        const res = await fetch(`/api/comparison?${params.toString()}`);
        const data = await res.json();
        setComparisonResult(data);
        setAvailableEuCountries(data.comparison?.availableEuCountries || []);
      } catch (error) {
        console.error("Error fetching comparison:", error);
      }
    }
    
    // Also fetch available EU countries when market type changes
    async function fetchAvailableCountries() {
      try {
        const params = new URLSearchParams({
          productSlug: product.slug,
          marketType: selectedMarketType || "RETAIL"
        });
        
        const res = await fetch(`/api/comparison?${params.toString()}`);
        const data = await res.json();
        setAvailableEuCountries(data.comparison?.availableEuCountries || []);
      } catch (error) {
        console.error("Error fetching available countries:", error);
      }
    }
    
    if (compareCountry) {
      fetchComparisonData();
    } else if (selectedMarketType) {
      fetchAvailableCountries();
    }
  }, [product.slug, compareCountry, selectedMarketType, selectedCurrency]);

  const latestPrice = stats?.latestPrice;
  const priceChanges = stats?.priceChanges;
  const marketTypeStats = stats?.marketTypeStats || [];

  // Müqayisə aktiv olub-olmadığını yoxla
  const isComparing = compareMarket !== "";

  // Get available markets for current market type
  const availableMarkets = useMemo(() => {
    if (!filters?.markets || !selectedMarketType) return [];
    return filters.markets.filter((m: any) => m.marketTypeId === selectedMarketType);
  }, [filters?.markets, selectedMarketType]);

  // Get all markets for comparison (bütün bazarlar, seçilmiş bazar xaric)
  const allMarketsForComparison = useMemo(() => {
    if (!filters?.markets) return [];
    return filters.markets.filter((m: any) => m.hasData && m.id !== selectedMarket);
  }, [filters?.markets, selectedMarket]);

  // Render trend icon
  const TrendIcon = ({ direction }: { direction: string }) => {
    if (direction === "up") return <TrendingUp className="w-4 h-4" />;
    if (direction === "down") return <TrendingDown className="w-4 h-4" />;
    return <Minus className="w-4 h-4" />;
  };

  // Render trend color
  const getTrendColor = (direction: string) => {
    if (direction === "up") return "text-red-600";
    if (direction === "down") return "text-green-600";
    return "text-slate-500";
  };

  // Ən ucuz və ən baha bazarları hesabla - FX conversion apply et
  const fxRate = currencyInfo?.fxRate || 1;
  
  const cheapestMarkets = useMemo(() => {
    if (!latestPrices || latestPrices.length === 0) return [];
    return [...latestPrices]
      .map(p => ({
        ...p,
        priceAvg: Number(p.priceAvg) * fxRate,
        priceMin: Number(p.priceMin) * fxRate,
        priceMax: Number(p.priceMax) * fxRate,
      }))
      .sort((a, b) => a.priceAvg - b.priceAvg)
      .slice(0, 5);
  }, [latestPrices, fxRate]);

  const expensiveMarkets = useMemo(() => {
    if (!latestPrices || latestPrices.length === 0) return [];
    return [...latestPrices]
      .map(p => ({
        ...p,
        priceAvg: Number(p.priceAvg) * fxRate,
        priceMin: Number(p.priceMin) * fxRate,
        priceMax: Number(p.priceMax) * fxRate,
      }))
      .sort((a, b) => b.priceAvg - a.priceAvg)
      .slice(0, 5);
  }, [latestPrices, fxRate]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          {/* Product Info Card */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                  <Package className="w-6 h-6 text-emerald-600" />
                </div>
                <div className="flex-1">
                  {/* Product dropdown */}
                  <Select 
                    value={product.slug} 
                    onValueChange={(slug) => router.push(`/products/${slug}`)}
                  >
                    <SelectTrigger className="h-auto w-auto border-0 p-0 text-xl font-bold text-slate-900 hover:bg-transparent focus:ring-0 shadow-none [&>svg]:h-4 [&>svg]:w-4 [&>svg]:text-slate-400">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {productsInCategory.map((p: any) => (
                        <SelectItem key={p.slug} value={p.slug}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  {/* Category dropdown */}
                  <Select 
                    value={product.category.id} 
                    onValueChange={(catId) => {
                      const cat = allCategories.find((c: any) => c.id === catId);
                      if (cat && cat.products?.[0]) {
                        router.push(`/products/${cat.products[0].slug}`);
                      }
                    }}
                  >
                    <SelectTrigger className="h-auto w-auto border-0 p-0 text-sm text-slate-500 hover:bg-transparent focus:ring-0 shadow-none mt-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-slate-400">
                      <SelectValue>{product.category.name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allCategories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                {/* Unit selector dropdown */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Ölçü vahidi</span>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger className="h-7 w-28 border-slate-200 text-sm">
                      <Package className="w-3 h-3 mr-1 text-slate-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {units.length > 0 ? (
                        units.map((unit: any) => (
                          <SelectItem key={unit.code} value={unit.code}>
                            {unit.code} ({unit.nameAz})
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="kg">kg (Kiloqram)</SelectItem>
                          <SelectItem value="100kg">100kg</SelectItem>
                          <SelectItem value="lb">lb (Funt)</SelectItem>
                          <SelectItem value="ton">t (Ton)</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Currency dropdown */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Valyuta</span>
                  <Select value={selectedCurrency} onValueChange={setSelectedCurrency}>
                    <SelectTrigger className="h-7 w-32 border-slate-200 text-sm">
                      <DollarSign className="w-3 h-3 mr-1 text-slate-400" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {currencies.length > 0 ? (
                        currencies.map((cur) => (
                          <SelectItem key={cur.code} value={cur.code}>
                            {cur.code}
                          </SelectItem>
                        ))
                      ) : (
                        <>
                          <SelectItem value="AZN">AZN</SelectItem>
                          <SelectItem value="USD">USD</SelectItem>
                          <SelectItem value="EUR">EUR</SelectItem>
                          <SelectItem value="RUB">RUB</SelectItem>
                          <SelectItem value="TRY">TRY</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Country dropdown */}
                <div className="flex items-center justify-between py-2 border-b border-slate-100">
                  <span className="text-slate-500">Ölkə</span>
                  <Select
                    value={currentCountry}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger className="h-7 w-32 border-slate-200 text-sm">
                      <Globe className="w-3 h-3 mr-1 text-slate-400" />
                      <SelectValue>{allCountries.find(c => c.iso2 === currentCountry)?.name || product.country?.name}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {allCountries.map((country: any) => (
                        <SelectItem key={country.iso2} value={country.iso2}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Bazarlar - yalnız Azərbaycan üçün */}
                {showMarketsFilter && (
                  <div className="flex items-center justify-between py-2">
                    <span className="text-slate-500">Bazarlar</span>
                    <span className="font-medium text-slate-900">
                      {markets.length}
                    </span>
                  </div>
                )}
              </div>

{/* Növləri bölməsi silindi - istifadəçi tələbi */}
            </CardContent>
          </Card>

          {/* Quick Links */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Sürətli keçidlər</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link
                href={`/dashboard/compare?product=${product.id}`}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50 text-sm text-slate-700 transition-colors"
              >
                <BarChart3 className="w-4 h-4 text-slate-400" />
                Müqayisə et
              </Link>
            </CardContent>
          </Card>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Əlaqəli məhsullar</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {relatedProducts.map((rp: any) => (
                  <Link
                    key={rp.id}
                    href={`/products/${rp.slug}`}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <span className="text-sm text-slate-700">{rp.name}</span>
                    <ArrowUpRight className="w-4 h-4 text-slate-400" />
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}

        </div>

        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Big Price Card - Selected Market */}
          <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-sm text-emerald-700">Son qiymət</p>
                    {latestPrice && (
                      <Badge variant="outline" className="text-xs bg-white">
                        {latestPrice.marketType} • {latestPrice.market}
                      </Badge>
                    )}
                  </div>
                  
                  {latestPrice ? (
                    <>
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-5xl font-bold text-emerald-800">
                          {formatConvertedPrice(latestPrice.priceAvg)}
                        </span>
                        {stats?.priceChange && (
                          <div
                            className={`flex items-center gap-1 text-lg font-medium ${getTrendColor(stats.priceChange.direction)}`}
                          >
                            <TrendIcon direction={stats.priceChange.direction} />
                            {Math.abs(stats.priceChange.percentage).toFixed(1)}%
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-emerald-600">
                        {formatDate(latestPrice.date)}
                      </p>
                      
                      {/* Min / Orta / Max inside big card */}
                      <div className="flex items-center gap-4 mt-4">
                        <div className="text-center px-4 py-2 bg-white/70 rounded-lg">
                          <p className="text-xs text-slate-500">Min</p>
                          <p className="font-semibold text-slate-900">
                            {formatConvertedPrice(latestPrice.priceMin)}
                          </p>
                        </div>
                        <div className="text-center px-4 py-2 bg-emerald-100 rounded-lg">
                          <p className="text-xs text-emerald-600">Orta</p>
                          <p className="font-semibold text-emerald-700">
                            {formatConvertedPrice(latestPrice.priceAvg)}
                          </p>
                        </div>
                        <div className="text-center px-4 py-2 bg-white/70 rounded-lg">
                          <p className="text-xs text-slate-500">Max</p>
                          <p className="font-semibold text-slate-900">
                            {formatConvertedPrice(latestPrice.priceMax)}
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-slate-500">Qiymət məlumatı yoxdur</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Type Stats Cards - 4 cards */}
          {marketTypeStats.length > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {marketTypeStats.map((mts: any) => {
                const IconComponent = marketTypeIcons[mts.marketTypeCode] || Store;
                const colorClass = marketTypeColors[mts.marketTypeCode] || "bg-slate-50 text-slate-700 border-slate-200";
                
                return (
                  <Card key={mts.marketTypeId} className={`border ${colorClass.split(" ")[2]}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`p-2 rounded-lg ${colorClass.split(" ").slice(0, 2).join(" ")}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-sm font-medium truncate">{mts.marketTypeName}</span>
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-slate-900">
                          {mts.avgPrice.toFixed(2)} {currencyInfo?.code || "AZN"}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{mts.minPrice.toFixed(2)}</span>
                          <span>-</span>
                          <span>{mts.maxPrice.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {formatDate(mts.date)} • {mts.marketCount} bazar
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Price Change Cards - YALNIZ müqayisə olmadıqda göstər */}
          {!isComparing && (
            <div className="grid grid-cols-3 gap-4">
              {/* 30 days */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 mb-2">Son 30 gün</p>
                  {priceChanges?.days30 ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getTrendColor(priceChanges.days30.direction)}`}>
                        {priceChanges.days30.percentage > 0 ? "+" : ""}
                        {priceChanges.days30.percentage.toFixed(1)}%
                      </span>
                      <TrendIcon direction={priceChanges.days30.direction} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Məlumat yoxdur</p>
                  )}
                </CardContent>
              </Card>

              {/* 6 months */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 mb-2">Son 6 ay</p>
                  {priceChanges?.months6 ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getTrendColor(priceChanges.months6.direction)}`}>
                        {priceChanges.months6.percentage > 0 ? "+" : ""}
                        {priceChanges.months6.percentage.toFixed(1)}%
                      </span>
                      <TrendIcon direction={priceChanges.months6.direction} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Məlumat yoxdur</p>
                  )}
                </CardContent>
              </Card>

              {/* 1 year */}
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs text-slate-500 mb-2">Son 1 il</p>
                  {priceChanges?.year1 ? (
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl font-bold ${getTrendColor(priceChanges.year1.direction)}`}>
                        {priceChanges.year1.percentage > 0 ? "+" : ""}
                        {priceChanges.year1.percentage.toFixed(1)}%
                      </span>
                      <TrendIcon direction={priceChanges.year1.direction} />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400">Məlumat yoxdur</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Chart Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <div>
                <CardTitle>Qiymət dinamikası</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  {stats?.totalRecords || 0} qeyd
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Data Source Filter - always show */}
                <Select 
                  value={selectedDataSource} 
                  onValueChange={(v) => {
                    setSelectedDataSource(v);
                    // Reset market filters when changing data source
                    if (v !== "AGRO_AZ") {
                      setSelectedMarketType("");
                      setSelectedMarket("");
                    }
                  }}
                >
                  <SelectTrigger className="w-44">
                    <Globe className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue placeholder="Data mənbəyi" />
                  </SelectTrigger>
                  <SelectContent>
                    {DATA_SOURCES.map((source) => (
                      <SelectItem key={source.code} value={source.code}>
                        {source.icon} {source.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Market Type Filter - yalnız AZ + AGRO_AZ üçün */}
                {showMarketsFilter && (
                  <Select 
                    value={selectedMarketType || "all"} 
                    onValueChange={(v) => {
                      setSelectedMarketType(v === "all" ? "" : v);
                      setSelectedMarket("");
                    }}
                  >
                    <SelectTrigger className="w-40">
                      <Store className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Bazar növü" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Bütün növlər</SelectItem>
                      {filters?.marketTypes?.map((mt: any) => (
                        <SelectItem 
                          key={mt.id} 
                          value={mt.id}
                          disabled={!mt.hasData}
                        >
                          {mt.name} {!mt.hasData && "(yoxdur)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Market Filter - yalnız AZ üçün */}
                {showMarketsFilter && (
                  <Select 
                    value={selectedMarket || "all"} 
                    onValueChange={(v) => setSelectedMarket(v === "all" ? "" : v)}
                  >
                    <SelectTrigger className="w-44">
                      <MapPin className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Bazar seç" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Bütün bazarlar</SelectItem>
                      {availableMarkets.map((m: any) => (
                        <SelectItem 
                          key={m.id} 
                          value={m.id}
                          disabled={!m.hasData}
                        >
                          {m.name} {!m.hasData && "(yoxdur)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Product Type Filter - HƏMİŞƏ görünsün, "Hamısı" olmasın */}
                {filters?.productTypes && filters.productTypes.length > 0 && (
                  <Select 
                    value={selectedProductType} 
                    onValueChange={setSelectedProductType}
                  >
                    <SelectTrigger className="w-36">
                      <Package className="w-4 h-4 mr-2 text-slate-400" />
                      <SelectValue placeholder="Növ seç" />
                    </SelectTrigger>
                    <SelectContent>
                      {filters.productTypes
                        .filter((pt: any) => pt.hasData)
                        .map((pt: any) => (
                          <SelectItem key={pt.id} value={pt.id}>
                            {pt.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Date Range */}
                <Select 
                  value={dateRange} 
                  onValueChange={(v) => {
                    setDateRange(v);
                    if (v === "custom") {
                      setShowCustomRange(true);
                      // Set defaults for custom range
                      const now = new Date();
                      setCustomEndYear(now.getFullYear().toString());
                      setCustomEndMonth(String(now.getMonth() + 1).padStart(2, "0"));
                      setCustomStartYear("2020");
                      setCustomStartMonth("01");
                    } else {
                      setShowCustomRange(false);
                    }
                  }}
                >
                  <SelectTrigger className="w-28">
                    <Calendar className="w-4 h-4 mr-2 text-slate-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1m">1 ay</SelectItem>
                    <SelectItem value="3m">3 ay</SelectItem>
                    <SelectItem value="6m">6 ay</SelectItem>
                    <SelectItem value="1y">1 il</SelectItem>
                    <SelectItem value="custom">Özün seç</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" size="icon">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            
            {/* Custom Date Range Picker */}
            {showCustomRange && (
              <div className="px-6 pb-4 border-t border-slate-100 pt-4">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4" />
                    <span>Tarix aralığı:</span>
                  </div>
                  
                  {/* Start Date */}
                  <div className="flex items-center gap-2">
                    <Select value={customStartYear} onValueChange={setCustomStartYear}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="İl" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => 2020 + i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={customStartMonth} onValueChange={setCustomStartMonth}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Ay" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          { value: "01", label: "Yanvar" },
                          { value: "02", label: "Fevral" },
                          { value: "03", label: "Mart" },
                          { value: "04", label: "Aprel" },
                          { value: "05", label: "May" },
                          { value: "06", label: "İyun" },
                          { value: "07", label: "İyul" },
                          { value: "08", label: "Avqust" },
                          { value: "09", label: "Sentyabr" },
                          { value: "10", label: "Oktyabr" },
                          { value: "11", label: "Noyabr" },
                          { value: "12", label: "Dekabr" },
                        ].map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <span className="text-slate-400">—</span>
                  
                  {/* End Date */}
                  <div className="flex items-center gap-2">
                    <Select value={customEndYear} onValueChange={setCustomEndYear}>
                      <SelectTrigger className="w-24">
                        <SelectValue placeholder="İl" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => 2020 + i).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={customEndMonth} onValueChange={setCustomEndMonth}>
                      <SelectTrigger className="w-28">
                        <SelectValue placeholder="Ay" />
                      </SelectTrigger>
                      <SelectContent>
                        {[
                          { value: "01", label: "Yanvar" },
                          { value: "02", label: "Fevral" },
                          { value: "03", label: "Mart" },
                          { value: "04", label: "Aprel" },
                          { value: "05", label: "May" },
                          { value: "06", label: "İyun" },
                          { value: "07", label: "İyul" },
                          { value: "08", label: "Avqust" },
                          { value: "09", label: "Sentyabr" },
                          { value: "10", label: "Oktyabr" },
                          { value: "11", label: "Noyabr" },
                          { value: "12", label: "Dekabr" },
                        ].map((month) => (
                          <SelectItem key={month.value} value={month.value}>
                            {month.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

{/* Müqayisə dropdown silindi - istifadəçi tələbi. Aşağıdakı multi-source comparison istifadə olunur */}

            <CardContent>
              {isGuest ? (
                // Guest user - show login prompt instead of chart
                <div className="h-[400px] relative">
                  {/* Blurred preview background */}
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-100 to-slate-200 rounded-lg overflow-hidden">
                    <div className="w-full h-full flex items-end justify-center pb-12 opacity-30">
                      <svg viewBox="0 0 400 150" className="w-full h-32">
                        <path
                          d="M 0 100 Q 50 60 100 80 T 200 70 T 300 90 T 400 60"
                          fill="none"
                          stroke="#10b981"
                          strokeWidth="3"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  {/* Login overlay */}
                  <div className="absolute inset-0 backdrop-blur-sm bg-white/70 flex flex-col items-center justify-center rounded-lg">
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-200 text-center max-w-sm">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">
                        Detallı qiymət qrafiki
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Qiymət tendensiyalarını, müqayisələri və detallı analizləri görmək üçün hesabınıza daxil olun.
                      </p>
                      <div className="flex gap-3 justify-center">
                        <Button asChild>
                          <Link href="/login">Daxil ol</Link>
                        </Button>
                        <Button variant="outline" asChild>
                          <Link href="/register">Qeydiyyat</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : loading ? (
                <div className="h-[400px] flex flex-col items-center justify-center gap-3">
                  <div className="animate-spin w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full" />
                  <p className="text-sm text-slate-500">Qiymət məlumatları yüklənir...</p>
                </div>
              ) : chartData.length > 0 ? (
                <PriceChart 
                  data={chartData} 
                  comparisonData={comparisonData}
                  showRange={!isComparing} 
                  height={400} 
                  currency={`${currencyInfo?.code || "AZN"}/${selectedUnit}`}
                />
              ) : (
                <div className="h-[400px] flex items-center justify-center text-slate-500">
                  Bu dövr üçün məlumat yoxdur
                </div>
              )}
            </CardContent>
          </Card>

          {/* Çox Mənbəli Müqayisə (v2 API) */}
          <MultiSourceComparison
            productSlug={product.slug}
            productName={product.name}
            targetCurrency={selectedCurrency}
            targetUnit={selectedUnit}
          />

          {/* Bazar Qiymətləri - 2 Kart: Ən ucuz 5 və Ən baha 5 */}
          {isGuest ? (
            // Guest user - show login prompt
            <Card>
              <CardContent className="p-8">
                <div className="relative">
                  {/* Blurred preview */}
                  <div className="opacity-20 grid grid-cols-2 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 bg-slate-200 rounded-lg" />
                    ))}
                  </div>
                  
                  {/* Login overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="p-4 bg-white rounded-xl shadow-lg border border-slate-200 text-center max-w-sm">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-emerald-600" />
                      </div>
                      <h3 className="font-bold text-slate-900 mb-2">
                        Bazar qiymətləri müqayisəsi
                      </h3>
                      <p className="text-sm text-slate-600 mb-4">
                        Ən ucuz və ən baha bazarları görmək üçün hesabınıza daxil olun.
                      </p>
                      <Button asChild size="sm">
                        <Link href="/login">Daxil ol</Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ən ucuz 5 bazar */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-50">
                      <ArrowDown className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Ən ucuz 5 bazar</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        {currencyInfo?.code || "AZN"}/{product.unit}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {cheapestMarkets.length > 0 ? (
                    <div className="space-y-2">
                      {cheapestMarkets.map((price, idx) => (
                        <div
                          key={price.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-green-600 w-6">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">
                                {price.market.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {price.market.marketType?.nameAz || "Pərakəndə"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {formatConvertedPrice(Number(price.priceAvg))}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatShortDate(price.date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-4">Məlumat yoxdur</p>
                  )}
                </CardContent>
                
                {/* Data source info */}
                {cheapestMarkets.length > 0 && (
                  <div className="px-6 pb-4">
                    <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                      Məlumat mənbəyi: Azərbaycan Respublikası Kənd Təsərrüfatı Nazirliyi bazarları. 
                      Məlumat dövrü: {stats?.dateRange?.from ? formatShortDate(stats.dateRange.from) : "N/A"} - {stats?.dateRange?.to ? formatShortDate(stats.dateRange.to) : "N/A"}
                    </p>
                  </div>
                )}
              </Card>

              {/* Ən baha 5 bazar */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-red-50">
                      <ArrowUp className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Ən baha 5 bazar</CardTitle>
                      <p className="text-xs text-slate-500 mt-1">
                        {currencyInfo?.code || "AZN"}/{product.unit}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {expensiveMarkets.length > 0 ? (
                    <div className="space-y-2">
                      {expensiveMarkets.map((price, idx) => (
                        <div
                          key={price.id}
                          className="flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-red-600 w-6">
                              #{idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-slate-900 text-sm">
                                {price.market.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {price.market.marketType?.nameAz || "Pərakəndə"}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600">
                              {formatConvertedPrice(Number(price.priceAvg))}
                            </p>
                            <p className="text-xs text-slate-400">
                              {formatShortDate(price.date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-slate-500 py-4">Məlumat yoxdur</p>
                  )}
                </CardContent>
                
                {/* Data source info */}
                {expensiveMarkets.length > 0 && (
                  <div className="px-6 pb-4">
                    <p className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                      Məlumat mənbəyi: Azərbaycan Respublikası Kənd Təsərrüfatı Nazirliyi bazarları. 
                      Məlumat dövrü: {stats?.dateRange?.from ? formatShortDate(stats.dateRange.from) : "N/A"} - {stats?.dateRange?.to ? formatShortDate(stats.dateRange.to) : "N/A"}
                    </p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Rich Content Section - Tridge Style */}
          {productInfo && (productInfo.descriptionAz || productInfo.history || productInfo.uses) && (
            <div className="mt-8 space-y-6">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-emerald-600" />
                {product.name} haqqında
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Description */}
                {productInfo.descriptionAz && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-blue-600" />
                        Ümumi məlumat
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">{productInfo.descriptionAz}</p>
                    </CardContent>
                  </Card>
                )}

                {/* History */}
                {productInfo.history && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-600" />
                        Tarix
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">{productInfo.history}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Uses */}
                {productInfo.uses && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Store className="w-4 h-4 text-orange-600" />
                        İstifadə sahələri
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">{productInfo.uses}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Nutrition */}
                {productInfo.nutrition && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-green-600" />
                        Qida dəyəri
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">{productInfo.nutrition}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Varieties */}
                {productInfo.varieties && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Package className="w-4 h-4 text-teal-600" />
                        Növləri
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">{productInfo.varieties}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Seasonality */}
                {productInfo.seasonality && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-amber-600" />
                        Mövsüm
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">{productInfo.seasonality}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Storage */}
                {productInfo.storage && (
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Warehouse className="w-4 h-4 text-slate-600" />
                        Saxlanma şəraiti
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-600 leading-relaxed">{productInfo.storage}</p>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Trade Codes */}
              {(productInfo.faoCode || productInfo.hsCode || productInfo.eurostatCode) && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Beynəlxalq kodlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4">
                      {productInfo.faoCode && (
                        <div className="px-4 py-2 bg-slate-50 rounded-lg">
                          <span className="text-xs text-slate-500">FAO</span>
                          <p className="font-mono font-medium">{productInfo.faoCode}</p>
                        </div>
                      )}
                      {productInfo.hsCode && (
                        <div className="px-4 py-2 bg-slate-50 rounded-lg">
                          <span className="text-xs text-slate-500">HS Kodu</span>
                          <p className="font-mono font-medium">{productInfo.hsCode}</p>
                        </div>
                      )}
                      {productInfo.eurostatCode && (
                        <div className="px-4 py-2 bg-slate-50 rounded-lg">
                          <span className="text-xs text-slate-500">Eurostat</span>
                          <p className="font-mono font-medium">{productInfo.eurostatCode}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
