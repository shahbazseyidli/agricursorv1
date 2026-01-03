"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  ComposedChart,
  Legend,
  ReferenceArea,
} from "recharts";
import { format, parseISO, getYear } from "date-fns";
import { az } from "date-fns/locale";

interface PriceDataPoint {
  date: string;
  priceMin: number;
  priceAvg: number;
  priceMax: number;
  market?: string;
  marketType?: string;
}

interface ComparisonDataPoint {
  marketId: string;
  marketName: string;
  marketType: string;
  data: { date: string; priceAvg: number }[];
}

interface PriceChartProps {
  data: PriceDataPoint[];
  comparisonData?: ComparisonDataPoint[];
  showRange?: boolean;
  height?: number;
  currency?: string;
}

// Distinct colors for comparison lines - daha aydın rənglər
const comparisonColors = [
  "#3b82f6", // blue
  "#f97316", // orange
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#eab308", // yellow
];

// Year band colors - alternating subtle backgrounds
const yearColors = [
  { fill: "#f0fdf4", stroke: "#86efac" }, // green-50
  { fill: "#f0f9ff", stroke: "#7dd3fc" }, // sky-50
  { fill: "#fefce8", stroke: "#fde047" }, // yellow-50
  { fill: "#fdf4ff", stroke: "#e879f9" }, // fuchsia-50
  { fill: "#fff7ed", stroke: "#fdba74" }, // orange-50
  { fill: "#f5f3ff", stroke: "#c4b5fd" }, // violet-50
];

