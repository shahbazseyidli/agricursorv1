"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  Globe,
  Database,
  Plus,
  X,
  TrendingUp,
  Loader2,
  Store,
  Warehouse,
  Tractor,
  Building2,
  Calendar,
  ExternalLink,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Data source info with full descriptions
const DATA_SOURCES: Record<string, { 
  name: string; 
  color: string; 
  shortName: string;
  fullName: string;
  url: string;
  description: string;
}> = {
  AGRO_AZ: { 
    name: "Agro.gov.az", 
    color: "#10B981", 
    shortName: "AZ Local",
    fullName: "Azərbaycan Kənd Təsərrüfatı Nazirliyi",
    url: "https://agro.gov.az",
    description: "Azərbaycan bazarlarından toplanan qiymət məlumatları"
  },
  EUROSTAT: { 
    name: "EUROSTAT", 
    color: "#3B82F6", 
    shortName: "EU",
    fullName: "Avropa Statistika Ofisi",
    url: "https://ec.europa.eu/eurostat",
    description: "Avropa İttifaqı ölkələrinin rəsmi statistikası"
  },
  FAOSTAT: { 
    name: "FAOSTAT", 
    color: "#F59E0B", 
    shortName: "FAO",
    fullName: "FAO Statistika Bazası",
    url: "https://www.fao.org/faostat",
    description: "BMT Ərzaq və Kənd Təsərrüfatı Təşkilatının qlobal məlumatları"
  },
};

// Market type options (for AGRO_AZ)
const MARKET_TYPES = [
  { code: "FARMGATE", name: "Sahə qiyməti", icon: Tractor },
  { code: "RETAIL", name: "Pərakəndə", icon: Store },
  { code: "WHOLESALE", name: "Topdan", icon: Warehouse },
  { code: "PROCESSING", name: "Emal", icon: Building2 },
];

// Price stage options (for EU/FAO - currently only PRODUCER)
const PRICE_STAGES = [
  { code: "PRODUCER", name: "İstehsalçı qiyməti" },
];

// Year range options
const YEAR_RANGES = [
  { label: "1 il", years: 1 },
  { label: "3 il", years: 3 },
  { label: "5 il", years: 5 },
  { label: "10 il", years: 10 },
  { label: "Hamısı", years: 50 },
];

// Line colors for chart
const LINE_COLORS = [
  "#10B981", // green
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#84CC16", // lime
];

interface Country {
  code: string;
  name: string;
  nameAz: string;
  flag: string;
  dataSources: {
    code: string;
    name: string;
    hasData: boolean;
    currency: string;
    unit: string;
  }[];
}

interface Selection {
  id: string;
  countryCode: string;
  dataSource: string;
  marketType: string; // For AGRO_AZ
  priceStage: string; // For EU/FAO
}

interface ConversionRates {
  currencies: Record<string, { rateToAZN: number; code: string; symbol: string }>;
  units: Record<string, { conversionRate: number; code: string; baseUnit: string }>;
}

interface MultiSourceComparisonProps {
  productSlug: string;
  productName: string;
  targetCurrency: string;
  targetUnit: string;
}

