"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe, TrendingUp, TrendingDown, Minus, Info, ArrowRight } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";
import { format } from "date-fns";

interface AvailableCountry {
  code: string;
  name: string;
  flag?: string;
  type: "az" | "eu";
}

interface ComparisonApiResponse {
  product: { slug: string; nameAz: string; nameEn: string };
  marketType: { code: string; name: string; euEquivalent: string };
  currency: { code: string; symbol: string; fxRate: number };
  az: {
    chartData: { date: string; avgPrice: number; minPrice: number; maxPrice: number }[];
    latestPrice: { avgPrice: number; date: string } | null;
    dataCount: number;
  };
  eu: {
    country: { code: string; name: string } | null;
    chartData: { date: string; avgPrice: number }[];
    latestPrice: { avgPrice: number; date: string } | null;
    dataCount: number;
  };
  comparison: {
    priceDifference: { absolute: number; percentage: number; azHigher: boolean } | null;
    availableEuCountries: AvailableCountry[];
  };
}

interface EuComparisonProps {
  productId: string;
  productName: string;
  marketTypeCode: string;
  className?: string;
}

// Country flag emoji from ISO code
function getFlagEmoji(countryCode: string) {
  try {
    const codePoints = countryCode
      .toUpperCase()
      .split("")
      .map(char => 127397 + char.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌍";
  }
}

export function EuComparison({ 
  productId, 
  productName,
  marketTypeCode,
  className = ""
}: EuComparisonProps) {
  const [availableCountries, setAvailableCountries] = useState<AvailableCountry[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string>("");
  const [comparisonData, setComparisonData] = useState<ComparisonApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  // Fetch available countries for comparison
  useEffect(() => {
    async function fetchCountries() {
      try {
        // First, get global product slug from product ID
        const res = await fetch(`/api/products/${productId}/slug`);
        if (!res.ok) throw new Error("Could not get product slug");
        const { slug } = await res.json();
        
        // Then fetch available countries
        const compRes = await fetch(`/api/comparison?productSlug=${slug}&marketType=${marketTypeCode}`);
        if (!compRes.ok) throw new Error("Could not fetch comparison data");
        const data = await compRes.json();
        
        const countries = data.comparison?.availableEuCountries || [];
        setAvailableCountries(countries);
      } catch (error) {
        console.error("Error fetching countries:", error);
        // Try fallback to fetch EU countries directly
        try {
          const res = await fetch("/api/eu/countries");
          const data = await res.json();
          const euCountries = (data.data || []).map((c: any) => ({
            code: c.code,
            name: c.nameAz || c.nameEn,
            flag: getFlagEmoji(c.code),
            type: "eu" as const
          }));
          
          // Add AZ at the beginning
          setAvailableCountries([
            { code: "AZ", name: "Azərbaycan", flag: "🇦🇿", type: "az" },
            ...euCountries
          ]);
        } catch (e) {
          console.error("Fallback failed:", e);
        }
      } finally {
        setInitialLoading(false);
      }
    }
    
    fetchCountries();
  }, [productId, marketTypeCode]);

  // Fetch comparison data when country is selected
  useEffect(() => {
    async function fetchComparison() {
      if (!selectedCountry || selectedCountry === "AZ") {
        setComparisonData(null);
        return;
      }
      
      setLoading(true);
      try {
        // Get product slug first
        const slugRes = await fetch(`/api/products/${productId}/slug`);
        if (!slugRes.ok) throw new Error("Could not get product slug");
        const { slug } = await slugRes.json();
        
        const res = await fetch(
          `/api/comparison?productSlug=${slug}&marketType=${marketTypeCode}&euCountry=${selectedCountry}`
        );
        if (!res.ok) throw new Error("Comparison fetch failed");
        const data = await res.json();
        setComparisonData(data);
      } catch (error) {
        console.error("Error fetching comparison:", error);
        setComparisonData(null);
      } finally {
        setLoading(false);
      }
    }
    
    fetchComparison();
  }, [productId, selectedCountry, marketTypeCode]);

  // If still loading, show skeleton
  if (initialLoading) {
    return (
      <Card className={`border-blue-200 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Başqa ölkə ilə müqayisə</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no countries available, show message
  if (availableCountries.length === 0) {
    return (
      <Card className={`border-slate-200 ${className}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-slate-400" />
            <CardTitle className="text-lg text-slate-500">Başqa ölkə ilə müqayisə</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-slate-400">
            <Info className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>Bu məhsul üçün müqayisə datası mövcud deyil</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Prepare chart data
  const chartData = comparisonData ? (() => {
    const allDates = new Set<string>();
    
    comparisonData.az.chartData.forEach(d => {
      allDates.add(format(new Date(d.date), "yyyy-MM"));
    });
    
    comparisonData.eu.chartData.forEach(d => {
      allDates.add(format(new Date(d.date), "yyyy-MM"));
    });
    
    const sortedDates = Array.from(allDates).sort();
    
    return sortedDates.map(dateKey => {
      const azPoint = comparisonData.az.chartData.find(d => 
        format(new Date(d.date), "yyyy-MM") === dateKey
      );
      const euPoint = comparisonData.eu.chartData.find(d => 
        format(new Date(d.date), "yyyy-MM") === dateKey
      );
      
      return {
        date: dateKey,
        azPrice: azPoint?.avgPrice || null,
        euPrice: euPoint?.avgPrice || null,
      };
    });
  })() : [];

  const selectedCountryData = availableCountries.find(c => c.code === selectedCountry);

  return (
    <Card className={`border-blue-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <CardTitle className="text-lg">Başqa ölkə ilə müqayisə</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {marketTypeCode === "RETAIL" ? "Pərakəndə" : 
             marketTypeCode === "WHOLESALE" ? "Topdansatış" : 
             marketTypeCode === "FIELD" ? "Fermadan satış" : "İstehsalçı"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Country Selector */}
        <div>
          <label className="text-sm text-slate-500 mb-2 block">
            Müqayisə üçün ölkə seçin
          </label>
          <Select value={selectedCountry} onValueChange={setSelectedCountry}>
            <SelectTrigger>
              <SelectValue placeholder="Ölkə seçin..." />
            </SelectTrigger>
            <SelectContent>
              {availableCountries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  <span className="flex items-center gap-2">
                    <span>{country.flag || getFlagEmoji(country.code)}</span>
                    <span>{country.name}</span>
                    {country.type === "az" && (
                      <Badge variant="secondary" className="text-[10px] ml-1">Əsas</Badge>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-slate-500">
            <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
            Yüklənir...
          </div>
        )}

        {/* No Data State */}
        {!loading && selectedCountry && comparisonData && comparisonData.eu.dataCount === 0 && (
          <div className="text-center py-6 text-slate-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p>Bu məhsul üçün seçilmiş ölkədə data mövcud deyil</p>
          </div>
        )}

        {/* Comparison Results */}
        {!loading && comparisonData && comparisonData.comparison.priceDifference && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="bg-emerald-50/50 border-emerald-200">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-emerald-600 mb-1">🇦🇿 Azərbaycan</p>
                  <p className="text-xl font-bold text-emerald-700">
                    {comparisonData.az.latestPrice?.avgPrice.toFixed(2)} {comparisonData.currency.symbol}
                  </p>
                  <p className="text-xs text-slate-500">
                    {comparisonData.marketType.name}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="bg-blue-50/50 border-blue-200">
                <CardContent className="p-3 text-center">
                  <p className="text-xs text-blue-600 mb-1">
                    {getFlagEmoji(selectedCountry)} {selectedCountryData?.name || selectedCountry}
                  </p>
                  <p className="text-xl font-bold text-blue-700">
                    {comparisonData.eu.latestPrice?.avgPrice.toFixed(2)} {comparisonData.currency.symbol}
                  </p>
                  <p className="text-xs text-slate-500">
                    {comparisonData.marketType.euEquivalent}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Difference */}
            <div className="flex items-center justify-center gap-3 py-2">
              <div className={`flex items-center gap-1 px-3 py-1.5 rounded-full ${
                comparisonData.comparison.priceDifference.azHigher 
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}>
                {comparisonData.comparison.priceDifference.azHigher ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {comparisonData.comparison.priceDifference.azHigher ? "+" : ""}
                  {comparisonData.comparison.priceDifference.percentage.toFixed(1)}%
                </span>
              </div>
              <span className="text-sm text-slate-500">
                AZ qiymət {comparisonData.comparison.priceDifference.azHigher ? "daha baha" : "daha ucuz"}
              </span>
            </div>

            {/* Chart */}
            {chartData.length > 0 && (
              <div className="h-56 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(v) => {
                        const [year, month] = v.split("-");
                        return `${month}/${year.slice(2)}`;
                      }}
                    />
                    <YAxis tick={{ fontSize: 10 }} width={45} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        `${value?.toFixed(2) || "-"} ${comparisonData.currency.symbol}`,
                        name === "azPrice" ? "🇦🇿 Azərbaycan" : `${getFlagEmoji(selectedCountry)} ${selectedCountryData?.name}`
                      ]}
                      labelFormatter={(label) => {
                        try {
                          return format(new Date(label + "-01"), "MMMM yyyy");
                        } catch {
                          return label;
                        }
                      }}
                    />
                    <Legend 
                      formatter={(value) => value === "azPrice" ? "🇦🇿 Azərbaycan" : `${getFlagEmoji(selectedCountry)} ${selectedCountryData?.name}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="azPrice" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                    <Line 
                      type="monotone" 
                      dataKey="euPrice" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                      strokeDasharray="5 5"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Source Note */}
            <div className="text-xs text-slate-400 text-center pt-2 border-t">
              Mənbə: agro.gov.az, Eurostat, EC Agri-food Portal | 
              {comparisonData.currency.code !== "AZN" && ` ${comparisonData.currency.code}/AZN: ${comparisonData.currency.fxRate.toFixed(4)}`}
            </div>
          </>
        )}

        {/* Initial State */}
        {!selectedCountry && !loading && (
          <div className="text-center py-6 text-slate-400">
            <Globe className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>Müqayisə üçün ölkə seçin</p>
            <p className="text-xs mt-1">
              {availableCountries.length} ölkə mövcuddur
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
