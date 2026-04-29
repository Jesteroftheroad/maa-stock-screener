"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Bar, ComposedChart,
} from "recharts";
import { fetchStockChart } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

const PERIODS = [
  { key: "1d", label: "1D" },
  { key: "1w", label: "1W" },
  { key: "1m", label: "1M" },
  { key: "3m", label: "3M" },
  { key: "1y", label: "1Y" },
  { key: "5y", label: "5Y" },
];

interface PriceChartProps {
  ticker: string;
  isPositive: boolean;
}

export function PriceChart({ ticker, isPositive }: PriceChartProps) {
  const [period, setPeriod] = useState("1m");
  const color = isPositive ? "#00ff88" : "#ff4466";

  const { data, isLoading } = useQuery({
    queryKey: ["chart", ticker, period],
    queryFn: () => fetchStockChart(ticker, period),
    staleTime: 1000 * 60 * 5,
  });

  const chartData = data?.data ?? [];

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    if (period === "1d") return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (period === "1y" || period === "5y") return d.toLocaleDateString([], { month: "short", year: "2-digit" });
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  const minPrice = chartData.length ? Math.min(...chartData.map(d => d.low)) * 0.999 : 0;
  const maxPrice = chartData.length ? Math.max(...chartData.map(d => d.high)) * 1.001 : 100;

  return (
    <div className="card p-4">
      {/* Period selector */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Price Chart</h3>
        <div className="flex gap-1">
          {PERIODS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                period === key
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-muted-var hover:text-current"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center" style={{ color: "var(--muted)" }}>
          Loading chart…
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-64 flex items-center justify-center" style={{ color: "var(--muted)" }}>
          No chart data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.25} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.4} />
            <XAxis
              dataKey="date"
              tickFormatter={formatDate}
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[minPrice, maxPrice]}
              tickFormatter={(v) => formatPrice(v)}
              tick={{ fontSize: 10, fill: "var(--muted)" }}
              tickLine={false}
              axisLine={false}
              width={68}
              yAxisId="price"
            />
            <YAxis
              yAxisId="vol"
              orientation="right"
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: "var(--card2)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                fontSize: 12,
                color: "var(--text)",
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(val: any, name: any) => [
                name === "close" ? formatPrice(val != null ? Number(val) : null) : Number(val ?? 0).toLocaleString(),
                name === "close" ? "Price" : "Volume",
              ] as [string, string]}
              labelFormatter={(label: any) => formatDate(String(label))}
            />
            <Area
              yAxisId="price"
              type="monotone"
              dataKey="close"
              stroke={color}
              strokeWidth={1.5}
              fill="url(#priceGrad)"
              dot={false}
              isAnimationActive={false}
            />
            <Bar
              yAxisId="vol"
              dataKey="volume"
              fill={color}
              opacity={0.15}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