export function PriceChart({
  data,
  comparisonData = [],
  showRange = true,
  height = 400,
  currency = "AZN",
}: PriceChartProps) {
  const isComparing = comparisonData.length > 0;
  
  const formatDateShort = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd MMM", { locale: az });
    } catch {
      return dateStr;
    }
  };

  // Calculate year bands for multi-year data
  const yearBands = (() => {
    if (data.length < 2) return [];
    
    const years = new Set<number>();
    data.forEach((point) => {
      try {
        years.add(getYear(parseISO(point.date)));
      } catch {}
    });
    
    if (years.size < 2) return []; // Don't show bands for single year
    
    const sortedYears = Array.from(years).sort();
    const bands: { year: number; startDate: string; endDate: string; colorIdx: number }[] = [];
    
    sortedYears.forEach((year, idx) => {
      const yearData = data.filter((point) => {
        try {
          return getYear(parseISO(point.date)) === year;
        } catch {
          return false;
        }
      });
      
      if (yearData.length > 0) {
        bands.push({
          year,
          startDate: yearData[0].date,
          endDate: yearData[yearData.length - 1].date,
          colorIdx: idx % yearColors.length,
        });
      }
    });
    
    return bands;
  })();

  const formatPrice = (value: number) => {
    return `${value.toFixed(2)} ${currency}`;
  };

  // Merge comparison data into main data
  const mergedData = data.map((point) => {
    const merged: any = { ...point };
    comparisonData.forEach((cd, idx) => {
      const matchingPoint = cd.data.find((d) => d.date === point.date);
      if (matchingPoint) {
        merged[`compare_${idx}`] = matchingPoint.priceAvg;
        merged[`compare_${idx}_name`] = cd.marketName;
      }
    });
    return merged;
  });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const mainData = payload.find((p: any) => p.dataKey === "priceAvg");
      const comparisonPayloads = payload.filter((p: any) => p.dataKey?.startsWith("compare_"));
      
      return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-4 min-w-[220px]">
          <p className="text-sm font-semibold text-slate-900 mb-3 pb-2 border-b border-slate-100">
            {format(parseISO(label), "dd MMMM yyyy", { locale: az })}
          </p>
          <div className="space-y-3">
            {/* Main price */}
            {mainData && (
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm text-slate-600">
                    {mainData.payload.market || "Seçilmiş bazar"}
                  </span>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  {formatPrice(mainData.value)}
                </span>
              </div>
            )}

            {/* Comparison prices */}
            {comparisonPayloads.map((cp: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: cp.stroke }}
                  />
                  <span className="text-sm text-slate-600">
                    {cp.payload[`${cp.dataKey}_name`] || `Bazar ${idx + 1}`}
                  </span>
                </div>
                <span className="text-sm font-bold" style={{ color: cp.stroke }}>
                  {formatPrice(cp.value)}
                </span>
              </div>
            ))}

            {/* Range info for main price */}
            {showRange && !isComparing && mainData?.payload?.priceMin !== undefined && (
              <div className="pt-2 mt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Aralıq:</span>
                  <span>
                    {formatPrice(mainData.payload.priceMin)} - {formatPrice(mainData.payload.priceMax)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  // Müqayisə rejimində sadə xətt qrafiki
  if (isComparing) {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={mergedData}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          {/* Year bands - background coloring for each year */}
          {yearBands.map((band) => (
            <ReferenceArea
              key={band.year}
              x1={band.startDate}
              x2={band.endDate}
              fill={yearColors[band.colorIdx].fill}
              fillOpacity={0.6}
              stroke={yearColors[band.colorIdx].stroke}
              strokeOpacity={0.3}
              label={{
                value: band.year.toString(),
                position: "insideTopLeft",
                fill: "#64748b",
                fontSize: 12,
                fontWeight: 500,
              }}
            />
          ))}
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(2)}`}
            domain={["auto", "auto"]}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
          />
          
          {/* Main line - yaşıl */}
          <Line
            type="monotone"
            dataKey="priceAvg"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ r: 4, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
            activeDot={{ r: 7, fill: "#10b981", stroke: "#fff", strokeWidth: 3 }}
            name="Seçilmiş bazar"
          />

          {/* Comparison lines - fərqli rənglərlə */}
          {comparisonData.map((cd, idx) => (
            <Line
              key={cd.marketId}
              type="monotone"
              dataKey={`compare_${idx}`}
              stroke={comparisonColors[idx % comparisonColors.length]}
              strokeWidth={3}
              dot={{ 
                r: 4, 
                fill: comparisonColors[idx % comparisonColors.length], 
                stroke: "#fff", 
                strokeWidth: 2 
              }}
              activeDot={{ 
                r: 7, 
                fill: comparisonColors[idx % comparisonColors.length], 
                stroke: "#fff", 
                strokeWidth: 3 
              }}
              name={cd.marketName}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (showRange) {
    // Range göstərən qrafik
    return (
      <ResponsiveContainer width="100%" height={height}>
        <ComposedChart
          data={mergedData}
          margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
        >
          <defs>
            <linearGradient id="priceRange" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          
          {/* Year bands - background coloring for each year */}
          {yearBands.map((band) => (
            <ReferenceArea
              key={band.year}
              x1={band.startDate}
              x2={band.endDate}
              fill={yearColors[band.colorIdx].fill}
              fillOpacity={0.6}
              stroke={yearColors[band.colorIdx].stroke}
              strokeOpacity={0.3}
              label={{
                value: band.year.toString(),
                position: "insideTopLeft",
                fill: "#64748b",
                fontSize: 12,
                fontWeight: 500,
              }}
            />
          ))}
          
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={formatDateShort}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={{ stroke: "#e2e8f0" }}
            padding={{ left: 20, right: 20 }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `${value.toFixed(2)}`}
            domain={["auto", "auto"]}
            width={60}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: 20 }}
            iconType="circle"
          />
          
          {/* Confidence band (min-max range) */}
          <Area
            type="monotone"
            dataKey="priceMax"
            stroke="none"
            fill="url(#priceRange)"
            fillOpacity={1}
            name="Qiymət aralığı"
            legendType="none"
          />
          <Area
            type="monotone"
            dataKey="priceMin"
            stroke="none"
            fill="#fff"
            fillOpacity={1}
            legendType="none"
          />
          
          {/* Min line */}
          <Line
            type="monotone"
            dataKey="priceMin"
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Minimum"
          />
          
          {/* Max line */}
          <Line
            type="monotone"
            dataKey="priceMax"
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Maksimum"
          />
          
          {/* Average line */}
          <Line
            type="monotone"
            dataKey="priceAvg"
            stroke="#10b981"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 7, fill: "#10b981", stroke: "#fff", strokeWidth: 3 }}
            name="Orta qiymət"
          />
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  // Simple line chart
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={mergedData}
        margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="date"
          tickFormatter={formatDateShort}
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          padding={{ left: 20, right: 20 }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={false}
          domain={["auto", "auto"]}
          width={60}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ paddingTop: 20 }}
          iconType="circle"
        />
        <Line
          type="monotone"
          dataKey="priceAvg"
          stroke="#10b981"
          strokeWidth={3}
          dot={false}
          activeDot={{ r: 7, fill: "#10b981", stroke: "#fff", strokeWidth: 3 }}
          name="Orta qiymət"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