export function MultiSourceComparison({
  productSlug,
  productName,
  targetCurrency,
  targetUnit,
}: MultiSourceComparisonProps) {
  const [countries, setCountries] = useState<Country[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);
  const [seriesInfo, setSeriesInfo] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [conversionRates, setConversionRates] = useState<ConversionRates | null>(null);
  
  // Year range state
  const [selectedYearRange, setSelectedYearRange] = useState<number>(5);
  const [customYearFrom, setCustomYearFrom] = useState<string>("");
  const [customYearTo, setCustomYearTo] = useState<string>("");

  // Calculate year range
  const currentYear = new Date().getFullYear();
  const yearFrom = customYearFrom ? parseInt(customYearFrom) : currentYear - selectedYearRange;
  const yearTo = customYearTo ? parseInt(customYearTo) : currentYear;

  // Fetch available countries and their data sources
  useEffect(() => {
    async function fetchCountries() {
      try {
        const res = await fetch(`/api/v2/countries?product=${productSlug}`);
        const data = await res.json();
        if (data.success) {
          setCountries(data.data || []);
        }
      } catch (e) {
        console.error("Failed to fetch countries:", e);
      } finally {
        setLoadingCountries(false);
      }
    }
    fetchCountries();
  }, [productSlug]);

  // Fetch conversion rates
  useEffect(() => {
    async function fetchRates() {
      try {
        const res = await fetch("/api/conversion-rates");
        const data = await res.json();
        if (data.success) {
          setConversionRates(data.data);
        }
      } catch (e) {
        console.error("Failed to fetch conversion rates:", e);
      }
    }
    fetchRates();
  }, []);

  // Add new comparison selection
  const addSelection = () => {
    const id = Date.now().toString();
    setSelections((prev) => [...prev, { 
      id, 
      countryCode: "", 
      dataSource: "", 
      marketType: "FARMGATE",
      priceStage: "PRODUCER"
    }]);
  };

  // Remove selection
  const removeSelection = (id: string) => {
    setSelections((prev) => prev.filter((s) => s.id !== id));
  };

  // Update selection
  const updateSelection = (id: string, field: keyof Selection, value: string) => {
    setSelections((prev) =>
      prev.map((s) => {
        if (s.id !== id) return s;
        
        if (field === "countryCode") {
          // Reset data source when country changes
          return { ...s, countryCode: value, dataSource: "", marketType: "FARMGATE", priceStage: "PRODUCER" };
        }
        
        if (field === "dataSource") {
          // Auto-set defaults when data source changes
          if (value === "AGRO_AZ") {
            return { ...s, dataSource: value, marketType: "FARMGATE" };
          } else {
            return { ...s, dataSource: value, priceStage: "PRODUCER" };
          }
        }
        
        return { ...s, [field]: value };
      })
    );
  };

  // Get available data sources for a country
  const getDataSourcesForCountry = (countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode);
    return country?.dataSources || [];
  };

  // Convert price to target currency and unit
  const convertPrice = (
    price: number,
    fromCurrency: string,
    fromUnit: string
  ): number => {
    if (!conversionRates) return price;

    const fromCurrencyRate = conversionRates.currencies[fromCurrency]?.rateToAZN || 1;
    const toCurrencyRate = conversionRates.currencies[targetCurrency]?.rateToAZN || 1;
    const fromUnitRate = conversionRates.units[fromUnit]?.conversionRate || 1;
    const toUnitRate = conversionRates.units[targetUnit]?.conversionRate || 1;

    const priceInAZN = price / fromCurrencyRate;
    const priceInTargetCurrency = priceInAZN * toCurrencyRate;
    const pricePerBaseUnit = priceInTargetCurrency * fromUnitRate;
    const finalPrice = pricePerBaseUnit / toUnitRate;

    return finalPrice;
  };

  // Fetch comparison data
  const fetchComparison = async () => {
    const validSelections = selections.filter(
      (s) => s.countryCode && s.dataSource
    );
    if (validSelections.length === 0) {
      setChartData([]);
      setSeriesInfo({});
      return;
    }

    setLoading(true);
    try {
      // Group by market type for the API call
      // For now, we'll use the first AGRO_AZ selection's marketType
      const agroAzSelection = validSelections.find(s => s.dataSource === "AGRO_AZ");
      const marketType = agroAzSelection?.marketType || "FARMGATE";

      const selectionsParam = encodeURIComponent(
        JSON.stringify(
          validSelections.map((s) => ({
            countryCode: s.countryCode,
            dataSource: s.dataSource,
          }))
        )
      );

      const res = await fetch(
        `/api/v2/comparison?product=${productSlug}&selections=${selectionsParam}&periodType=ANNUAL&marketType=${marketType}&yearFrom=${yearFrom}&yearTo=${yearTo}`
      );
      const data = await res.json();

      if (data.success && data.data?.series) {
        // Process series data
        const seriesMap: Record<string, any> = {};
        const allYears = new Set<number>();

        for (const series of data.data.series) {
          const key = `${series.countryCode}_${series.dataSource}`;
          const sourceInfo = DATA_SOURCES[series.dataSource];
          
          seriesMap[key] = {
            name: `${series.countryName} (${sourceInfo?.shortName || series.dataSource})`,
            fullSourceName: sourceInfo?.fullName || series.dataSource,
            sourceUrl: sourceInfo?.url,
            currency: series.currency,
            unit: series.unit,
            dataSource: series.dataSource,
            countryName: series.countryName,
          };

          for (const point of series.data) {
            allYears.add(point.year);
          }
        }

        setSeriesInfo(seriesMap);

        // Build chart data
        const sortedYears = Array.from(allYears).sort((a, b) => a - b);
        const newChartData = sortedYears.map((year) => {
          const point: any = { year };

          for (const series of data.data.series) {
            const key = `${series.countryCode}_${series.dataSource}`;
            const pricePoint = series.data.find((p: any) => p.year === year);

            if (pricePoint) {
              const convertedPrice = convertPrice(
                pricePoint.price,
                series.currency,
                series.unit
              );
              point[key] = Math.round(convertedPrice * 100) / 100;
            }
          }

          return point;
        });

        setChartData(newChartData);
      }
    } catch (e) {
      console.error("Failed to fetch comparison:", e);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when selections or year range change
  useEffect(() => {
    const validSelections = selections.filter(
      (s) => s.countryCode && s.dataSource
    );
    if (validSelections.length > 0) {
      fetchComparison();
    } else {
      setChartData([]);
      setSeriesInfo({});
    }
  }, [selections, targetCurrency, targetUnit, conversionRates, yearFrom, yearTo]);

  // Get series keys for chart
  const seriesKeys = Object.keys(seriesInfo);

  // Get unique data sources used
  const usedDataSources = [...new Set(Object.values(seriesInfo).map((s: any) => s.dataSource))];

  return (
    <Card className="mt-6">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Globe className="w-5 h-5 text-blue-600" />
          Ölkələrarası Müqayisə
        </CardTitle>
        <p className="text-sm text-slate-500">
          Müxtəlif ölkələrin data mənbələrindən qiymətləri müqayisə edin
        </p>
      </CardHeader>
      <CardContent>
        {/* Year Range Selector */}
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">Tarix aralığı:</span>
          </div>
          <div className="flex gap-1">
            {YEAR_RANGES.map((range) => (
              <Button
                key={range.years}
                variant={selectedYearRange === range.years && !customYearFrom ? "default" : "outline"}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => {
                  setSelectedYearRange(range.years);
                  setCustomYearFrom("");
                  setCustomYearTo("");
                }}
              >
                {range.label}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="Başlanğıc"
              className="w-20 h-7 px-2 text-xs border rounded"
              value={customYearFrom}
              onChange={(e) => setCustomYearFrom(e.target.value)}
              min="2000"
              max={currentYear}
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              placeholder="Bitiş"
              className="w-20 h-7 px-2 text-xs border rounded"
              value={customYearTo}
              onChange={(e) => setCustomYearTo(e.target.value)}
              min="2000"
              max={currentYear}
            />
          </div>
        </div>

        {/* Selection UI */}
        <div className="space-y-3 mb-4">
          {selections.map((selection, index) => (
            <div
              key={selection.id}
              className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg flex-wrap"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: LINE_COLORS[index % LINE_COLORS.length] }}
              />

              {/* Country Select */}
              <Select
                value={selection.countryCode}
                onValueChange={(v) => updateSelection(selection.id, "countryCode", v)}
              >
                <SelectTrigger className="w-40 h-8 text-sm">
                  <SelectValue placeholder="Ölkə seçin" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCountries ? (
                    <SelectItem value="_loading" disabled>
                      Yüklənir...
                    </SelectItem>
                  ) : (
                    countries.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.flag} {c.nameAz || c.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              {/* Data Source Select */}
              <Select
                value={selection.dataSource}
                onValueChange={(v) => updateSelection(selection.id, "dataSource", v)}
                disabled={!selection.countryCode}
              >
                <SelectTrigger className="w-36 h-8 text-sm">
                  <SelectValue placeholder="Mənbə" />
                </SelectTrigger>
                <SelectContent>
                  {getDataSourcesForCountry(selection.countryCode).map((ds) => (
                    <SelectItem
                      key={ds.code}
                      value={ds.code}
                      disabled={!ds.hasData}
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-3 h-3" />
                        {ds.name}
                        {!ds.hasData && (
                          <span className="text-xs text-slate-400">(yox)</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Market Type / Price Stage Select (shows after data source is selected) */}
              {selection.dataSource === "AGRO_AZ" && (
                <Select
                  value={selection.marketType}
                  onValueChange={(v) => updateSelection(selection.id, "marketType", v)}
                >
                  <SelectTrigger className="w-36 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKET_TYPES.map((mt) => {
                      const Icon = mt.icon;
                      return (
                        <SelectItem key={mt.code} value={mt.code}>
                          <div className="flex items-center gap-2">
                            <Icon className="w-3 h-3" />
                            {mt.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}

              {(selection.dataSource === "EUROSTAT" || selection.dataSource === "FAOSTAT") && (
                <Select
                  value={selection.priceStage}
                  onValueChange={(v) => updateSelection(selection.id, "priceStage", v)}
                >
                  <SelectTrigger className="w-40 h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRICE_STAGES.map((ps) => (
                      <SelectItem key={ps.code} value={ps.code}>
                        {ps.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0"
                onClick={() => removeSelection(selection.id)}
              >
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          ))}

          {selections.length < 5 && (
            <Button
              variant="outline"
              size="sm"
              onClick={addSelection}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ölkə / Mənbə əlavə et
            </Button>
          )}
        </div>

        {/* Chart */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : chartData.length > 0 ? (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => v.toString()}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  tickFormatter={(v) => `${v} ${targetCurrency}`}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(2)} ${targetCurrency}/${targetUnit}`,
                    seriesInfo[name]?.name || name,
                  ]}
                  labelFormatter={(year) => `${year}-ci il`}
                />
                <Legend
                  formatter={(value) => seriesInfo[value]?.name || value}
                />
                {seriesKeys.map((key, index) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={LINE_COLORS[index % LINE_COLORS.length]}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : selections.length > 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <BarChart3 className="w-12 h-12 mb-2" />
            <p>Ölkə və mənbə seçin</p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-slate-400">
            <TrendingUp className="w-12 h-12 mb-2" />
            <p>Müqayisə üçün &quot;Ölkə / Mənbə əlavə et&quot; düyməsinə basın</p>
          </div>
        )}

        {/* Data Sources Info */}
        {usedDataSources.length > 0 && (
          <div className="mt-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-xs font-medium text-slate-600 mb-2">Məlumat mənbələri:</p>
            <div className="space-y-1">
              {usedDataSources.map((sourceCode) => {
                const source = DATA_SOURCES[sourceCode as keyof typeof DATA_SOURCES];
                if (!source) return null;
                return (
                  <div key={sourceCode} className="flex items-center gap-2 text-xs text-slate-600">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: source.color }}
                    />
                    <span className="font-medium">{source.fullName}</span>
                    <span className="text-slate-400">—</span>
                    <span>{source.description}</span>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-600 flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
