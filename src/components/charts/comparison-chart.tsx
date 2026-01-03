"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format, parseISO } from "date-fns";
import { az } from "date-fns/locale";

interface ComparisonDataPoint {
  date: string;
  [key: string]: string | number;
}

interface ComparisonSeries {
  key: string;
  name: string;
  color: string;
}

interface ComparisonChartProps {
  data: ComparisonDataPoint[];
  series: ComparisonSeries[];
  height?: number;
  currency?: string;
}

const CHART_COLORS = [
  "#10b981", // emerald
  "#3b82f6", // blue
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

export function ComparisonChart({
  data,
  series,
  height = 400,
  currency = "AZN",
}: ComparisonChartProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd MMM", { locale: az });
    } catch {
      return dateStr;
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium text-slate-900 mb-2">
            {format(parseISO(label), "dd MMMM yyyy", { locale: az })}
          </p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-slate-600">{entry.name}:</span>
                </div>
                <span className="text-sm font-medium text-slate-900">
                  {entry.value?.toFixed(2)} {currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart
        data={data}
        margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#e2e8f0" }}
          domain={["dataMin - 0.1", "dataMax + 0.1"]}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: "20px" }}
          formatter={(value) => (
            <span className="text-sm text-slate-600">{value}</span>
          )}
        />
        {series.map((s, index) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color || CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

